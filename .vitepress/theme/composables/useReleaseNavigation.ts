import { useData } from "vitepress";
import { onMounted, onUnmounted, ref, watch, type Ref } from "vue";
import type { ReleaseItem } from "../../../_data/releases";
import { getReleaseByVersion, mainlineReleases } from "../../../_data/releases";
import { useHead, type HeadConfig } from "./useHead";

export interface ReleaseNavigationConfig {
    basePath: string;
    useLocalStorage?: boolean;
    useQueryParams?: boolean;
    updatePageTitle?: boolean;
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

    const headConfig: Ref<HeadConfig> = ref({
        title: "",
        ogTitle: "",
        ogDescription: "",
        ogImage: "",
        ogUrl: "",
        twitterTitle: "",
        twitterDescription: "",
        twitterImage: "",
    });

    if (config.updatePageTitle) {
        useHead(headConfig);
    }

    const updateHeadForRelease = (release: ReleaseItem) => {
        if (!config.updatePageTitle) return;

        const isMainline = mainlineReleases.some((r) => r.version === release.version);
        const displayVersion = release.version.toUpperCase();
        const title = `${displayVersion} | ${isMainline ? "Mainline Release" : "Dev build"}`;
        const description = `Changelog and downloads for the ${displayVersion} ${isMainline ? "release" : "devbuild"}`;

        headConfig.value = {
            title,
            ogTitle: title,
            ogDescription: description,
            ogImage: `https://momentum-fw.dev/og/${release.version}.png`,
            ogUrl: `https://momentum-fw.dev/releases/${release.version}`,
            twitterTitle: title,
            twitterDescription: description,
            twitterImage: `https://momentum-fw.dev/og/${release.version}.png`,
        };
    };

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
        updateHeadForRelease(release);

        if (config.onReleaseChange) {
            config.onReleaseChange(release);
        }

        if (typeof window !== "undefined") {
            if (config.useQueryParams) {
                const url = new URL(window.location.href);
                url.searchParams.set("version", release.version);

                if (isInitialLoad.value) {
                    history.replaceState(null, "", url.toString());
                    isInitialLoad.value = false;
                } else {
                    history.pushState(null, "", url.toString());
                }
            } else {
                const currentPath = window.location.pathname;
                const basePath = currentPath.split(config.basePath)[0] || "";
                const newPath = `${basePath}${config.basePath}/${release.version}`;

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
            const release = getReleaseByVersion(version);
            if (release) {
                selectedRelease.value = release;
                updateHeadForRelease(release);
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
                const savedVersion = localStorage.getItem(config.storageKeys.selectedVersion);
                if (savedVersion && savedVersion !== "null") {
                    const release = getReleaseByVersion(savedVersion);
                    if (release) {
                        selectedRelease.value = release;
                        updateHeadForRelease(release);
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
                updateHeadForRelease(defaultRelease);
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

    if (!config.useQueryParams) {
        watch(
            () => params.value?.version,
            (newVersion) => {
                if (newVersion) {
                    const release = getReleaseByVersion(newVersion);
                    if (release && release.version !== selectedRelease.value?.version) {
                        selectedRelease.value = release;
                        updateHeadForRelease(release);
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
                    if (newRelease?.version) {
                        localStorage.setItem(
                            config.storageKeys!.selectedVersion!,
                            newRelease.version,
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
