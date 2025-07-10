import log from "loglevel";
import semver from "semver";
import { reactive, ref } from "vue";
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
import { fetchFirmware, fetchRegions, getCurrentLocale, unpack } from "../util";
import { useI18n } from "./useI18n";
import { useProxiedUrl } from "./useProxiedUrl";

import type { ReleaseItem } from "../../../_data/releases";

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
        message.includes("serial port is busy - please refresh the page")
    ) {
        return "connection_serial_busy";
    }
    if (message.includes("could not start rpc session")) {
        return "connection_rpc_failed";
    }
    if (message.includes("no flipper device found")) {
        return "connection_device_not_found";
    }
    if (message.includes("serial not supported")) {
        return "connection_serial_not_supported";
    }
    if (message.includes("connection failed") || message.includes("networkerror")) {
        return "connection_connection_failed";
    }
    if (message.includes("timeout")) {
        return "connection_connection_timeout";
    }
    if (error.message.length > 50) {
        return error.message.substring(0, 47) + "...";
    }

    return error.message;
};

const getFirmwareDownloadUrl = (release: ReleaseItem): string | null => {
    if (!release.files) return null;

    for (const file of release.files) {
        if (
            "url" in file &&
            file.url &&
            "filename" in file &&
            file.filename?.includes("update-mntm-") &&
            file.filename?.endsWith(".tgz")
        ) {
            return file.url;
        }

        if (
            "filename" in file &&
            file.filename?.includes("update-mntm-") &&
            file.filename.endsWith(".tgz")
        ) {
            return `https://up.momentum-fw.dev/builds/firmware/dev/${file.filename}`;
        }
    }

    return null;
};

