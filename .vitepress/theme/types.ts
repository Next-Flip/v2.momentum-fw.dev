export const ConnectionState = {
    DISCONNECTED: "disconnected",
    CONNECTING: "connecting",
    CONNECTED: "connected",
    DISCONNECTING: "disconnecting",
    ERROR: "error",
    LOCKED: "locked",
} as const;

export type ConnectionState = (typeof ConnectionState)[keyof typeof ConnectionState];

export const InstallStatus = {
    LOADING: "Loading",
    COPYING: "Copying",
    CLEANUP: "Cleanup",
    EXTRACT: "Extract",
    DELETING: "Deleting",
} as const;

export type InstallStatus = (typeof InstallStatus)[keyof typeof InstallStatus];

export interface DeviceInfo {
    hardware_name?: string;
    firmware_version?: string;
    firmware_commit?: string;
    firmware_branch?: string;
    firmware_origin_git?: string;
    firmware_origin_fork?: string;
    hardware_region?: string;
    protobuf_version_major?: number;
    protobuf_version_minor?: number;
    storage_sdcard_present?: string;
    storage_databases_present?: string;
    storage_sdcard_totalSpace?: number | null;
    storage_sdcard_freeSpace?: number | null;
    storage_internal_totalSpace?: number;
    storage_internal_freeSpace?: number;
    [key: string]: unknown;
}

export interface SerialConnectionData {
    state: ConnectionState;
    error?: string;
    deviceInfo?: DeviceInfo;
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
    installStatus: InstallStatus | null;
    ableToExtract: boolean | null;
    ableToUpdate: boolean | null;
    restarting: boolean;
    screenStream: boolean;
    screenStreamPaused: boolean;
}

export interface SerialPort {
    readable?: ReadableStream & { locked?: boolean; cancel(): Promise<void> };
    writable?: WritableStream & { locked?: boolean; abort(): Promise<void> };
    opened?: boolean;
    close(): Promise<void>;
}

export interface AssetPackStats {
    anims?: number;
    icons?: number;
    passport?: string[];
    fonts?: string[];
    folders?: string[];
    updated?: number;
    added?: number;
    [key: string]: unknown;
}

export interface AssetPack {
    id: string;
    name: string;
    author: string;
    description?: string;
    imageUrl: string;
    previewUrls?: string[];
    downloadUrl?: string;
    githubUrl?: string;
    updatedTimestamp?: number;
    addedTimestamp?: number;
    stats?: AssetPackStats;
    installed: boolean;
    installedSha256?: string;
    hasUpdate?: boolean;
    tarFile?: {
        url: string;
        sha256: string;
    };
}

export interface AssetPackFile {
    url?: string;
    path?: string;
    sha256?: string;
    [key: string]: unknown;
}

export interface AssetPackEntry {
    id: string;
    name: string;
    description: string;
    author?: string;
    source_url?: string;
    files: AssetPackFile[];
    preview_urls?: string[];
    stats: AssetPackStats;
    [key: string]: unknown;
}

export interface AssetPacksResponse {
    packs: AssetPackEntry[];
}

export interface InstalledPackManifest {
    sha256: string;
    folders: string[];
}

export interface InstalledPacks {
    [packId: string]: InstalledPackManifest;
}

export interface QueueItem {
    id: string;
    [key: string]: unknown;
}

export interface QueueState {
    queue: QueueItem[];
    queueActions: string[];
    fakeExtractProgress: NodeJS.Timeout | null;
}

export interface FirmwareState {
    updateStage: string;
    updateStageContext: Record<string, string | number>;
    writeProgress: {
        filename: string;
        progress: number;
    };
}

export interface FirmwareChannel {
    url: string;
    version: string;
}

export interface FirmwareChannels {
    [channelName: string]: FirmwareChannel;
}

export interface FirmwareOption {
    label: string;
    value: string;
    version: string;
}

export interface FirmwareFile {
    name: string;
    size: number;
    buffer: ArrayBuffer;
}

export interface RegionBand {
    duty_cycle: number;
    end: number;
    max_power: number;
    start: number;
}

export interface RegionsData {
    bands: Record<string, RegionBand>;
    countries: Record<string, string[]>;
    country: string;
    default: string[];
}

export interface FlipperEmitter {
    on<T = unknown>(event: string, callback: (data: T) => void): () => void;
    removeAllListeners?(): void;
    events?: Record<string, unknown>;
}

export interface FlipperCommands {
    startRpcSession(module: unknown): Promise<{ resolved: boolean; error?: unknown }>;
    stopRpcSession(): Promise<void>;
    system: {
        deviceInfo(): Promise<Array<{ key: string; value: unknown }>>;
        powerInfo(): Promise<Array<{ key: string; value: unknown }>>;
        update(path: string): Promise<void>;
        reboot(mode: number): Promise<void>;
    };
    storage: {
        list(path: string): Promise<Array<{ name: string; type: number; size?: number }>>;
        info(path: string): Promise<{ totalSpace: number; freeSpace: number }>;
        read(path: string): Promise<Uint8Array>;
        write(path: string, data: Uint8Array | ArrayBuffer): Promise<void>;
        remove(path: string, recursive: boolean): Promise<void>;
        mkdir(path: string): Promise<void>;
        tarExtract(sourcePath: string, targetPath: string): Promise<void>;
        stat(path: string): Promise<unknown>;
    };
    gui: {
        startScreenStreamRequest(): Promise<void>;
        stopScreenStreamRequest(): Promise<void>;
    };
}

export interface FlipperModule {
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    closeReader(): Promise<void>;
    emitter: FlipperEmitter;
    commands: FlipperCommands;
}

export const LOGO_COLORS = ["purp", "orange", "pink", "white"] as const;
export type LogoColor = (typeof LOGO_COLORS)[number];

export type SortField = "updatedDate" | "addedDate" | "name" | "author";
export type SortDirection = "asc" | "desc";
export type FilterOption = "isInstalled" | "hasAnims" | "hasIcons" | "hasPassport" | "hasFonts";

export interface DropdownOption {
    value: SortField | FilterOption;
    label: string;
}

export const STORAGE_KEYS = {
    ASSET_PACK_SORT_FIELD: "momentum-asset-packs_sort-field",
    ASSET_PACK_SORT_DIRECTION: "momentum-asset-packs_sort-direction",
    ASSET_PACK_FILTERS: "momentum-asset-packs_filters",
    UPDATER_LOGS_STATE: "momentum-updater_logs_state",
    UPDATER_CHANGELOG_STATE: "momentum-updater_changelog_state",
    UPDATER_SELECTED_CHANNEL: "momentum-updater_selected_channel",
    UPDATER_SELECTED_VERSION: "momentum-updater_selected_version",
    UPDATER_DEVICE_INFO_TAB: "momentum-updater_device-info-tab",
    AUTO_CONNECT: "momentum-autoconnect-enabled",
    THEME_LOCKED: "momentum-theme-locked",
    THEME: "momentum-theme",
} as const;
