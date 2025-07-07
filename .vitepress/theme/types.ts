export interface AssetPackStats {
    anims?: number;
    icons?: number;
    passport?: string[];
    fonts?: string[];
    folders?: string[];
    updated?: number;
    added?: number;
    [key: string]: any;
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
    updatedDate?: string;
    updatedDateDisplay?: string;
    addedDate?: string;
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
    [key: string]: any;
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
    [key: string]: any;
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

export interface SerialConnectionData {
    state: ConnectionState;
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
    installStatus: InstallStatus | null;
    ableToExtract: boolean | null;
    ableToUpdate: boolean | null;
    restarting: boolean;
    screenStream: boolean;
    screenStreamPaused: boolean;
}

export interface QueueState {
    queue: any[];
    queueActions: string[];
    fakeExtractProgress: NodeJS.Timeout | null;
}

export interface FirmwareState {
    updateStage: string;
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

export const ConnectionState = {
    DISCONNECTED: "disconnected",
    CONNECTING: "connecting",
    CONNECTED: "connected",
    DISCONNECTING: "disconnecting",
    ERROR: "error",
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
    UPDATER_LOGS_OPEN: "momentum-updater_logs_open",
    UPDATER_SELECTED_CHANNEL: "momentum-updater_selected_channel",
    UPDATER_SELECTED_VERSION: "momentum-updater_selected_version",
} as const;