export const useSerialConnection = () => {
    log.setLevel("debug");

    const { tr } = useI18n();

    interface LogEntry {
        timestamp: Date;
        level: "info" | "warning" | "error" | "success" | "debug";
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
                writeProgress: { filename: "", progress: 0 },
            }),
            connect: () => Promise.reject(new Error("Serial not available in SSR")),
            disconnect: () => Promise.reject(new Error("Serial not available in SSR")),
            installAssetPack: () => Promise.reject(new Error("Serial not available in SSR")),
            setupEventListeners: () => {},
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
            screenScale: { value: 2 },
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
        writeProgress: {
            filename: "",
            progress: 0,
        },
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

        firmwareState.updateStage = "";
        firmwareState.writeProgress.filename = "";
        firmwareState.writeProgress.progress = 0;
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
            const deviceInfo = await flipperModule.commands.system.deviceInfo();
            for (const line of deviceInfo) {
                info[line.key] = line.value;
            }
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
                `[Serial] Device info loaded - ${info.hardware_name || "???"} (${info.firmware_version || "???"}, ${commitLink}, ${branchLink})`,
            );
            readStorageInfo();

            return info;
        } catch (error) {
            addLog("error", `[Serial] Failed to read basic device info: ${error}`);
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
            addLog("warning", `[Serial] Failed to read external storage info: ${error}`);
            updatedInfo.storage_sdcard_present = "missing";
            updatedInfo.storage_databases_present = "missing";
        }

        try {
            const intInfo = await flipper.commands.storage.info("/int");
            updatedInfo.storage_internal_totalSpace = intInfo.totalSpace;
            updatedInfo.storage_internal_freeSpace = intInfo.freeSpace;
        } catch (error) {
            addLog("warning", `[Serial] Failed to read internal storage info: ${error}`);
        }

        connectionData.deviceInfo = updatedInfo;
    };

    const connect = async () => {
        if (!flags.serialSupported) {
            addLog("error", "[Serial] Web Serial API not supported in this browser");
            connectionData.state = ConnectionState.ERROR;
            connectionData.error = "Serial not supported";
            return;
        }

        connectionData.state = ConnectionState.CONNECTING;
        connectionData.error = undefined;
        flags.portSelectRequired = false;
        clearLogs();

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

            await new Promise((resolve) => setTimeout(resolve, 500));

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
                        await flipper.closeReader();
                        await new Promise((resolve) => setTimeout(resolve, 1000));
                        await flipper.connect();
                        flags.connected = true;
                        addLog("info", "[Serial] Physical connection established after recovery");
                    } catch (retryError) {
                        addLog("error", `[Serial] Retry failed: ${retryError}`);
                        throw new Error("Serial port is busy - please refresh the page");
                    }
                } else {
                    addLog("error", `[Serial] flipper.connect() failed: ${flipperError}`);
                    throw flipperError;
                }
            }

            await startRpc();
            await readBasicInfo();
            // small delay to not conflict the the storage info stuff before, causing either sdcard size not to load or installed packs not to load
            await asyncSleep(100);
            await updateExtractCapability();
            await updateFirmwareCapability();

            setupEventListeners();
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
                error instanceof Error
                    ? mapErrorToUserFriendly(error)
                    : tr("connection_connection_failed");

            connectionData.state = ConnectionState.ERROR;
            connectionData.error = userFriendlyError;
            addLog(
                "error",
                `[Serial] Connection failed: ${error instanceof Error ? error.message : error}`,
            );
        }
    };

    const disconnect = async () => {
        await performCleanup();
    };

    const installAssetPack = async (packUrl: string) => {
        if (!flags.connected || !flipper) {
            addLog("error", "[Serial] Cannot install: device not connected");
            throw new Error("Device not connected");
        }

        try {
            const proxiedUrl = useProxiedUrl(packUrl);

            const response = await fetch(proxiedUrl);
            if (!response.ok) {
                throw new Error(`Failed to download: ${response.statusText}`);
            }

            const arrayBuffer = await response.arrayBuffer();
            const fileName = packUrl.split("/").pop() || "asset_pack.zip";

            await flipper.commands.storage.write(`/ext/apps/${fileName}`, arrayBuffer);
        } catch (error) {
            throw new Error(
                `Installation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
            );
        }
    };

    const setupEventListeners = () => {
        if (!flipper) {
            return;
        }

        flipper.emitter.on("disconnect", () => {
            addLog("info", "[Serial] Physical disconnect detected - disconnected");
            if (queueState.fakeExtractProgress !== null) {
                clearInterval(queueState.fakeExtractProgress);
                queueState.fakeExtractProgress = null;
            }
            resetFlagsAndState();
        });

        navigator.serial.addEventListener("disconnect", () => {
            addLog("info", "[Serial] Physical disconnect detected - disconnected");
            if (queueState.fakeExtractProgress !== null) {
                clearInterval(queueState.fakeExtractProgress);
                queueState.fakeExtractProgress = null;
            }
            resetFlagsAndState();
        });
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
                await flipper.commands.storage.remove(packFolder, true);
                addLog("debug", `[AssetPacks] storage.remove: ${packFolder}`);
            } catch (error) {
                addLog("warning", `[AssetPacks] storage.remove failed for ${packFolder}: ${error}`);
            }
        }

        const manifestPath = `${ASSET_PACKS_MANIFESTS_DIR}/${pack.id}${ASSET_PACKS_MANIFESTS_EXT}`;
        try {
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
            const manifests = await flipper.commands.storage.list(ASSET_PACKS_MANIFESTS_DIR);

            for (const manifest of manifests) {
                if (manifest.type === 1 || !manifest.size) {
                    continue;
                }
                if (!manifest.name.endsWith(ASSET_PACKS_MANIFESTS_EXT)) {
                    continue;
                }

                const packId = manifest.name.slice(0, -ASSET_PACKS_MANIFESTS_EXT.length);

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

        let removeOldPacksTask: Promise<void> | null = null;
        const packTar = await downloadPackWithProgress(pack, setProgress).catch((error) => {
            addLog("error", `[AssetPacks] ${error.toString()}`);
            throw new Error(error.toString());
        });

        removeOldPacksTask = removeOldPacks(pack);
        flags.installStatus = InstallStatus.COPYING;
        step++;

        await mkdirParents(ASSET_PACKS_MANIFESTS_DIR);
        await mkdirParents(ASSET_PACKS_TEMP_PATH);
        const tempFile = `${ASSET_PACKS_TEMP_PATH}/${pack.id}.tar.gz`;

        await writePackToDevice(tempFile, packTar, setProgress);

        flags.installStatus = InstallStatus.CLEANUP;
        await removeOldPacksTask;
        flags.installStatus = InstallStatus.EXTRACT;
        step++;

        await extractPackOnDevice(tempFile, setProgress);

        flags.installStatus = InstallStatus.CLEANUP;
        try {
            await flipper.commands.storage.remove(tempFile, false);
            addLog("debug", `[AssetPacks] storage.remove: ${tempFile}`);
        } catch (error) {
            addLog("warning", `[AssetPacks] storage.remove failed for ${tempFile}: ${error}`);
        }

        await createManifest(pack);
        addLog("info", `[AssetPacks] Successfully installed pack: ${pack.id}`);
    };

    const processRemovePack = async (pack: AssetPack): Promise<void> => {
        addLog("info", `[AssetPacks] Removing pack: ${pack.id}`);
        flags.installStatus = InstallStatus.DELETING;
        await removeOldPacks(pack);
        delete connectionData.installedPacks[pack.id];
        addLog("info", `[AssetPacks] Successfully removed pack: ${pack.id}`);
    };

    const enqueue = async (pack: AssetPack, action: "install" | "remove"): Promise<void> => {
        if (!flags.serialSupported) return;

        if (!flags.connected || !connectionData.deviceInfo || !flags.rpcActive) {
            throw new Error("Device not connected or RPC not active");
        }

        queueState.queue.push(pack as unknown as QueueItem);
        queueState.queueActions.push(action);

        if (queueState.queue.length > 1) {
            return;
        }

        while (queueState.queue.length > 0) {
            try {
                const currentPack = queueState.queue[0] as unknown as AssetPack;
                const currentAction = queueState.queueActions[0];

                if (currentAction === "remove") {
                    await processRemovePack(currentPack);
                } else if (currentAction === "install") {
                    await processInstallPack(currentPack);
                }
            } finally {
                queueState.queue.shift();
                queueState.queueActions.shift();
                flags.installStatus = null;
                flags.progress = 0;
            }
        }
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
            throw new Error("Device not connected or RPC not active");
        }

        if (flags.screenStream) {
            return;
        }

        try {
            const flipperModule = await getFlipperModule();
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
        await flipperModule.commands.gui.stopScreenStreamRequest();

        flags.screenStream = false;

        if (screenStreamUnbind) screenStreamUnbind();
        if (screenStreamStopUnbind) screenStreamStopUnbind();
        if (screenStreamRestartUnbind) screenStreamRestartUnbind();
        screenStreamUnbind = null;
        screenStreamStopUnbind = null;
        screenStreamRestartUnbind = null;
    };

    const loadFirmware = async (release: ReleaseItem, uploadedFile?: File): Promise<void> => {
        if (!flags.connected || !flags.rpcActive) {
            throw new Error("Device not connected or RPC not active");
        }

        const flipperModule = await getFlipperModule();

        if (connectionData.deviceInfo?.hardware_region !== "0") {
            firmwareState.updateStage = "update_stage_loading_region_data";
            await provisionRegion(flipperModule);
        }

        firmwareState.updateStage = "update_stage_loading_firmware_bundle";

        let files;

        if (uploadedFile) {
            addLog("info", `[Firmware] Loading firmware from file: ${uploadedFile.name}`);
            const arrayBuffer = await uploadedFile.arrayBuffer();
            addLog("debug", `[Firmware] File size: ${arrayBuffer.byteLength} bytes`);

            files = await unpack(arrayBuffer);
            addLog("debug", `[Firmware] Extracted ${files.length} files from uploaded file`);
            console.log("uploaded files:", files);
        } else {
            const firmwareUrl = getFirmwareDownloadUrl(release);

            if (!firmwareUrl) {
                throw new Error(
                    `No firmware URL found for release: ${release.version || release.commit}`,
                );
            }

            const proxiedUrl = useProxiedUrl(firmwareUrl);
            addLog(
                "info",
                `[Firmware] Downloading firmware from: <a href="${proxiedUrl}" target="_blank">${proxiedUrl}</a>`,
            );

            try {
                files = await fetchFirmware(proxiedUrl);
            } catch {
                addLog("warning", `[Firmware] Proxied URL failed, trying original URL`);
                files = await fetchFirmware(firmwareUrl);
            }

            addLog("debug", `[Firmware] Extracted ${files.length} files from download`);
        }

        firmwareState.updateStage = "update_stage_loading_firmware_files";
        await createUpdateDirectory(flipperModule);

        let path = "/ext/update/";
        for (const file of files) {
            if (file.size === 0) {
                path = "/ext/update/" + file.name;
                if (file.name.endsWith("/")) {
                    path = path.slice(0, -1);
                }
                await flipperModule.commands.storage.mkdir(path);
                addLog("debug", `[Firmware] Created directory: ${path}`);
            } else {
                firmwareState.writeProgress.filename = file.name.split("/").pop() || file.name;

                const unbind = flipperModule.emitter.on(
                    "storageWriteRequest/progress",
                    (e: { progress: number; total: number }) => {
                        firmwareState.writeProgress.progress = e.progress / e.total;
                        flags.progress = e.progress / e.total;
                    },
                );

                await flipperModule.commands.storage.write("/ext/update/" + file.name, file.buffer);
                unbind();
                addLog("debug", `[Firmware] Uploaded file: ${file.name}`);
            }
            await asyncSleep(300);
        }

        firmwareState.writeProgress.filename = "";
        firmwareState.writeProgress.progress = 0;
        flags.progress = 0;

        firmwareState.updateStage = "update_stage_loading_manifest";
        await flipperModule.commands.system.update(path + "/update.fuf");
        addLog("debug", "[Firmware] Loaded update manifest");

        firmwareState.updateStage = "update_stage_pay_attention";

        addLog("success", "[Firmware] Update completed successfully. Rebooting...");
        firmwareState.updateStage = "update_stage_rebooting";
        await asyncSleep(1000);
        firmwareState.updateStage = "update_stage_done";
        await asyncSleep(2000);

        flags.updateInProgress = false;

        await flipperModule.commands.system.reboot(2);
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

            await flipperModule.commands.storage.write("/int/.region_data", encoded);

            addLog("info", `[Firmware] Set Sub-GHz region: ${regions.country}`);
        } catch (error) {
            addLog("error", `[Firmware] Region provisioning failed: ${error}`);
            throw error;
        }
    };

    const createUpdateDirectory = async (flipperModule: FlipperModule): Promise<void> => {
        try {
            await flipperModule.commands.storage.stat("/ext/update");
        } catch (error) {
            const errorStr = error instanceof Error ? error.message : String(error);
            if (errorStr !== "ERROR_STORAGE_NOT_EXIST") {
                throw error;
            }
            await flipperModule.commands.storage.mkdir("/ext/update");
            addLog("debug", "[Firmware] Created update directory");
        }
    };

    const updateFirmware = async (release: ReleaseItem, uploadedFile?: File): Promise<void> => {
        if (!flags.connected || !flags.rpcActive) {
            throw new Error("Device not connected or RPC not active");
        }

        if (!flags.ableToUpdate) {
            throw new Error("Device does not support firmware updates");
        }

        flags.updateInProgress = true;
        flags.progress = 0;

        flags.screenStreamPaused = true;
        if (flags.screenStream) {
            try {
                await stopScreenStream();
                addLog("info", "[Firmware] Stopped screen stream for firmware update");
                await asyncSleep(500);
            } catch (error) {
                addLog("warning", `[Firmware] Failed to stop screen stream: ${error}`);
            }
        }

        try {
            await loadFirmware(release, uploadedFile);
            addLog("success", "[Firmware] Firmware update completed successfully");
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
            await flipper.closeReader();
            await asyncSleep(300);
            await flipper.disconnect();
            await asyncSleep(300);
            await flipper.connect();
            await startRpc();
            flags.restarting = false;
            addLog("info", "[Serial] RPC connection restarted successfully");
        }
    };

    const testConnecting = async () => {
        connectionData.state = ConnectionState.CONNECTING;
    };

    const testUpdateFirmware = async (release: ReleaseItem, uploadedFile?: File): Promise<void> => {
        if (!flags.connected || !flags.rpcActive) {
            addLog("warning", "[Test] Simulating firmware update without device connection");
        }

        if (!flags.ableToUpdate) {
            addLog("warning", "[Test] Simulating firmware update on unsupported device");
        }

        flags.updateInProgress = true;
        flags.progress = 0;
        firmwareState.updateStage = "";
        firmwareState.writeProgress.filename = "";
        firmwareState.writeProgress.progress = 0;

        flags.screenStreamPaused = true;
        if (flags.screenStream) {
            try {
                await stopScreenStream();
                addLog("info", "[Test] Stopped screen stream for firmware update simulation");
                await asyncSleep(500);
            } catch (error) {
                addLog("warning", `[Test] Failed to stop screen stream: ${error}`);
            }
        }

        try {
            await testLoadFirmware(release, uploadedFile);
            addLog("success", "[Test] Firmware update simulation completed successfully");
        } catch (error) {
            addLog("error", `[Test] Firmware update simulation failed: ${error}`);
            throw error;
        } finally {
            flags.updateInProgress = false;
            flags.progress = 0;
            flags.screenStreamPaused = false;
            firmwareState.updateStage = "";
            firmwareState.writeProgress.filename = "";
            firmwareState.writeProgress.progress = 0;
        }
    };

    const testLoadFirmware = async (release: ReleaseItem, uploadedFile?: File): Promise<void> => {
        try {
            if (connectionData.deviceInfo?.hardware_region !== "0") {
                firmwareState.updateStage = "update_stage_loading_region_data";
                addLog("info", "[Test] Simulating region provisioning");
                await asyncSleep(1000);
                addLog("info", "[Test] Set Sub-GHz region: US");
            }

            firmwareState.updateStage = "update_stage_loading_firmware_bundle";
            addLog("info", "[Test] Simulating firmware bundle loading");
            await asyncSleep(1500);

            let files: { name: string; size: number }[] = [];

            if (uploadedFile) {
                addLog(
                    "info",
                    `[Test] Simulating firmware loading from file: ${uploadedFile.name}`,
                );
                addLog("debug", `[Test] File size: ${uploadedFile.size} bytes`);

                files = [
                    { name: "update.fuf", size: 1024 },
                    { name: "firmware.dfu", size: 2048000 },
                    { name: "resources.tar", size: 512000 },
                    { name: "scripts/update.sh", size: 256 },
                    { name: "assets/", size: 0 },
                ];
                addLog("debug", `[Test] Extracted ${files.length} files from uploaded file`);
            } else {
                const firmwareUrl = getFirmwareDownloadUrl(release);
                if (!firmwareUrl) {
                    throw new Error(
                        `No firmware URL found for release: ${release.version || release.commit}`,
                    );
                }

                addLog("info", `[Test] Simulating firmware download from: ${firmwareUrl}`);

                files = [
                    { name: "update.fuf", size: 1024 },
                    { name: "firmware.dfu", size: 2048000 },
                    { name: "resources.tar", size: 512000 },
                    { name: "scripts/update.sh", size: 256 },
                    { name: "assets/", size: 0 },
                ];
                addLog("debug", `[Test] Extracted ${files.length} files from download`);
            }

            firmwareState.updateStage = "update_stage_loading_firmware_files";
            addLog("info", "[Test] Simulating firmware file uploads");
            await asyncSleep(500);

            for (const file of files) {
                if (file.size === 0) {
                    addLog("debug", `[Test] Created directory: /ext/update/${file.name}`);
                    await asyncSleep(100);
                } else {
                    firmwareState.writeProgress.filename = file.name.split("/").pop() || file.name;
                    firmwareState.writeProgress.progress = 0;

                    const uploadDuration = Math.max(500, Math.min(3000, file.size / 1000)); // 500ms to 3s based on file size
                    const progressSteps = 20;
                    const stepDuration = uploadDuration / progressSteps;

                    for (let i = 0; i <= progressSteps; i++) {
                        const progress = i / progressSteps;
                        firmwareState.writeProgress.progress = progress;
                        flags.progress = progress;
                        await asyncSleep(stepDuration);
                    }

                    addLog("debug", `[Test] Uploaded file: ${file.name}`);
                    await asyncSleep(300);
                }
            }

            firmwareState.writeProgress.filename = "";
            firmwareState.writeProgress.progress = 0;
            flags.progress = 0;

            firmwareState.updateStage = "update_stage_loading_manifest";
            addLog("info", "[Test] Simulating update manifest loading");
            await asyncSleep(1000);
            addLog("debug", "[Test] Loaded update manifest");

            firmwareState.updateStage = "update_stage_pay_attention";
            addLog("info", "[Test] Simulating Flipper reboot for update");
            await asyncSleep(2000);

            firmwareState.updateStage = "update_stage_flashing_firmware";
            addLog("info", "[Test] Simulating firmware update process");

            for (let i = 0; i <= 100; i += 5) {
                flags.progress = i / 100;
                await asyncSleep(200);
            }

            firmwareState.updateStage = "update_stage_rebooting";
            await asyncSleep(1000);
            firmwareState.updateStage = "update_stage_done";
            await asyncSleep(2000);
            flags.updateInProgress = false;

            await disconnect();
        } catch (error) {
            addLog("error", `[Test] Firmware simulation error: ${error}`);
            throw error;
        }
    };

    return {
        connectionData,
        flags,
        queueState,
        firmwareState,
        connect,
        disconnect,
        startRpc,
        stopRpc,
        readBasicInfo,
        findKnownDevices,
        requestPort,
        installAssetPack,
        loadInstalledPacks,
        setupEventListeners,
        enqueue,
        updateExtractCapability,
        updateFirmwareCapability,
        updateFirmware,
        restartRpc,
        logs,
        addLog,
        clearLogs,
        testConnecting,
        testUpdateFirmware,
        startScreenStream,
        stopScreenStream,
        screenScale,
    };
};
