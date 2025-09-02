import log from "loglevel";
import semver from "semver";
import { reactive, ref } from "vue";
import type { ReleaseItem } from "../../../_data/releases";
import {
    ConnectionState,
    InstallStatus,
    type AssetPack,
    type ConnectionFlags,
    type DeviceInfo,
    type FirmwareState,
    type FlipperModule,
    type InstalledPackManifest,
    type InstalledPacks,
    type QueueItem,
    type QueueState,
    type SerialConnectionData,
    type SerialPort,
} from "../types";
import {
    fetchFirmware,
    fetchRegions,
    formatDuration,
    getCurrentLocale,
    getFirmwareDownloadUrl,
    unpack,
} from "../util";
import { useProxiedUrl } from "./useProxiedUrl";
import { useSettings } from "./useSettings";

const asyncSleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

const ASSET_PACKS_DIR = "/ext/asset_packs";
const ASSET_PACKS_TEMP_PATH = "/ext/.tmp/mntm";
const ASSET_PACKS_MANIFESTS_DIR = `${ASSET_PACKS_DIR}/.manifests`;
const ASSET_PACKS_MANIFESTS_EXT = ".pack";

declare global {
    interface Navigator {
        serial: {
            getPorts(options?: {
                filters?: Array<{ usbVendorId: number; usbProductId: number }>;
            }): Promise<SerialPort[]>;
            requestPort(options?: {
                filters?: Array<{ usbVendorId: number; usbProductId: number }>;
            }): Promise<SerialPort>;
            addEventListener(event: string, callback: (event: unknown) => void): void;
        };
    }
}

const mapErrorToUserFriendly = (error: Error): string => {
    const message = error.message.toLowerCase();

    if (
        message.includes("failed to open serial port") ||
        message.includes("failed to execute 'open' on 'serialport'") ||
        message.includes("serial port is busy")
    ) {
        return "Serial port busy";
    }
    if (message.includes("could not start rpc session")) {
        return "Couldn't start RPC session";
    }
    if (message.includes("no flipper found")) {
        return "No Flipper found";
    }
    if (message.includes("serial not supported")) {
        return "Serial not supported";
    }
    if (message.includes("connection failed") || message.includes("networkerror")) {
        return "Connection failed";
    }
    if (message.includes("timeout")) {
        return "Connection timeout";
    }
    if (error.message.length > 50) {
        return error.message.substring(0, 47) + "...";
    }

    return error.message;
};

