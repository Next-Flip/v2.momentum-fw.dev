import log from "loglevel";
import semver from "semver";
import { reactive } from "vue";
import {
    ConnectionState,
    InstallStatus,
    type ConnectionState as ConnectionStateType,
    type InstallStatus as InstallStatusType,
} from "../types";
import { useI18n } from "./useI18n";
import { useProxiedUrl } from "./useProxiedUrl";

const { tr } = useI18n();

const asyncSleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

const ASSET_PACKS_DIR = "/ext/asset_packs";
const ASSET_PACKS_TEMP_PATH = "/ext/.tmp/mntm";
const ASSET_PACKS_MANIFESTS_DIR = `${ASSET_PACKS_DIR}/.manifests`;
const ASSET_PACKS_MANIFESTS_EXT = ".pack";

export interface SerialConnectionData {
    state: ConnectionStateType;
    error?: string;
    deviceInfo?: Record<string, any>;
    installedPacks: InstalledPacks;
}

export interface ConnectionFlags {
    serialSupported: boolean;
    portSelectRequired: boolean;
    connected: boolean;
    rpcActive: boolean;
    rpcToggling: boolean;
    updateInProgress: boolean;
    progress: number;
    installStatus: InstallStatusType | null;
    ableToExtract: boolean | null;
    restarting: boolean;
}

export interface QueueState {
    queue: any[];
    queueActions: string[];
    fakeExtractProgress: NodeJS.Timeout | null;
}

export interface InstalledPackManifest {
    sha256: string;
    folders: string[];
}

export interface InstalledPacks {
    [packId: string]: InstalledPackManifest;
}

