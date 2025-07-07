import { useData } from "vitepress";
import { onMounted, onUnmounted, ref, watch } from "vue";
import type { ReleaseItem } from "../../../_data/releases";
import { findReleaseByVersion } from "../util";

export interface ReleaseNavigationConfig {
    basePath: string;
    useLocalStorage?: boolean;
    useQueryParams?: boolean;
    storageKeys?: {
        selectedVersion?: string;
        selectedChannel?: string;
    };
    defaultFallback?: () => ReleaseItem | null;
    onReleaseChange?: (release: ReleaseItem) => void;
}

export function useReleaseNavigation(config: ReleaseNavigationConfig) {
    const { params } = useData();
    const selectedRelease = ref<ReleaseItem | null>(null);
    const isInitialLoad = ref(true);

    const getVersionFromUrl = () => {
        if (config.useQueryParams) {
            if (typeof window !== "undefined") {
                const urlParams = new URLSearchParams(window.location.search);
                return urlParams.get("version") || urlParams.get("") || null;
            }
            return null;
        } else {
            return params.value?.version || null;
        }
    };

    const selectRelease = (release: ReleaseItem) => {
        selectedRelease.value = release;

        if (config.onReleaseChange) {
            config.onReleaseChange(release);
        }

        if (typeof window !== "undefined") {
            if (config.useQueryParams) {
                const url = new URL(window.location.href);
                url.searchParams.set("version", release.commit);

                if (isInitialLoad.value) {
                    history.replaceState(null, "", url.toString());
                    isInitialLoad.value = false;
                } else {
                    history.pushState(null, "", url.toString());
                }
            } else {
                const currentPath = window.location.pathname;
                const basePath = currentPath.split(config.basePath)[0] || "";
                const newPath = `${basePath}${config.basePath}/${release.commit}`;

                if (isInitialLoad.value) {
                    history.replaceState(null, "", newPath);
                    isInitialLoad.value = false;
                } else {
                    history.pushState(null, "", newPath);
                }
            }
        } else {
            if (isInitialLoad.value) {
                isInitialLoad.value = false;
            }
        }
    };

    const initializeSelectedRelease = () => {
        const version = getVersionFromUrl();

        if (version) {
            const release = findReleaseByVersion(version);
            if (release) {
                selectedRelease.value = release;
                if (config.onReleaseChange) {
                    config.onReleaseChange(release);
                }
                isInitialLoad.value = false;
                return;
            } else {
                console.warn(`Release not found for version: ${version}`);
            }
        }

        if (
            config.useLocalStorage &&
            config.storageKeys?.selectedVersion &&
            typeof window !== "undefined"
        ) {
            try {
                const savedCommit = localStorage.getItem(config.storageKeys.selectedVersion);
                if (savedCommit && savedCommit !== "null") {
                    const release = findReleaseByVersion(savedCommit);
                    if (release) {
                        selectedRelease.value = release;
                        if (config.onReleaseChange) {
                            config.onReleaseChange(release);
                        }
                        isInitialLoad.value = false;
                        return;
                    }
                }
            } catch (error) {
                console.warn("Error loading from localStorage:", error);
            }
        }

        if (config.defaultFallback) {
            const defaultRelease = config.defaultFallback();
            if (defaultRelease) {
                selectedRelease.value = defaultRelease;
                if (config.onReleaseChange) {
                    config.onReleaseChange(defaultRelease);
                }
            }
        }

        isInitialLoad.value = false;
    };

    const handlePopState = () => {
        initializeSelectedRelease();
    };

    if (config.useQueryParams) {
    } else {
        watch(
            () => params.value?.version,
            (newVersion) => {
                if (newVersion) {
                    const release = findReleaseByVersion(newVersion);
                    if (release && release.commit !== selectedRelease.value?.commit) {
                        selectedRelease.value = release;
                        if (config.onReleaseChange) {
                            config.onReleaseChange(release);
                        }
                    }
                }
            },
        );
    }

    if (config.useLocalStorage && config.storageKeys?.selectedVersion) {
        watch(
            () => selectedRelease.value,
            (newRelease) => {
                if (typeof window !== "undefined") {
                    if (newRelease?.commit) {
                        localStorage.setItem(
                            config.storageKeys!.selectedVersion!,
                            newRelease.commit,
                        );
                    } else {
                        localStorage.removeItem(config.storageKeys!.selectedVersion!);
                    }
                }
            },
        );
    }

    onMounted(() => {
        initializeSelectedRelease();

        if (typeof window !== "undefined") {
            window.addEventListener("popstate", handlePopState);
        }
    });

    onUnmounted(() => {
        if (typeof window !== "undefined") {
            window.removeEventListener("popstate", handlePopState);
        }
    });

    return {
        selectedRelease,
        selectRelease,
        isInitialLoad,
    };
}
