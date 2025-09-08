<script setup lang="ts">
import { useWindowSize } from "@vueuse/core";
import { computed } from "vue";
import { devbuildReleases, mainlineReleases } from "../../../_data/releases";
import { useConnectionInfo } from "../composables/useConnectionInfo";
import { useReleaseNavigation } from "../composables/useReleaseNavigation";

import ReleaseContent from "./ReleaseContent.vue";
import ReleaseItems from "./ReleaseItems.vue";
import ReleasesAside from "./ReleasesAside.vue";

const { deviceInfo, isConnected, tr } = useConnectionInfo();

const { width } = useWindowSize();

const { selectedRelease, selectRelease } = useReleaseNavigation({
    basePath: "/releases",
    useLocalStorage: false,
    updatePageTitle: true,
    defaultFallback: () => (mainlineReleases.length > 0 ? mainlineReleases[0] : null),
});

const isCurrentVersion = computed(() => {
    if (!isConnected.value || !deviceInfo.value || !selectedRelease.value) {
        return false;
    }

    const release = selectedRelease.value;
    const deviceVersion = deviceInfo.value.firmware_version || "";
    const deviceCommit = deviceInfo.value.firmware_commit || "";

    if (release.commit) {
        return deviceVersion === "mntm-dev" && deviceCommit === release.version;
    } else {
        return deviceVersion === release.version;
    }
});
</script>

<template>
    <div class="relative w-full py-12 pb-8 pt-0 px-0 items-center justify-center">
        <div class="text-center z-[5] pb-8 pt-8 sm:py-10 lg:py-16">
            <h1
                class="text-vp-1 text-center font-medium tracking-normal text-[32px] lg:text-[40px] leading-8 lg:leading-10 lg:tracking-tight"
            >
                {{ tr("releases_title") }}
            </h1>
            <p
                class="text-sm italic lg:text-base font-normal text-vp-2 pt-3 leading-5 my-0 mx-auto px-5"
            >
                {{ width < 640 ? tr("releases_description_mobile") : tr("releases_description") }}
            </p>
        </div>

        <div class="max-w-7xl mx-auto px-3.5 sm:px-6">
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