declare global {
    interface Navigator {
        serial: {
            getPorts(options?: {
                filters?: Array<{ usbVendorId: number; usbProductId: number }>;
            }): Promise<any[]>;
            requestPort(options?: {
                filters?: Array<{ usbVendorId: number; usbProductId: number }>;
            }): Promise<any>;
            addEventListener(event: string, callback: (event: any) => void): void;
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

export const useSerialConnection = () => {
    log.setLevel("debug");

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
                restarting: false,
            }),
            queueState: reactive<QueueState>({
                queue: [],
                queueActions: [],
                fakeExtractProgress: null,
            }),
            connect: () => Promise.reject(new Error("Serial not available in SSR")),
            disconnect: () => Promise.reject(new Error("Serial not available in SSR")),
            installAssetPack: () => Promise.reject(new Error("Serial not available in SSR")),
            setupEventListeners: () => {},
            enqueue: () => Promise.reject(new Error("Serial not available in SSR")),
            updateExtractCapability: () => Promise.reject(new Error("Serial not available in SSR")),
            restartRpc: () => Promise.reject(new Error("Serial not available in SSR")),
        };
    }

    let flipper: any = null;
    const getFlipperModule = async () => {
        if (!flipper) {
            // @ts-ignore - dynamic import of js module
            flipper = await import("../flipper/core");
        }
        return flipper;
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
        restarting: false,
    });

    const queueState = reactive<QueueState>({
        queue: [],
        queueActions: [],
        fakeExtractProgress: null,
    });

    const resetFlagsAndState = () => {
        flags.connected = false;
        flags.rpcActive = false;
        flags.rpcToggling = false;
        flags.portSelectRequired = true;
        flags.progress = 0;
        flags.installStatus = null;
        flags.ableToExtract = null;
        flags.restarting = false;
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
    };

    const performCleanup = async () => {
        const wasConnected = flags.connected;
        connectionData.state = ConnectionState.DISCONNECTING;
        log.info("[Serial] Starting cleanup process");

        try {
            if (flipper) {
                const flipperModule = await Promise.race([
                    getFlipperModule(),
                    new Promise((_, reject) =>
                        setTimeout(() => reject(new Error("timeout")), 2000),
                    ),
                ]);

                if (wasConnected) {
                    await Promise.race([
                        stopRpc(),
                        new Promise((_, reject) =>
                            setTimeout(() => reject(new Error("timeout")), 2000),
                        ),
                    ]).catch((error) => log.warn("[Serial] stopRpc failed:", error));
                    await asyncSleep(100);
                }

                await Promise.race([
                    flipperModule.closeReader(),
                    new Promise((_, reject) =>
                        setTimeout(() => reject(new Error("timeout")), 2000),
                    ),
                ]).catch((error) => log.warn("[Serial] closeReader failed:", error));

                await asyncSleep(100);

                await Promise.race([
                    flipperModule.disconnect(),
                    new Promise((_, reject) =>
                        setTimeout(() => reject(new Error("timeout")), 2000),
                    ),
                ]).catch((error) => log.warn("[Serial] disconnect failed:", error));

                await asyncSleep(100);

                if (flipperModule.emitter?.events) {
                    flipperModule.emitter.events = {};
                }

                try {
                    const rpcModule = (await Promise.race([
                        // @ts-ignore - flipper module is JavaScript
                        import("../flipper/protobuf/rpc"),
                        new Promise((_, reject) =>
                            setTimeout(() => reject(new Error("timeout")), 2000),
                        ),
                    ])) as any;
                    rpcModule.flushCommandQueue();
                } catch (error) {
                    log.warn("[Serial] flush command queue failed:", error);
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
                            log.warn("[Serial] Failed to close port:", error);
                        }
                    }
                }
            }
        } catch (error) {
            log.error("[Serial] Cleanup error:", error);
        } finally {
            resetFlagsAndState();
            flipper = null;
            log.info("[Serial] Cleanup completed - disconnected");
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
            log.info("[Serial] RPC session started successfully");
        } catch (error) {
            flags.rpcToggling = false;
            log.error("[Serial] RPC session failed:", error);
            throw error;
        }
    };

    const stopRpc = async () => {
        flags.rpcToggling = true;
        log.debug("[Serial] Stopping RPC session");

        try {
            const flipperModule = await getFlipperModule();
            await flipperModule.commands.stopRpcSession();
            flags.rpcActive = false;
            flags.rpcToggling = false;
            log.info("[Serial] RPC session stopped");
        } catch (error) {
            flags.rpcToggling = false;
            log.warn("[Serial] Warning: RPC session stop failed:", error);
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

    const readBasicInfo = async () => {
        const info: Record<string, any> = {};

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
            log.info(
                `[Serial] Device info loaded - ${info.hardware_name || "???"} (${info.firmware_version || "???"}, ${info.firmware_commit || "???"}, ${info.firmware_branch || "???"})`,
            );
            readStorageInfo();

            return info;
        } catch (error) {
            log.error("[Serial] Failed to read basic device info:", error);
            throw error;
        }
    };

    const readStorageInfo = async () => {
        if (!connectionData.deviceInfo) return;
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
                log.debug(
                    `[Serial] SD card detected - ${Math.round(extInfo.freeSpace / 1024 / 1024)}MB free`,
                );
            } else {
                updatedInfo.storage_sdcard_present = "missing";
                updatedInfo.storage_databases_present = "missing";
                log.debug("[Serial] No SD card detected");
            }
        } catch (error) {
            log.warn("[Serial] Failed to read external storage info:", error);
            updatedInfo.storage_sdcard_present = "missing";
            updatedInfo.storage_databases_present = "missing";
        }

        try {
            const intInfo = await flipper.commands.storage.info("/int");
            updatedInfo.storage_internal_totalSpace = intInfo.totalSpace;
            updatedInfo.storage_internal_freeSpace = intInfo.freeSpace;
        } catch (error) {
            log.warn("[Serial] Failed to read internal storage info:", error);
        }

        connectionData.deviceInfo = updatedInfo;
    };

    const connect = async () => {
        if (!flags.serialSupported) {
            log.error("[Serial] Web Serial API not supported in this browser");
            connectionData.state = ConnectionState.ERROR;
            connectionData.error = "Serial not supported";
            return;
        }

        connectionData.state = ConnectionState.CONNECTING;
        connectionData.error = undefined;
        flags.portSelectRequired = false;

        try {
            flipper = await getFlipperModule();

            try {
                flipper.emitter.events = {};

                // @ts-ignore - flipper module is JavaScript
                const rpcModule = await import("../flipper/protobuf/rpc");
                rpcModule.flushCommandQueue();

                try {
                    await flipper.closeReader();
                } catch (error) {
                    log.debug("[Serial] No existing reader to close");
                }
            } catch (error) {
                log.debug("[Serial] Proactive cleanup completed with some errors (normal):", error);
            }

            await new Promise((resolve) => setTimeout(resolve, 500));

            let ports = await findKnownDevices();

            if (ports.length === 0) {
                log.debug("[Serial] No known devices found, requesting port selection");
                try {
                    await requestPort();
                    ports = await findKnownDevices();
                } catch (error) {
                    if (error instanceof Error && error.message === "USER_CANCELED") {
                        log.info("[Serial] User canceled port selection");
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

            log.debug(`[Serial] Found ${ports.length} device(s), attempting connection`);
            try {
                await flipper.connect();
                flags.connected = true;
            } catch (flipperError) {
                if (
                    flipperError instanceof Error &&
                    (flipperError.message.includes("Cannot cancel a locked stream") ||
                        flipperError.message.includes("locked to a reader"))
                ) {
                    log.debug("[Serial] Port locked, attempting recovery");
                    try {
                        await flipper.closeReader();
                        await new Promise((resolve) => setTimeout(resolve, 1000));
                        await flipper.connect();
                        flags.connected = true;
                        log.info("[Serial] Physical connection established after recovery");
                    } catch (retryError) {
                        log.error("[Serial] Retry failed:", retryError);
                        throw new Error("Serial port is busy - please refresh the page");
                    }
                } else {
                    log.error("[Serial] flipper.connect() failed:", flipperError);
                    throw flipperError;
                }
            }

            await startRpc();
            await readBasicInfo();
            // small delay to not conflict the the storage info stuff before, causing either sdcard size not to load or installed packs not to load
            await asyncSleep(100);
            await updateExtractCapability();

            setupEventListeners();
            connectionData.state = ConnectionState.CONNECTED;
            log.info(
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
            log.error(
                "[Serial] Connection failed:",
                error instanceof Error ? error.message : error,
            );
        }
    };

    const disconnect = async () => {
        await performCleanup();
    };

    const installAssetPack = async (packUrl: string) => {
        if (!flags.connected) {
            log.error("[Serial] Cannot install: device not connected");
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
            log.info("[Serial] Physical disconnect detected - disconnected");
            if (queueState.fakeExtractProgress !== null) {
                clearInterval(queueState.fakeExtractProgress);
                queueState.fakeExtractProgress = null;
            }
            resetFlagsAndState();
        });

        navigator.serial.addEventListener("disconnect", () => {
            log.info("[Serial] Physical disconnect detected - disconnected");
            if (queueState.fakeExtractProgress !== null) {
                clearInterval(queueState.fakeExtractProgress);
                queueState.fakeExtractProgress = null;
            }
            resetFlagsAndState();
        });
    };

    const mkdirParents = async (path: string): Promise<void> => {
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
                log.debug(`[AssetPacks] storage.mkdir: ${full}`);
            } catch (error) {
                log.warn(`[AssetPacks] storage.mkdir failed for ${full}:`, error);
            }
        }
    };

    const removeOldPacks = async (pack: any): Promise<void> => {
        const installed = connectionData.installedPacks[pack.id];
        if (!installed) return;

        for (const folder of installed.folders) {
            const packFolder = `${ASSET_PACKS_DIR}/${folder}`;
            try {
                await flipper.commands.storage.remove(packFolder, true);
                log.debug(`[AssetPacks] storage.remove: ${packFolder}`);
            } catch (error) {
                log.warn(`[AssetPacks] storage.remove failed for ${packFolder}:`, error);
            }
        }

        const manifestPath = `${ASSET_PACKS_MANIFESTS_DIR}/${pack.id}${ASSET_PACKS_MANIFESTS_EXT}`;
        try {
            await flipper.commands.storage.remove(manifestPath, false);
            log.debug(`[AssetPacks] storage.remove: ${manifestPath}`);
        } catch (error) {
            log.warn(`[AssetPacks] storage.remove failed for ${manifestPath}:`, error);
        }
    };

    const downloadPackWithProgress = async (
        pack: any,
        setProgress: (progress: number) => void,
    ): Promise<Uint8Array> => {
        const packFile = pack.tarFile;
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

        log.debug(`[AssetPacks] Downloaded pack from ${proxiedUrl}`);
        return chunksAll;
    };

    const writePackToDevice = async (
        tempFile: string,
        packTar: Uint8Array,
        setProgress: (progress: number) => void,
    ): Promise<void> => {
        const unbind = flipper.emitter.on("storageWriteRequest/progress", (e: any) => {
            setProgress(e.progress / e.total);
        });

        const start = performance.now();
        try {
            await flipper.commands.storage.write(tempFile, packTar);
            const took = performance.now() - start;
            log.debug(`[AssetPacks] storage.write: ${tempFile} took ${Math.round(took)}ms`);
        } finally {
            unbind();
        }
    };

    const extractPackOnDevice = async (
        tempFile: string,
        setProgress: (progress: number) => void,
    ): Promise<void> => {
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
            log.debug(
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

    const createManifest = async (pack: any): Promise<void> => {
        const manifestPath = `${ASSET_PACKS_MANIFESTS_DIR}/${pack.id}${ASSET_PACKS_MANIFESTS_EXT}`;
        const manifest = {
            sha256: pack.tarFile.sha256,
            folders: pack.stats.folders,
        };
        const manifestData = new TextEncoder().encode(JSON.stringify(manifest));

        try {
            await flipper.commands.storage.write(manifestPath, manifestData);
            log.debug(`[AssetPacks] storage.write: ${manifestPath}`);
            connectionData.installedPacks[pack.id] = manifest;
        } catch (error) {
            log.error(`[AssetPacks] storage.write failed for ${manifestPath}:`, error);
            throw error;
        }
    };

    const loadPackManifest = async (path: string): Promise<InstalledPackManifest | null> => {
        try {
            const raw = await flipper.commands.storage.read(path);
            const text = new TextDecoder().decode(raw);
            const json = JSON.parse(text);

            if (!json.sha256 || !Array.isArray(json.folders)) {
                log.warn(`[Serial] Invalid manifest format for ${path}:`, {
                    hasSha256: !!json.sha256,
                    foldersIsArray: Array.isArray(json.folders),
                    json: json,
                });
                return null;
            }

            return {
                sha256: json.sha256,
                folders: json.folders,
            };
        } catch (error) {
            log.warn(`[Serial] Failed to load pack manifest ${path}:`, error);
            return null;
        }
    };

    const loadInstalledPacks = async (): Promise<InstalledPacks> => {
        if (!flags.connected || !flags.rpcActive) {
            return {};
        }

        const installed: InstalledPacks = {};
        log.debug("[Serial] Loading installed asset packs");

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
                } else {
                    log.warn(`[Serial] Failed to load manifest data for pack: ${packId}`);
                }
            }

            const packCount = Object.keys(installed).length;
            if (packCount > 0) {
                log.info(`[Serial] Found ${packCount} installed asset pack(s)`);
            }
        } catch (error) {
            if (error === "ERROR_STORAGE_NOT_EXIST") {
                log.debug("[Serial] Asset packs directory not found (normal for first use)");
                return {};
            }
            log.warn("[Serial] Failed to load installed packs:", error);
            return {};
        }

        connectionData.installedPacks = installed;
        return installed;
    };

    const processInstallPack = async (pack: any): Promise<void> => {
        const stepCount = 3;
        let step = -1;

        const setProgress = (progress: number) => {
            flags.progress = progress / stepCount + (1 / stepCount) * step;
        };

        log.info(`[AssetPacks] Starting installation of pack: ${pack.id}`);
        flags.progress = 0;
        flags.installStatus = InstallStatus.LOADING;
        step++;

        let removeOldPacksTask: Promise<void> | null = null;
        const packTar = await downloadPackWithProgress(pack, setProgress).catch((error) => {
            log.error("[AssetPacks] Failed to fetch pack:", error);
            throw new Error("Failed to fetch pack: " + error.toString());
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
            log.debug(`[AssetPacks] storage.remove: ${tempFile}`);
        } catch (error) {
            log.warn(`[AssetPacks] storage.remove failed for ${tempFile}:`, error);
        }

        await createManifest(pack);
        log.info(`[AssetPacks] Successfully installed pack: ${pack.id}`);
    };

    const processRemovePack = async (pack: any): Promise<void> => {
        log.info(`[AssetPacks] Removing pack: ${pack.id}`);
        flags.installStatus = InstallStatus.DELETING;
        await removeOldPacks(pack);
        delete connectionData.installedPacks[pack.id];
        log.info(`[AssetPacks] Successfully removed pack: ${pack.id}`);
    };

    const enqueue = async (pack: any, action: "install" | "remove"): Promise<void> => {
        if (!flags.serialSupported) return;

        if (!flags.connected || !connectionData.deviceInfo || !flags.rpcActive) {
            throw new Error("Device not connected or RPC not active");
        }

        queueState.queue.push(pack);
        queueState.queueActions.push(action);

        if (queueState.queue.length > 1) {
            return;
        }

        while (queueState.queue.length > 0) {
            try {
                const currentPack = queueState.queue[0];
                const currentAction = queueState.queueActions[0];

                if (currentAction === "remove") {
                    await processRemovePack(currentPack);
                } else if (currentAction === "install") {
                    await processInstallPack(currentPack);
                }
            } catch (error) {
                log.error("[AssetPacks] Queue processing error:", error);
                throw error;
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
                !connectionData.deviceInfo.firmware_version.includes("mntm");

            log.debug(
                `[Serial] Extract capability: ${flags.ableToExtract ? "supported" : "not supported"} (version: ${version})`,
            );
        } catch (error) {
            log.warn("[AssetPacks] Failed to check extract capability:", error);
            flags.ableToExtract = false;
        }
    };

    const restartRpc = async (force: boolean = false): Promise<void> => {
        if ((flags.connected && flags.rpcActive && !flags.restarting) || force) {
            flags.restarting = true;
            await flipper.closeReader();
            await asyncSleep(300);
            await flipper.disconnect();
            await asyncSleep(300);
            await flipper.connect();
            await startRpc();
            flags.restarting = false;
            log.info("[Serial] RPC connection restarted successfully");
        }
    };

    return {
        connectionData,
        flags,
        queueState,
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
        restartRpc,
    };
};