export const useSerialConnection = () => {
    log.setLevel("debug");

    const { isSettingEnabled } = useSettings();
    interface LogEntry {
        timestamp: Date;
        level: "info" | "warning" | "error" | "success" | "debug" | "verbose";
        message: string;
    }

    const logs = reactive<LogEntry[]>([]);
    const MAX_LOGS = 500;
    const TRIM_LOGS_TO = 400;

    const addLog = (level: LogEntry["level"], message: string) => {
        logs.push({
            timestamp: new Date(),
            level,
            message,
        });

        if (logs.length > MAX_LOGS) {
            logs.splice(0, logs.length - TRIM_LOGS_TO);
        }

        switch (level) {
            case "debug":
            case "verbose":
                log.debug(message);
                break;
            case "info":
            case "success":
                log.info(message);
                break;
            case "warning":
                log.warn(message);
                break;
            case "error":
                log.error(message);
                break;
        }
    };

    const clearLogs = () => {
        logs.splice(0, logs.length);
    };

    if (typeof window === "undefined" || typeof navigator === "undefined" || !navigator.serial) {
        return {
            connectionData: reactive<SerialConnectionData>({
                state: ConnectionState.DISCONNECTED,
                installedPacks: {},
            }),
            flags: reactive<ConnectionFlags>({
                serialSupported: false,
                portSelectRequired: false,
                connected: false,
                rpcActive: false,
                rpcToggling: false,
                updateInProgress: false,
                progress: 0,
                installStatus: null,
                ableToExtract: null,
                ableToUpdate: null,
                restarting: false,
                screenStream: false,
                screenStreamPaused: false,
            }),
            queueState: reactive<QueueState>({
                queue: [],
                queueActions: [],
                fakeExtractProgress: null,
            }),
            firmwareState: reactive<FirmwareState>({
                updateStage: "",
                updateStageContext: {},
            }),
            connect: () => Promise.reject(new Error("Serial not available in SSR")),
            disconnect: () => Promise.reject(new Error("Serial not available in SSR")),
            installAssetPack: () => Promise.reject(new Error("Serial not available in SSR")),
            enqueue: () => Promise.reject(new Error("Serial not available in SSR")),
            updateExtractCapability: () => Promise.reject(new Error("Serial not available in SSR")),
            updateFirmwareCapability: () =>
                Promise.reject(new Error("Serial not available in SSR")),
            updateFirmware: () => Promise.reject(new Error("Serial not available in SSR")),
            restartRpc: () => Promise.reject(new Error("Serial not available in SSR")),
            startRpc: () => Promise.reject(new Error("Serial not available in SSR")),
            stopRpc: () => Promise.reject(new Error("Serial not available in SSR")),
            readBasicInfo: () => Promise.reject(new Error("Serial not available in SSR")),
            findKnownDevices: () => Promise.reject(new Error("Serial not available in SSR")),
            requestPort: () => Promise.reject(new Error("Serial not available in SSR")),
            loadInstalledPacks: () => Promise.reject(new Error("Serial not available in SSR")),
            logs: reactive<LogEntry[]>([]),
            addLog: () => {},
            clearLogs: () => {},
            testConnecting: () => Promise.reject(new Error("Serial not available in SSR")),
            testUpdateFirmware: () => Promise.reject(new Error("Serial not available in SSR")),
            startScreenStream: () => Promise.reject(new Error("Serial not available in SSR")),
            stopScreenStream: () => Promise.reject(new Error("Serial not available in SSR")),
            screenScale: { value: 4 },
        };
    }

    let flipper: FlipperModule | null = null;
    const getFlipperModule = async (): Promise<FlipperModule> => {
        if (!flipper) {
            // @ts-expect-error - dynamic import of js module
            flipper = await import("../flipper/core");
        }
        return flipper!;
    };

    const connectionData = reactive<SerialConnectionData>({
        state: ConnectionState.DISCONNECTED,
        installedPacks: {},
    });

    const flags = reactive<ConnectionFlags>({
        serialSupported: "serial" in navigator,
        portSelectRequired: false,
        connected: false,
        rpcActive: false,
        rpcToggling: false,
        updateInProgress: false,
        progress: 0,
        installStatus: null,
        ableToExtract: null,
        ableToUpdate: null,
        restarting: false,
        screenStream: false,
        screenStreamPaused: false,
    });

    const queueState = reactive<QueueState>({
        queue: [],
        queueActions: [],
        fakeExtractProgress: null,
    });

    const firmwareState = reactive<FirmwareState>({
        updateStage: "",
        updateStageContext: {},
    });

    const setUpdateStage = (stage: string, context?: Record<string, string | number>) => {
        firmwareState.updateStage = stage;
        firmwareState.updateStageContext = context || {};
    };

    navigator.serial.addEventListener("disconnect", () => {
        if (flags.connected) {
            addLog("info", "[Serial] Physical disconnect detected - disconnected");
            resetFlagsAndState();
        }
    });

    navigator.serial.addEventListener("connect", () => {
        if (flags.connected) {
            addLog("info", "[Serial] Flipper is already connected, skipping connection");
            return;
        }

        if (isSettingEnabled("autoConnect")) {
            addLog("info", "[Serial] Autoconnect enabled, attempting auto-connect");
            autoConnect(1, 500);
        }
    });

    const resetFlagsAndState = () => {
        flags.connected = false;
        flags.rpcActive = false;
        flags.rpcToggling = false;
        flags.portSelectRequired = true;
        flags.progress = 0;
        flags.installStatus = null;
        flags.ableToExtract = null;
        flags.ableToUpdate = null;
        flags.restarting = false;
        flags.screenStream = false;
        flags.screenStreamPaused = false;
        connectionData.state = ConnectionState.DISCONNECTED;
        connectionData.deviceInfo = undefined;
        connectionData.error = undefined;
        connectionData.installedPacks = {};
        queueState.queue = [];
        queueState.queueActions = [];
        if (queueState.fakeExtractProgress !== null) {
            clearInterval(queueState.fakeExtractProgress);
            queueState.fakeExtractProgress = null;
        }

        loadingInstalledPacks = false;
    };

    const performCleanup = async () => {
        const wasConnected = flags.connected;
        connectionData.state = ConnectionState.DISCONNECTING;
        addLog("info", "[Serial] Starting cleanup process");

        try {
            if (flipper) {
                const flipperModule = await Promise.race([
                    getFlipperModule(),
                    new Promise<FlipperModule>((_, reject) =>
                        setTimeout(() => reject(new Error("timeout")), 2000),
                    ),
                ]);

                if (wasConnected) {
                    await Promise.race([
                        stopRpc(),
                        new Promise((_, reject) =>
                            setTimeout(() => reject(new Error("timeout")), 2000),
                        ),
                    ]).catch((error) => addLog("warning", `[Serial] stopRpc failed: ${error}`));
                    await asyncSleep(100);
                }

                await Promise.race([
                    flipperModule.closeReader(),
                    new Promise((_, reject) =>
                        setTimeout(() => reject(new Error("timeout")), 2000),
                    ),
                ]).catch((error) => addLog("warning", `[Serial] closeReader failed: ${error}`));

                await asyncSleep(100);

                await Promise.race([
                    flipperModule.disconnect(),
                    new Promise((_, reject) =>
                        setTimeout(() => reject(new Error("timeout")), 2000),
                    ),
                ]).catch((error) => addLog("warning", `[Serial] disconnect failed: ${error}`));

                await asyncSleep(100);

                if (flipperModule.emitter?.events) {
                    flipperModule.emitter.removeAllListeners?.();
                    flipperModule.emitter.events = {};
                }

                try {
                    const rpcModule = (await Promise.race([
                        // @ts-expect-error - flipper module is JavaScript
                        import("../flipper/protobuf/rpc"),
                        new Promise((_, reject) =>
                            setTimeout(() => reject(new Error("timeout")), 2000),
                        ),
                    ])) as { flushCommandQueue: () => void };
                    rpcModule.flushCommandQueue();
                } catch (error) {
                    addLog("warning", `[Serial] flush command queue failed: ${error}`);
                }

                flipper = null;
            }

            if (typeof navigator !== "undefined" && navigator.serial) {
                const ports = await navigator.serial.getPorts();
                for (const port of ports) {
                    if (port.readable || port.writable) {
                        try {
                            if (port.readable?.locked) await port.readable.cancel();
                            if (port.writable?.locked) await port.writable.abort();
                            if (port.opened) await port.close();
                        } catch (error) {
                            addLog("warning", `[Serial] Failed to close port: ${error}`);
                        }
                    }
                }
            }
        } catch (error) {
            addLog("error", `[Serial] Cleanup error: ${error}`);
        } finally {
            resetFlagsAndState();
            flipper = null;
            addLog("info", "[Serial] Cleanup completed - disconnected");
        }
    };

    const findKnownDevices = async () => {
        const filters = [{ usbVendorId: 0x0483, usbProductId: 0x5740 }];
        const ports = await navigator.serial.getPorts({ filters });
        return ports;
    };

    const startRpc = async () => {
        flags.rpcToggling = true;

        try {
            const flipperModule = await getFlipperModule();
            addLog("verbose", "[RPC] Starting session with flipper");
            const ping = await flipperModule.commands.startRpcSession(flipperModule);

            if (!ping.resolved || ping.error) {
                throw new Error("Could not start RPC session");
            }

            flags.rpcActive = true;
            flags.rpcToggling = false;
            addLog("success", "[Serial] RPC session started successfully");
        } catch (error) {
            flags.rpcToggling = false;
            addLog("error", `[Serial] RPC session failed: ${error}`);
            throw error;
        }
    };

    const stopRpc = async () => {
        flags.rpcToggling = true;
        addLog("debug", "[Serial] Stopping RPC session");

        try {
            const flipperModule = await getFlipperModule();
            addLog("verbose", "[RPC] Stopping session");
            await flipperModule.commands.stopRpcSession();
            flags.rpcActive = false;
            flags.rpcToggling = false;
            addLog("info", "[Serial] RPC session stopped");
        } catch (error) {
            flags.rpcToggling = false;
            addLog("warning", `[Serial] Warning: RPC session stop failed: ${error}`);
        }
    };

    const requestPort = async () => {
        const filters = [{ usbVendorId: 0x0483, usbProductId: 0x5740 }];
        try {
            const port = await navigator.serial.requestPort({ filters });
            return port;
        } catch (error) {
            if (
                error instanceof Error &&
                error.name === "NotFoundError" &&
                error.message.includes("No port selected by the user")
            ) {
                throw new Error("USER_CANCELED");
            }
            throw error;
        }
    };

    const readBasicInfo = async (): Promise<DeviceInfo> => {
        const info: DeviceInfo = {};

        try {
            const flipperModule = await getFlipperModule();
            addLog("verbose", "[Flipper] Reading system information");
            const deviceInfo = await flipperModule.commands.system.deviceInfo();
            for (const line of deviceInfo) {
                info[line.key] = line.value;
            }
            addLog("verbose", "[Flipper] Reading power status");
            const powerInfo = await flipperModule.commands.system.powerInfo();
            for (const line of powerInfo) {
                info[line.key] = line.value;
            }

            info.storage_sdcard_present = "loading";
            info.storage_databases_present = "loading";
            info.storage_sdcard_totalSpace = null;
            info.storage_sdcard_freeSpace = null;

            connectionData.deviceInfo = info;

            const currentLocale = getCurrentLocale();
            const localizedReleasesPath = `${currentLocale === "en" ? "" : "/" + currentLocale}/releases`;
            addLog(
                "debug",
                `[Misc] Current locale: ${currentLocale}, Localized releases path: ${localizedReleasesPath}`,
            );

            const commitLink = info.firmware_commit
                ? `<a href="${localizedReleasesPath}/${info.firmware_commit}" target="_blank">${info.firmware_commit}</a>`
                : "???";
            const branchLink = info.firmware_branch
                ? `<a href="${info.firmware_origin_git || ""}/tree/${info.firmware_branch}" target="_blank">${info.firmware_branch}</a>`
                : "???";
            addLog(
                "info",
                `[Serial] Flipper info loaded - ${info.hardware_name || "???"} (${info.firmware_version || "???"}, ${commitLink}, ${branchLink})`,
            );
            readStorageInfo();

            return info;
        } catch (error) {
            addLog("error", `[Serial] Failed to read basic info: ${error}`);
            throw error;
        }
    };

    const readStorageInfo = async () => {
        if (!connectionData.deviceInfo || !flipper) return;
        const updatedInfo = { ...connectionData.deviceInfo };

        try {
            const extList = await flipper.commands.storage.list("/ext");
            if (extList && Array.isArray(extList) && extList.length) {
                const manifest = extList.find((e) => e.name === "Manifest");
                updatedInfo.storage_databases_present = manifest ? "installed" : "missing";

                const extInfo = await flipper.commands.storage.info("/ext");
                updatedInfo.storage_sdcard_present = "installed";
                updatedInfo.storage_sdcard_totalSpace = extInfo.totalSpace;
                updatedInfo.storage_sdcard_freeSpace = extInfo.freeSpace;
                addLog(
                    "debug",
                    `[Serial] SD card detected - ${Math.round(extInfo.freeSpace / 1024 / 1024)}MB free`,
                );
            } else {
                updatedInfo.storage_sdcard_present = "missing";
                updatedInfo.storage_databases_present = "missing";
                addLog("debug", "[Serial] No SD card detected");
            }
        } catch (error) {
            addLog("warning", `[Serial] Failed to read /ext storage info: ${error}`);
            updatedInfo.storage_sdcard_present = "missing";
            updatedInfo.storage_databases_present = "missing";
        }

        try {
            addLog("verbose", "[Storage] Reading /int storage information");
            const intInfo = await flipper.commands.storage.info("/int");
            updatedInfo.storage_internal_totalSpace = intInfo.totalSpace;
            updatedInfo.storage_internal_freeSpace = intInfo.freeSpace;
        } catch (error) {
            addLog("warning", `[Serial] Failed to read internal storage info: ${error}`);
        }

        connectionData.deviceInfo = updatedInfo;
    };

    const autoConnect = async (maxRetries = 5, delayMs = 1000): Promise<boolean> => {
        try {
            const ports = await findKnownDevices();
            if (ports.length === 0) {
                addLog("info", "[Serial] No known devices found, skipping auto-connect");
                return false;
            }
        } catch {
            return false;
        }

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                await connect();
                if (flags.connected && flags.rpcActive) return true;
            } catch (error) {
                const errorMessage =
                    error instanceof Error
                        ? error.message.toLowerCase()
                        : String(error).toLowerCase();

                if (
                    errorMessage.includes("failed to open serial port") ||
                    errorMessage.includes("failed to execute 'open' on 'serialport'") ||
                    errorMessage.includes("serial port is busy")
                ) {
                    addLog("warning", `[Serial] Auto-connect stopped`);
                    return false;
                }

                addLog(
                    "warning",
                    `[Serial] Auto-connect attempt ${attempt} failed: ${error instanceof Error ? error.message : error}`,
                );
            }
            await asyncSleep(delayMs);
        }
        addLog("error", `[Serial] Auto-connect failed after ${maxRetries} attempts`);
        return false;
    };

    const connect = async () => {
        if (!flags.serialSupported) {
            addLog("error", "[Serial] Web Serial API not supported in this browser");
            connectionData.state = ConnectionState.ERROR;
            connectionData.error = "Serial not supported";
            return;
        }
        if (flags.connected) return;

        connectionData.state = ConnectionState.CONNECTING;
        connectionData.error = undefined;
        flags.portSelectRequired = false;
        if (isSettingEnabled("clearLogs")) {
            clearLogs();
        }

        try {
            flipper = await getFlipperModule();

            try {
                flipper.emitter.events = {};

                // @ts-expect-error - flipper module is JavaScript
                const rpcModule = await import("../flipper/protobuf/rpc");
                rpcModule.flushCommandQueue();

                try {
                    await flipper.closeReader();
                } catch {
                    addLog("debug", "[Serial] No existing reader to close");
                }
            } catch (error) {
                addLog(
                    "debug",
                    `[Serial] Proactive cleanup completed with some errors (normal): ${error}`,
                );
            }

            await asyncSleep(500);
            let ports = await findKnownDevices();

            if (ports.length === 0) {
                addLog("debug", "[Serial] No known devices found, requesting port selection");
                try {
                    await requestPort();
                    ports = await findKnownDevices();
                } catch (error) {
                    if (error instanceof Error && error.message === "USER_CANCELED") {
                        addLog("info", "[Serial] User canceled port selection");
                        connectionData.state = ConnectionState.DISCONNECTED;
                        connectionData.error = undefined;
                        return;
                    }
                }
            }

            if (ports.length === 0) {
                flags.portSelectRequired = true;
                throw new Error("No known ports");
            }

            addLog("debug", `[Serial] Found ${ports.length} device(s), attempting connection`);
            try {
                addLog("verbose", "[Connection] Establishing serial connection");
                await flipper.connect();
                flags.connected = true;
            } catch (flipperError) {
                if (
                    flipperError instanceof Error &&
                    (flipperError.message.includes("Cannot cancel a locked stream") ||
                        flipperError.message.includes("locked to a reader"))
                ) {
                    addLog("debug", "[Serial] Port locked, attempting recovery");
                    try {
                        addLog("verbose", "[Connection] Closing serial reader for recovery");
                        await flipper.closeReader();
                        await new Promise((resolve) => setTimeout(resolve, 1000));
                        addLog("verbose", "[Connection] Reconnecting after recovery");
                        await flipper.connect();
                        flags.connected = true;
                        addLog("info", "[Serial] Physical connection established after recovery");
                    } catch (retryError) {
                        addLog("error", `[Serial] Retry failed: ${retryError}`);
                        throw new Error("Serial port is busy - please close other connections");
                    }
                } else {
                    throw flipperError;
                }
            }

            try {
                const rpcTimeout = new Promise<never>((_, reject) => {
                    setTimeout(() => {
                        reject(new Error("RPC_TIMEOUT"));
                    }, 5000);
                });

                addLog("verbose", "[RPC] Starting session after connection");
                await Promise.race([startRpc(), rpcTimeout]);
            } catch (rpcError) {
                if (rpcError instanceof Error && rpcError.message === "RPC_TIMEOUT") {
                    addLog("warning", "[Serial] RPC timeout - flipper appears to be locked");
                    resetFlagsAndState();
                    connectionData.state = ConnectionState.LOCKED;
                    connectionData.error =
                        "Flipper appears to be locked - please unlock and try again";
                    return;
                } else {
                    throw rpcError;
                }
            }
            addLog("verbose", "[Flipper] Reading basic information");
            await readBasicInfo();
            // small delay to not conflict the the storage info stuff before, causing either sdcard size not to load or installed packs not to load
            await asyncSleep(100);
            await updateExtractCapability();
            await updateFirmwareCapability();

            flipper.emitter.on("disconnect", () => {
                resetFlagsAndState();
            });

            connectionData.state = ConnectionState.CONNECTED;
            addLog(
                "success",
                `[Serial] Hello ${connectionData.deviceInfo?.hardware_name}... you are connected!`,
            );
        } catch (error) {
            flags.connected = false;
            flags.rpcActive = false;

            if (error instanceof Error && error.message === "No known ports") {
                flags.portSelectRequired = true;
                connectionData.state = ConnectionState.DISCONNECTED;
                return;
            }

            const userFriendlyError =
                error instanceof Error ? mapErrorToUserFriendly(error) : "Connection failed";

            connectionData.state = ConnectionState.ERROR;
            connectionData.error = userFriendlyError;
            addLog("error", `[Serial] Connection failed: ${userFriendlyError}`);
            throw error;
        }
    };

    const disconnect = async () => {
        addLog("verbose", "[Connection] Disconnecting and cleaning up");
        await performCleanup();
    };

    const installAssetPack = async (packUrl: string) => {
        if (!flags.connected || !flipper) {
            addLog("error", "[Serial] Cannot install: flipper not connected");
            throw new Error("Flipper not connected");
        }

        try {
            const proxiedUrl = useProxiedUrl(packUrl);

            const response = await fetch(proxiedUrl);
            if (!response.ok) {
                throw new Error(`Failed to download: ${response.statusText}`);
            }

            const arrayBuffer = await response.arrayBuffer();
            const fileName = packUrl.split("/").pop() || "asset_pack.zip";

            addLog("verbose", `[File] Writing asset pack file: ${fileName}`);
            await flipper.commands.storage.write(`/ext/apps/${fileName}`, arrayBuffer);
        } catch (error) {
            throw new Error(
                `Installation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
            );
        }
    };

    const mkdirParents = async (path: string): Promise<void> => {
        if (!flipper) throw new Error("Flipper not connected");

        if (path.endsWith("/")) {
            path = path.slice(0, -1);
        }
        let full = "";
        for (const segment of path.split("/")) {
            if (full !== "/") {
                full += "/";
            }
            full += segment;
            if (full.length < "/ext/*".length) {
                continue; // Cannot mkdir filesystems root, needs to be atleast fs root + 1 char
            }
            try {
                addLog("verbose", `[Directory] Creating directory: ${full}`);
                await flipper.commands.storage.mkdir(full);
                addLog("debug", `[AssetPacks] storage.mkdir: ${full}`);
            } catch (error) {
                addLog("warning", `[AssetPacks] storage.mkdir failed for ${full}: ${error}`);
            }
        }
    };

    const removeOldPacks = async (pack: AssetPack): Promise<void> => {
        if (!flipper) throw new Error("Flipper not connected");

        const installed = connectionData.installedPacks[pack.id];
        if (!installed) return;

        for (const folder of installed.folders) {
            const packFolder = `${ASSET_PACKS_DIR}/${folder}`;
            try {
                addLog("verbose", `[Cleanup] Removing pack folder: ${packFolder}`);
                await flipper.commands.storage.remove(packFolder, true);
                addLog("debug", `[AssetPacks] storage.remove: ${packFolder}`);
            } catch (error) {
                addLog("warning", `[AssetPacks] storage.remove failed for ${packFolder}: ${error}`);
            }
        }

        const manifestPath = `${ASSET_PACKS_MANIFESTS_DIR}/${pack.id}${ASSET_PACKS_MANIFESTS_EXT}`;
        try {
            addLog("verbose", `[Cleanup] Removing pack manifest: ${manifestPath}`);
            await flipper.commands.storage.remove(manifestPath, false);
            addLog("debug", `[AssetPacks] storage.remove: ${manifestPath}`);
        } catch (error) {
            addLog("warning", `[AssetPacks] storage.remove failed for ${manifestPath}: ${error}`);
        }
    };

    const downloadPackWithProgress = async (
        pack: AssetPack,
        setProgress: (progress: number) => void,
    ): Promise<Uint8Array> => {
        const packFile = pack.tarFile;

        if (!packFile?.url || !packFile?.sha256) {
            addLog(
                "error",
                `[AssetPacks] Missing tarFile data for pack ${pack.id}: ${JSON.stringify(packFile)}`,
            );
            throw new Error(`Pack ${pack.id} is missing required tarFile data`);
        }

        const packUrl = `${packFile.url}?sha256=${packFile.sha256}`;
        const proxiedUrl = useProxiedUrl(packUrl);
        const response = await fetch(proxiedUrl);

        if (response.status >= 400) {
            throw new Error("Pack returned " + response.status);
        }

        const totalLength = Number(response.headers.get("content-length"));
        const reader = response.body!.getReader();
        let receivedLength = 0;
        const chunks: Uint8Array[] = [];

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
            receivedLength += value.length;
            setProgress(receivedLength / totalLength);
        }

        const chunksAll = new Uint8Array(receivedLength);
        let position = 0;
        for (const chunk of chunks) {
            chunksAll.set(chunk, position);
            position += chunk.length;
        }

        addLog("debug", `[AssetPacks] Downloaded pack from ${proxiedUrl}`);
        return chunksAll;
    };

    const writePackToDevice = async (
        tempFile: string,
        packTar: Uint8Array,
        setProgress: (progress: number) => void,
    ): Promise<void> => {
        if (!flipper) throw new Error("Flipper not connected");

        const unbind = flipper.emitter.on<{ progress: number; total: number }>(
            "storageWriteRequest/progress",
            (e) => {
                setProgress(e.progress / e.total);
            },
        );

        const start = performance.now();
        try {
            addLog("verbose", `[Transfer] Writing pack data to flipper: ${tempFile}`);
            await flipper.commands.storage.write(tempFile, packTar);
            const took = performance.now() - start;
            addLog("debug", `[AssetPacks] storage.write: ${tempFile} took ${Math.round(took)}ms`);
        } finally {
            unbind();
        }
    };

    const extractPackOnDevice = async (
        tempFile: string,
        setProgress: (progress: number) => void,
    ): Promise<void> => {
        if (!flipper) throw new Error("Flipper not connected");

        const start = performance.now();
        let took = 0;

        // Fake progress for extraction since we can't get real progress
        const expectedExtractTime = 10000; // 10 seconds estimate
        queueState.fakeExtractProgress = setInterval(() => {
            const elapsed = performance.now() - start;
            setProgress(Math.min(elapsed / expectedExtractTime, 0.99));
        }, 250);

        try {
            addLog(
                "verbose",
                `[Extract] Extracting pack archive: ${tempFile} to ${ASSET_PACKS_DIR}`,
            );
            await flipper.commands.storage.tarExtract(tempFile, ASSET_PACKS_DIR);
            took = performance.now() - start;
            addLog(
                "debug",
                `[AssetPacks] storage.tarExtract: ${tempFile} to ${ASSET_PACKS_DIR} took ${Math.round(took)}ms`,
            );
        } finally {
            if (queueState.fakeExtractProgress !== null) {
                clearInterval(queueState.fakeExtractProgress);
                queueState.fakeExtractProgress = null;
            }
            setProgress(1);
        }
    };

    const createManifest = async (pack: AssetPack): Promise<void> => {
        if (!flipper) throw new Error("Flipper not connected");

        const manifestPath = `${ASSET_PACKS_MANIFESTS_DIR}/${pack.id}${ASSET_PACKS_MANIFESTS_EXT}`;
        const manifest = {
            sha256: pack.tarFile?.sha256 || "",
            folders: pack.stats?.folders || [],
        };
        const manifestData = new TextEncoder().encode(JSON.stringify(manifest));

        try {
            addLog("verbose", `[Manifest] Writing pack manifest: ${manifestPath}`);
            await flipper.commands.storage.write(manifestPath, manifestData);
            addLog("debug", `[AssetPacks] storage.write: ${manifestPath}`);
            connectionData.installedPacks[pack.id] = manifest;
        } catch (error) {
            addLog("error", `[AssetPacks] storage.write failed for ${manifestPath}: ${error}`);
            throw error;
        }
    };

    const loadPackManifest = async (path: string): Promise<InstalledPackManifest | null> => {
        if (!flipper) throw new Error("Flipper not connected");

        try {
            addLog("verbose", `[Manifest] Reading pack manifest: ${path}`);
            const raw = await flipper.commands.storage.read(path);
            const text = new TextDecoder().decode(raw);
            const json = JSON.parse(text);

            if (!json.sha256 || !Array.isArray(json.folders)) {
                addLog(
                    "warning",
                    `[Serial] Invalid manifest format for ${path}: ${JSON.stringify({
                        hasSha256: !!json.sha256,
                        foldersIsArray: Array.isArray(json.folders),
                        json: json,
                    })}`,
                );
                return null;
            }

            return {
                sha256: json.sha256,
                folders: json.folders,
            };
        } catch {
            addLog("warning", `[Serial] Failed to load pack manifest: ${path}`);
            return null;
        }
    };

    let loadingInstalledPacks = false;
    const loadInstalledPacks = async (): Promise<InstalledPacks> => {
        if (!flipper) throw new Error("Flipper not connected");

        if (!flags.connected || !flags.rpcActive) {
            return {};
        }

        if (loadingInstalledPacks) {
            addLog("debug", "[Serial] Already loading installed packs, skipping duplicate call");
            return connectionData.installedPacks;
        }

        loadingInstalledPacks = true;
        const installed: InstalledPacks = {};
        addLog("debug", "[Serial] Loading installed asset packs");

        try {
            addLog(
                "verbose",
                `[Discovery] Listing installed pack manifests: ${ASSET_PACKS_MANIFESTS_DIR}`,
            );
            const manifests = await flipper.commands.storage.list(ASSET_PACKS_MANIFESTS_DIR);

            for (const manifest of manifests) {
                if (manifest.type === 1 || !manifest.size) {
                    continue;
                }
                if (!manifest.name.endsWith(ASSET_PACKS_MANIFESTS_EXT)) {
                    continue;
                }

                const packId = manifest.name.slice(0, -ASSET_PACKS_MANIFESTS_EXT.length);

                addLog("verbose", `[Manifest] Loading pack manifest: ${packId}`);
                const manifestData = await loadPackManifest(
                    `${ASSET_PACKS_MANIFESTS_DIR}/${manifest.name}`,
                );
                if (manifestData) {
                    installed[packId] = manifestData;
                }
            }

            const packCount = Object.keys(installed).length;
            if (packCount > 0) {
                addLog("info", `[Serial] Found ${packCount} installed asset pack(s)`);
            }
        } catch (error) {
            if (error === "ERROR_STORAGE_NOT_EXIST") {
                addLog("debug", "[Serial] Asset packs directory not found (normal for first use)");
                loadingInstalledPacks = false;
                return {};
            }
            addLog("warning", `[Serial] Failed to load installed packs: ${error}`);
            loadingInstalledPacks = false;
            return {};
        } finally {
            loadingInstalledPacks = false;
        }

        connectionData.installedPacks = installed;
        return installed;
    };

    const processInstallPack = async (pack: AssetPack): Promise<void> => {
        if (!flipper) throw new Error("Flipper not connected");

        const stepCount = 3;
        let step = -1;

        const setProgress = (progress: number) => {
            flags.progress = progress / stepCount + (1 / stepCount) * step;
        };

        addLog("info", `[AssetPacks] Starting installation of pack: ${pack.id}`);
        flags.progress = 0;
        flags.installStatus = InstallStatus.LOADING;
        step++;

        addLog("verbose", `[Download] Downloading asset pack: ${pack.id}`);
        const packTar = await downloadPackWithProgress(pack, setProgress).catch((error) => {
            addLog("error", `[AssetPacks] ${error.toString()}`);
            throw new Error(error.toString());
        });

        flags.installStatus = InstallStatus.CLEANUP;
        addLog("verbose", `[Cleanup] Removing old pack versions: ${pack.id}`);
        await removeOldPacks(pack);

        flags.installStatus = InstallStatus.COPYING;
        step++;

        addLog("verbose", "[Directory] Creating asset pack manifest directories");
        await mkdirParents(ASSET_PACKS_MANIFESTS_DIR);
        addLog("verbose", "[Directory] Creating temporary pack directories");
        await mkdirParents(ASSET_PACKS_TEMP_PATH);
        const tempFile = `${ASSET_PACKS_TEMP_PATH}/${pack.id}.tar.gz`;

        addLog("verbose", `[Transfer] Writing pack to flipper: ${tempFile}`);
        await writePackToDevice(tempFile, packTar, setProgress);

        flags.installStatus = InstallStatus.EXTRACT;
        step++;

        addLog("verbose", `[Extract] Extracting pack on flipper: ${tempFile}`);
        await extractPackOnDevice(tempFile, setProgress);

        flags.installStatus = InstallStatus.CLEANUP;
        try {
            addLog("verbose", `[Cleanup] Cleaning up temporary file: ${tempFile}`);
            await flipper.commands.storage.remove(tempFile, false);
            addLog("debug", `[AssetPacks] storage.remove: ${tempFile}`);
        } catch (error) {
            addLog("warning", `[AssetPacks] storage.remove failed for ${tempFile}: ${error}`);
        }

        addLog("verbose", `[Manifest] Creating pack manifest: ${pack.id}`);
        await createManifest(pack);
        addLog("info", `[AssetPacks] Successfully installed pack: ${pack.id}`);
    };

    const processRemovePack = async (pack: AssetPack): Promise<void> => {
        addLog("info", `[AssetPacks] Removing pack: ${pack.id}`);
        flags.installStatus = InstallStatus.DELETING;
        addLog("verbose", `[Cleanup] Removing pack: ${pack.id}`);
        await removeOldPacks(pack);
        delete connectionData.installedPacks[pack.id];
        addLog("info", `[AssetPacks] Successfully removed pack: ${pack.id}`);
    };

    const enqueue = async (pack: AssetPack, action: "install" | "remove"): Promise<boolean> => {
        if (!flags.serialSupported) return false;
        if (!flags.connected || !connectionData.deviceInfo || !flags.rpcActive) {
            throw new Error("Flipper not connected or RPC not active");
        }

        queueState.queue.push(pack as unknown as QueueItem);
        queueState.queueActions.push(action);

        if (queueState.queue.length > 1) {
            return false;
        }

        while (queueState.queue.length > 0) {
            try {
                const currentPack = queueState.queue[0] as unknown as AssetPack;
                const currentAction = queueState.queueActions[0];

                if (currentAction === "remove") {
                    addLog("verbose", `[Queue] Processing pack removal: ${currentPack.id}`);
                    await processRemovePack(currentPack);
                } else if (currentAction === "install") {
                    addLog("verbose", `[Queue] Processing pack installation: ${currentPack.id}`);
                    await processInstallPack(currentPack);
                }
            } finally {
                queueState.queue.shift();
                queueState.queueActions.shift();
                flags.installStatus = null;
                flags.progress = 0;
            }
        }

        return true;
    };

    const updateExtractCapability = async (): Promise<void> => {
        if (!connectionData.deviceInfo) return;

        try {
            // supports tar extraction = (firmware >= 0.23.0)
            const majorVersion = connectionData.deviceInfo.protobuf_version_major || 0;
            const minorVersion = connectionData.deviceInfo.protobuf_version_minor || 0;
            const version = `${majorVersion}.${minorVersion}.0`;

            flags.ableToExtract =
                !semver.lt(version, "0.23.0") ||
                connectionData.deviceInfo.firmware_origin_fork !== "Momentum" ||
                !(
                    typeof connectionData.deviceInfo.firmware_version === "string" &&
                    connectionData.deviceInfo.firmware_version.includes("mntm")
                );

            addLog(
                "debug",
                `[Serial] Extract capability: ${flags.ableToExtract ? "supported" : "not supported"} (version: ${version})`,
            );
        } catch (error) {
            addLog("warning", `[AssetPacks] Failed to check extract capability: ${error}`);
            flags.ableToExtract = false;
        }
    };

    const updateFirmwareCapability = async (): Promise<void> => {
        if (!connectionData.deviceInfo) return;

        try {
            // supports firmware update = (protobuf version >= 0.6.0)
            const majorVersion = connectionData.deviceInfo.protobuf_version_major || 0;
            const minorVersion = connectionData.deviceInfo.protobuf_version_minor || 0;
            const version = `${majorVersion}.${minorVersion}.0`;

            flags.ableToUpdate = !semver.lt(version, "0.6.0");

            addLog(
                "debug",
                `[Serial] Firmware update capability: ${flags.ableToUpdate ? "supported" : "not supported"} (version: ${version})`,
            );
        } catch (error) {
            addLog("warning", `[Firmware] Failed to check firmware update capability: ${error}`);
            flags.ableToUpdate = false;
        }
    };

    const screenScale = ref(2);
    let screenStreamUnbind: (() => void) | null = null;
    let screenStreamStopUnbind: (() => void) | null = null;
    let screenStreamRestartUnbind: (() => void) | null = null;

    const startScreenStream = async (canvasRef: HTMLCanvasElement) => {
        if (!flags.connected || !flags.rpcActive) {
            throw new Error("Flipper not connected or RPC not active");
        }

        if (flags.screenStream) {
            return;
        }

        try {
            const flipperModule = await getFlipperModule();
            addLog("verbose", "[Stream] Starting screen stream from flipper");
            await flipperModule.commands.gui.startScreenStreamRequest();

            flags.screenStream = true;

            const ctx = canvasRef.getContext("2d");
            if (!ctx) {
                throw new Error("Failed to get canvas context");
            }

            ctx.lineWidth = 1;
            ctx.lineCap = "square";
            ctx.imageSmoothingEnabled = false;
            ctx.fillStyle = "#fe8a2b";
            ctx.fillRect(0, 0, 128 * screenScale.value, 64 * screenScale.value);
            ctx.fillStyle = "black";

            let lastFrameTime = Date.now();

            screenStreamUnbind = flipperModule.emitter.on("screen frame", (data: Uint8Array) => {
                lastFrameTime = Date.now();

                for (let x = 0; x < 128; x++) {
                    for (let y = 0; y < 64; y++) {
                        const i = Math.floor(y / 8) * 128 + x;
                        const z = y & 7;
                        if ((data.at(i) || 0) & (1 << z)) {
                            ctx.fillStyle = "black";
                            ctx.fillRect(
                                x * screenScale.value,
                                y * screenScale.value,
                                1 * screenScale.value,
                                1 * screenScale.value,
                            );
                        } else {
                            ctx.fillStyle = "#fe8a2b";
                            ctx.fillRect(
                                x * screenScale.value,
                                y * screenScale.value,
                                1 * screenScale.value,
                                1 * screenScale.value,
                            );
                        }
                    }
                }
            });

            const frameTimeout = setInterval(() => {
                if (flags.screenStream && Date.now() - lastFrameTime > 5000) {
                    clearInterval(frameTimeout);
                }
            }, 5000);

            screenStreamStopUnbind = flipperModule.emitter.on("stop screen streaming", () => {
                flags.screenStream = false;
                clearInterval(frameTimeout);
                if (screenStreamUnbind) screenStreamUnbind();
                if (screenStreamStopUnbind) screenStreamStopUnbind();
                screenStreamUnbind = null;
                screenStreamStopUnbind = null;
            });

            screenStreamRestartUnbind = flipperModule.emitter.on("restart session", () => {
                flags.screenStream = false;
                clearInterval(frameTimeout);
                if (screenStreamUnbind) screenStreamUnbind();
                if (screenStreamStopUnbind) screenStreamStopUnbind();
                if (screenStreamRestartUnbind) screenStreamRestartUnbind();
                screenStreamUnbind = null;
                screenStreamStopUnbind = null;
                screenStreamRestartUnbind = null;
            });
        } catch (error) {
            flags.screenStream = false;
            throw error;
        }
    };

    const stopScreenStream = async () => {
        if (!flags.connected || !flags.rpcActive) {
            return;
        }

        const flipperModule = await getFlipperModule();
        addLog("verbose", "[Stream] Stopping screen stream");
        await flipperModule.commands.gui.stopScreenStreamRequest();

        flags.screenStream = false;

        if (screenStreamUnbind) screenStreamUnbind();
        if (screenStreamStopUnbind) screenStreamStopUnbind();
        if (screenStreamRestartUnbind) screenStreamRestartUnbind();
        screenStreamUnbind = null;
        screenStreamStopUnbind = null;
        screenStreamRestartUnbind = null;
    };

    const loadFirmware = async (release?: ReleaseItem, uploadedFile?: File): Promise<void> => {
        if (!flags.connected || !flags.rpcActive) {
            throw new Error("Flipper not connected or RPC not active");
        }

        const uploadStartTime = performance.now();
        const flipperModule = await getFlipperModule();

        if (connectionData.deviceInfo?.hardware_region !== "0") {
            setUpdateStage("update_stage_set_region");
            addLog("verbose", "[Region] Provisioning flipper region settings");
            await provisionRegion(flipperModule);
        }

        setUpdateStage("update_stage_downloading_firmware");

        let files;

        if (uploadedFile) {
            addLog("info", `[Firmware] Loading firmware from file: ${uploadedFile.name}`);
            const arrayBuffer = await uploadedFile.arrayBuffer();
            addLog("debug", `[Firmware] File size: ${arrayBuffer.byteLength} bytes`);

            addLog("verbose", "[Firmware] Unpacking uploaded firmware file");
            files = await unpack(arrayBuffer);
            addLog("debug", `[Firmware] Extracted ${files.length} files from uploaded file`);
            console.log("uploaded files:", files);
            setUpdateStage("update_stage_extracted_files", { count: files.length });
        } else {
            if (!release) {
                throw new Error("No release provided for firmware download");
            }
            const firmwareUrl = getFirmwareDownloadUrl(release);

            if (!firmwareUrl) {
                throw new Error(`No firmware URL found for release: ${release.version}`);
            }

            const proxiedUrl = useProxiedUrl(firmwareUrl);
            addLog(
                "info",
                `[Firmware] Downloading firmware from: <a href="${proxiedUrl}" target="_blank">${proxiedUrl}</a>`,
            );

            try {
                addLog("verbose", "[Download] Fetching firmware from proxied URL");
                files = await fetchFirmware(proxiedUrl);
            } catch {
                addLog("warning", `[Firmware] Proxied URL failed, trying original URL`);
                addLog("verbose", "[Download] Fetching firmware from original URL");
                files = await fetchFirmware(firmwareUrl);
            }

            addLog("debug", `[Firmware] Extracted ${files.length} files from download`);
            setUpdateStage("update_stage_extracted_files", { count: files.length });
        }

        addLog("verbose", "[Directory] Creating firmware update directory");
        await createUpdateDirectory(flipperModule);

        let path = "/ext/update/";
        let fileIndex = 0;
        for (const file of files) {
            if (file.size === 0) {
                path = "/ext/update/" + file.name;
                if (file.name.endsWith("/")) {
                    path = path.slice(0, -1);
                }
                setUpdateStage("update_stage_creating_directory", { name: path });
                addLog("verbose", `[Directory] Creating firmware directory: ${path}`);
                await flipperModule.commands.storage.mkdir(path);
                addLog("debug", `[Firmware] Created directory: ${path}`);
            } else {
                fileIndex++;
                setUpdateStage("update_stage_uploading_file", {
                    count: fileIndex,
                    total: files.length,
                    name: file.name.split("/").pop() || file.name,
                });

                const unbind = flipperModule.emitter.on(
                    "storageWriteRequest/progress",
                    (e: { progress: number; total: number }) => {
                        flags.progress = e.progress / e.total;
                    },
                );

                addLog("verbose", `[Transfer] Writing firmware file: ${file.name}`);
                await flipperModule.commands.storage.write("/ext/update/" + file.name, file.buffer);
                unbind();
                addLog("debug", `[Firmware] Uploaded file: ${file.name}`);

                flags.progress = 1;
                await asyncSleep(100);
                flags.progress = 0;
                await asyncSleep(100);
            }
        }

        flags.progress = 0;

        setUpdateStage("update_stage_loading_manifest");
        addLog("verbose", "[Firmware] Loading update manifest");
        await flipperModule.commands.system.update(path + "/update.fuf");
        addLog("debug", "[Firmware] Loaded update manifest");

        setUpdateStage("update_stage_rebooting");
        const uploadDuration = performance.now() - uploadStartTime;
        const formattedDuration = formatDuration(uploadDuration);
        addLog(
            "success",
            `[Firmware] Upload completed in ${formattedDuration} successfully. Rebooting...`,
        );
        addLog("verbose", "[System] Rebooting flipper for firmware update");
        await flipperModule.commands.system.reboot(2);
        await asyncSleep(1000);

        setUpdateStage("update_stage_done");
        await asyncSleep(2000);

        setUpdateStage("update_stage_flipper_updating");
        await asyncSleep(2000);
    };

    const provisionRegion = async (flipperModule: FlipperModule): Promise<void> => {
        try {
            const regions = await fetchRegions();
            console.log("regions:", regions);
            let bands;

            if (regions.countries[regions.country]) {
                bands = regions.countries[regions.country].map(
                    (bandKey: string) => regions.bands[bandKey],
                );
            } else {
                bands = regions.default.map((bandKey: string) => regions.bands[bandKey]);
                regions.country = "JP";
            }

            const options: {
                countryCode: string | Uint8Array;
                bands: unknown[];
            } = {
                countryCode: regions.country,
                bands: [],
            };

            // @ts-expect-error - PB is from flipper protobuf
            const { PB } = await import("../flipper/protobuf/proto-compiled.js");

            for (const band of bands) {
                const bandOptions = {
                    start: band.start,
                    end: band.end,
                    powerLimit: band.max_power,
                    dutyCycle: band.duty_cycle,
                };
                const message = PB.Region.Band.create(bandOptions);
                options.bands.push(message);
            }

            options.countryCode = new TextEncoder().encode(regions.country);
            const message = PB.Region.create(options);
            const encoded = new Uint8Array(PB.Region.encodeDelimited(message).finish()).slice(1);

            addLog("verbose", "[Region] Writing region data to flipper");
            await flipperModule.commands.storage.write("/int/.region_data", encoded);

            addLog("info", `[Firmware] Set Sub-GHz region: ${regions.country}`);
        } catch (error) {
            addLog("error", `[Firmware] Region provisioning failed: ${error}`);
            throw error;
        }
    };

    const createUpdateDirectory = async (flipperModule: FlipperModule): Promise<void> => {
        try {
            addLog("verbose", "[Directory] Checking update directory status");
            await flipperModule.commands.storage.stat("/ext/update");
        } catch (error) {
            const errorStr = error instanceof Error ? error.message : String(error);
            if (errorStr !== "ERROR_STORAGE_NOT_EXIST") {
                throw error;
            }
            addLog("verbose", "[Directory] Creating update directory");
            await flipperModule.commands.storage.mkdir("/ext/update");
            addLog("debug", "[Firmware] Created update directory");
        }
    };

    const updateFirmware = async (release?: ReleaseItem, uploadedFile?: File): Promise<boolean> => {
        if (!flags.connected || !flags.rpcActive) {
            throw new Error("Flipper not connected or RPC not active");
        }

        if (!flags.ableToUpdate) {
            throw new Error("Flipper does not support firmware updates");
        }

        firmwareState.updateStage = "";
        firmwareState.updateStageContext = {};
        flags.updateInProgress = true;
        flags.progress = 0;

        flags.screenStreamPaused = true;
        if (flags.screenStream) {
            try {
                addLog("verbose", "[Stream] Stopping screen stream for firmware update");
                await stopScreenStream();
                addLog("info", "[Firmware] Stopped screen stream for firmware update");
                await asyncSleep(500);
            } catch (error) {
                addLog("warning", `[Firmware] Failed to stop screen stream: ${error}`);
            }
        }

        try {
            addLog("verbose", "[Firmware] Loading firmware for update");
            await loadFirmware(release, uploadedFile);
            return true;
        } catch (error) {
            addLog("error", `[Firmware] Firmware update failed: ${error}`);
            throw error;
        } finally {
            flags.updateInProgress = false;
            flags.progress = 0;
            flags.screenStreamPaused = false;
        }
    };

    const restartRpc = async (force: boolean = false): Promise<void> => {
        if (!flipper) throw new Error("Flipper not connected");

        if ((flags.connected && flags.rpcActive && !flags.restarting) || force) {
            flags.restarting = true;
            addLog("verbose", "[RPC] Closing reader for restart");
            await flipper.closeReader();
            await asyncSleep(300);
            addLog("verbose", "[RPC] Disconnecting for restart");
            await flipper.disconnect();
            await asyncSleep(300);
            addLog("verbose", "[RPC] Reconnecting for restart");
            await flipper.connect();
            addLog("verbose", "[RPC] Restarting session");
            await startRpc();
            flags.restarting = false;
            addLog("info", "[Serial] RPC connection restarted successfully");
        }
    };

    const testConnecting = async () => {
        addLog("verbose", "[Test] connection state change");
        connectionData.state = ConnectionState.CONNECTING;
    };

    const testUpdateFirmware = async (
        release?: ReleaseItem,
        uploadedFile?: File | null,
        loop: boolean = false,
    ): Promise<boolean> => {
        if (!flags.connected || !flags.rpcActive) {
            addLog("warning", "[Test] Firmware update without connection");
        }

        if (!flags.ableToUpdate) {
            addLog("warning", "[Test] Firmware update on unsupported flipper");
        }

        firmwareState.updateStage = "";
        firmwareState.updateStageContext = {};
        flags.updateInProgress = true;
        flags.progress = 0;

        flags.screenStreamPaused = true;
        if (flags.screenStream) {
            try {
                await stopScreenStream();
                addLog("info", "[Test] Stopped screen stream for firmware update");
                await asyncSleep(500);
            } catch (error) {
                addLog("warning", `[Test] Failed to stop screen stream: ${error}`);
            }
        }

        try {
            addLog("verbose", "[Test] Loading test firmware");
            await testLoadFirmware(release, uploadedFile);
            return true;
        } catch (error) {
            addLog("error", `[Test] Firmware update failed: ${error}`);
            throw error;
        } finally {
            flags.updateInProgress = false;
            flags.progress = 0;
            flags.screenStreamPaused = false;
            await asyncSleep(2000);
            if (loop) {
                addLog("verbose", "[Test] Continuing firmware test loop");
                await testUpdateFirmware(release, uploadedFile, true);
            }
        }
    };

    const testLoadFirmware = async (
        release?: ReleaseItem,
        uploadedFile?: File | null,
    ): Promise<void> => {
        if (!flags.connected || !flags.rpcActive) {
            throw new Error("Flipper not connected or RPC not active");
        }

        const uploadStartTime = performance.now();

        if (connectionData.deviceInfo?.hardware_region !== "0") {
            setUpdateStage("update_stage_set_region");
            await asyncSleep(1000);
            addLog("info", "[Test] Set Sub-GHz region: US");
        }

        setUpdateStage("update_stage_downloading_firmware");
        addLog("verbose", "[Test] firmware download");
        await asyncSleep(1500);

        let files: { name: string; size: number }[] = [];

        if (uploadedFile) {
            addLog("info", `[Test] Loading firmware from file: ${uploadedFile.name}`);
            addLog("debug", `[Test] File size: ${uploadedFile.size} bytes`);

            files = [
                { name: "update.fuf", size: 1024 },
                { name: "firmware.dfu", size: 2048000 },
                { name: "resources.tar", size: 512000 },
                { name: "scripts/update.sh", size: 256 },
                { name: "assets/", size: 0 },
            ];
            addLog("debug", `[Test] Extracted ${files.length} files from uploaded file`);
            setUpdateStage("update_stage_extracted_files", { count: files.length });
        } else {
            if (!release) {
                throw new Error("No release provided for test firmware download");
            }
            const firmwareUrl = getFirmwareDownloadUrl(release);

            if (!firmwareUrl) {
                throw new Error(`No firmware URL found for release: ${release.version}`);
            }

            addLog(
                "info",
                `[Test] Downloading firmware from: <a href="${firmwareUrl}" target="_blank">${firmwareUrl}</a>`,
            );

            files = [
                { name: "update.fuf", size: 1024 },
                { name: "firmware.dfu", size: 2048000 },
                { name: "resources.tar", size: 512000 },
                { name: "scripts/update.sh", size: 256 },
                { name: "assets/", size: 0 },
            ];

            addLog("debug", `[Test] Extracted ${files.length} files from download`);
            setUpdateStage("update_stage_extracted_files", { count: files.length });
        }

        await asyncSleep(200);

        let fileIndex = 0;
        for (const file of files) {
            if (file.size === 0) {
                setUpdateStage("update_stage_creating_directory", {
                    name: `/ext/update/${file.name}`,
                });
                await asyncSleep(50);
                addLog("debug", `[Test] Created directory: /ext/update/${file.name}`);
            } else {
                fileIndex++;
                setUpdateStage("update_stage_uploading_file", {
                    count: fileIndex,
                    total: files.length,
                    name: file.name.split("/").pop() || file.name,
                });

                const uploadDuration = Math.max(500, Math.min(3000, file.size / 1000)); // 500ms to 3s based on file size
                const progressSteps = 20;
                const stepDuration = uploadDuration / progressSteps;

                addLog("verbose", `[Test] file upload progress: ${file.name}`);
                for (let i = 0; i <= progressSteps; i++) {
                    const progress = i / progressSteps;
                    flags.progress = progress;
                    await asyncSleep(stepDuration);
                }

                addLog("debug", `[Test] Uploaded file: ${file.name}`);

                flags.progress = 1;
                await asyncSleep(100);
                flags.progress = 0;
                await asyncSleep(100);
            }
        }

        flags.progress = 0;

        setUpdateStage("update_stage_loading_manifest");
        await asyncSleep(500);
        addLog("debug", "[Test] Loaded update manifest");

        setUpdateStage("update_stage_rebooting");
        const uploadDuration = performance.now() - uploadStartTime;
        const formattedDuration = formatDuration(uploadDuration);
        addLog(
            "success",
            `[Test] Upload completed in ${formattedDuration} successfully. Rebooting...`,
        );
        await asyncSleep(1000);

        setUpdateStage("update_stage_done");
        await asyncSleep(2000);

        addLog("verbose", "[Test] flipper update stage");
        setUpdateStage("update_stage_flipper_updating");
        await asyncSleep(2000);
    };

    return {
        connectionData,
        flags,
        queueState,
        firmwareState,
        logs,
        screenScale,
        autoConnect,
        connect,
        disconnect,
        startRpc,
        stopRpc,
        restartRpc,
        readBasicInfo,
        findKnownDevices,
        requestPort,
        installAssetPack,
        loadInstalledPacks,
        enqueue,
        updateExtractCapability,
        updateFirmwareCapability,
        updateFirmware,
        startScreenStream,
        stopScreenStream,
        addLog,
        clearLogs,
        testConnecting,
        testUpdateFirmware,
    };
};
