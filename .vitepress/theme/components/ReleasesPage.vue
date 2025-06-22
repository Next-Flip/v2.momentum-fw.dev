<script setup lang="ts">
import { useWindowSize } from "@vueuse/core";
import { useData } from "vitepress";
import { computed, inject, onMounted, onUnmounted, ref, watch } from "vue";
import type { ReleaseItem } from "../../../_data/releases";
import { devbuildReleases, mainlineReleases } from "../../../_data/releases";
import { useI18n } from "../composables/useI18n";
import type { useSerialConnection } from "../composables/useSerialConnection";

import ReleaseContent from "./ReleaseContent.vue";
import ReleaseItems from "./ReleaseItems.vue";
import ReleasesAside from "./ReleasesAside.vue";

const { tr } = useI18n();
const { width } = useWindowSize();
const { params } = useData();
const selectedRelease = ref<ReleaseItem | null>(null);
const isInitialLoad = ref(true);

const serialConnection = inject<ReturnType<typeof useSerialConnection> | null>("serialConnection");

const isCurrentVersion = computed(() => {
    if (
        !serialConnection?.flags.connected ||
        !serialConnection?.connectionData.deviceInfo ||
        !selectedRelease.value
    ) {
        return false;
    }

    const deviceInfo = serialConnection.connectionData.deviceInfo;
    const release = selectedRelease.value;

    if (release.version && release.version.startsWith("mntm-")) {
        const deviceVersion = deviceInfo.firmware_version || "";
        return deviceVersion.includes(release.version);
    }

    if (release.commit) {
        const deviceCommit = deviceInfo.firmware_commit || "";
        return deviceCommit === release.commit;
    }

    return false;
});

const findReleaseByVersion = (version: string): ReleaseItem | null => {
    if (!version) return null;

    const allReleases = [...mainlineReleases, ...devbuildReleases];

    let release = allReleases.find((r) => r.commit === version);
    if (release) return release;

    release = allReleases.find((r) => r.commit.startsWith(version));
    if (release) return release;

    release = allReleases.find((r) => r.version && r.version.includes(version));
    if (release) return release;

    return null;
};

const selectRelease = (release: ReleaseItem) => {
    selectedRelease.value = release;

    if (typeof window !== "undefined") {
        const currentPath = window.location.pathname;
        const basePath = currentPath.split("/releases")[0] || "";
        const newPath = `${basePath}/releases/${release.commit}`;

        if (isInitialLoad.value) {
            history.replaceState(null, "", newPath);
            isInitialLoad.value = false;
        } else {
            history.pushState(null, "", newPath);
        }
    } else {
        if (isInitialLoad.value) {
            isInitialLoad.value = false;
        }
    }
};

const initializeSelectedRelease = () => {
    const version = params.value?.version;

    if (version) {
        const release = findReleaseByVersion(version);
        if (release) {
            selectedRelease.value = release;
            isInitialLoad.value = false;
            return;
        } else {
            console.warn(`Release not found for version: ${version}`);
        }
    }

    if (mainlineReleases.length > 0) {
        selectedRelease.value = mainlineReleases[0];
        isInitialLoad.value = false;
    }
};

const handlePopState = () => {
    initializeSelectedRelease();
};

watch(
    () => params.value?.version,
    (newVersion) => {
        if (newVersion) {
            const release = findReleaseByVersion(newVersion);
            if (release && release.commit !== selectedRelease.value?.commit) {
                selectedRelease.value = release;
            }
        }
    },
);

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
</script>

<template>
    <div class="relative w-full py-12 pb-6 pt-0 px-0 items-center justify-center">
        <div class="text-center z-[5] pb-8 pt-8 sm:py-10 lg:py-16">
            <h1
                class="text-vp-1 text-center font-medium tracking-normal text-[32px] lg:text-[40px] leading-8 lg:leading-10 lg:tracking-tight"
            >
                {{ tr("releases_title") }}
            </h1>
            <p class="text-sm lg:text-base font-medium text-vp-2 pt-3 leading-5 my-0 mx-auto px-3">
                {{ width < 640 ? tr("releases_description_mobile") : tr("releases_description") }}
            </p>
        </div>

        <div class="max-w-7xl mx-auto px-6 lg:px-8">
            <div class="flex flex-row justify-center">
                <aside
                    class="hidden lg:block flex-shrink flex-grow-0 w-52 xl:w-60 pr-[26px] pt-5 pb-8"
                >
                    <div class="sticky flex flex-col gap-8 top-20 lg:top-24 overflow-y-auto">
                        <ReleaseItems
                            :title="tr('releases_mainline')"
                            :releases="mainlineReleases"
                            :selectedRelease="selectedRelease"
                            @selectRelease="selectRelease"
                            :class="``"
                        />

                        <ReleaseItems
                            :title="tr('releases_devbuilds')"
                            :releases="devbuildReleases"
                            :selectedRelease="selectedRelease"
                            @selectRelease="selectRelease"
                        />
                    </div>
                </aside>

                <ReleaseContent
                    :selectedRelease="selectedRelease"
                    :isCurrentVersion="isCurrentVersion"
                    @selectRelease="selectRelease"
                />

                <ReleasesAside :selectedRelease="selectedRelease" />
            </div>
        </div>
    </div>
</template>
