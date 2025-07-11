<script setup lang="ts">
import { useWindowSize } from "@vueuse/core";
import { computed, inject } from "vue";
import { devbuildReleases, mainlineReleases } from "../../../_data/releases";
import { useI18n } from "../composables/useI18n";
import { useReleaseNavigation } from "../composables/useReleaseNavigation";
import type { useSerialConnection } from "../composables/useSerialConnection";

import ReleaseContent from "./ReleaseContent.vue";
import ReleaseItems from "./ReleaseItems.vue";
import ReleasesAside from "./ReleasesAside.vue";

const { tr } = useI18n();
const { width } = useWindowSize();

const serialConnection = inject<ReturnType<typeof useSerialConnection> | null>("serialConnection");

const { selectedRelease, selectRelease } = useReleaseNavigation({
    basePath: "/releases",
    useLocalStorage: false,
    defaultFallback: () => (mainlineReleases.length > 0 ? mainlineReleases[0] : null),
});

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
                    class="hidden lg:block flex-shrink flex-grow-0 w-52 xl:w-60 pr-[20px] pt-5 pb-8"
                >
                    <div class="sticky flex flex-col gap-8 top-20 lg:top-24 overflow-y-auto">
                        <ReleaseItems
                            :title="tr('releases_mainline')"
                            :releases="mainlineReleases"
                            :selected-release="selectedRelease"
                            :class="``"
                            @select-release="selectRelease"
                        />

                        <ReleaseItems
                            :title="tr('releases_devbuilds')"
                            :releases="devbuildReleases"
                            :selected-release="selectedRelease"
                            @select-release="selectRelease"
                        />
                    </div>
                </aside>

                <ReleaseContent
                    :selected-release="selectedRelease"
                    :is-current-version="isCurrentVersion"
                    @select-release="selectRelease"
                />

                <ReleasesAside :selected-release="selectedRelease" />
            </div>
        </div>
    </div>
</template>
