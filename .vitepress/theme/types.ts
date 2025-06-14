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

export const ConnectionState = {
    DISCONNECTED: "disconnected",
    CONNECTING: "connecting",
    CONNECTED: "connected",
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
} as const;
