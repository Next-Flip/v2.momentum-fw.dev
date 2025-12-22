<script setup lang="ts">
import { computed, inject } from "vue";
import type { ReleaseItem } from "../../../_data/releases";
import { useI18n, useSerialConnection } from "../composables";
import { githubPullRequestUrl } from "../util";

defineProps<{
    isOverDropZone: boolean;
    isBranchRelease: boolean;
    uploadedFile: File | null;
    selectedRelease: ReleaseItem | null;
    isMatchingRelease: boolean;
}>();

const { tr, getLocalizedPath } = useI18n();
const serialConnection = inject<ReturnType<typeof useSerialConnection> | null>("serialConnection");

const currentDeviceVersion = computed(() => {
    return serialConnection?.connectionData.deviceInfo?.firmware_version === "mntm-dev"
        ? serialConnection?.connectionData.deviceInfo?.firmware_commit
        : serialConnection?.connectionData.deviceInfo?.firmware_version;
});
</script>

<template>
    <Transition name="fade-drop" mode="out-in">
        <div
            v-if="isMatchingRelease || (isBranchRelease && !uploadedFile)"
            class="flex flex-row items-center justify-center gap-2.5 lg:gap-1.5 w-full py-1.5 px-2.5 lg:mb-0 border-b border-vp-divider bg-orange-300/15 dark:bg-orange-800/5 min-h-10 lg:h-10"
            :class="{
                'opacity-40': isOverDropZone,
            }"
        >
            <div class="flex-shrink-0 h-full flex items-center justify-center">
                <v-icon
                    :name="isBranchRelease ? 'md-warningamber-round' : 'ri-error-warning-line'"
                    :scale="isBranchRelease ? 1.1 : 1.0"
                    class="text-orange-600 dark:text-orange-500 p-0.5 mb-px"
                />
            </div>
            <span
                class="text-xs font-medium text-orange-700 dark:text-orange-500 flex flex-col md:flex-row gap-1 lg:gap-1.5 pt-1 pb-1.5 lg:pt-0 lg:pb-0"
            >
                {{
                    isBranchRelease && isMatchingRelease && !uploadedFile
                        ? tr("updater_branch_matching_warning")
                        : isMatchingRelease
                          ? uploadedFile
                              ? tr("updater_matching_release_warning", {
                                    type: tr("updater_upload_file"),
                                })
                              : tr("updater_matching_release_warning", {
                                    type: tr("updater_select_release"),
                                })
                          : isBranchRelease
                            ? tr("updater_branch_warning")
                            : ""
                }}
                <div class="flex flex-row gap-px">
                    <a
                        class="font-medium text-orange-950/90 dark:text-orange-100/90 hover:underline underline underline-offset-4 dark:decoration-orange-200/20 decoration-orange-950/20 hover:decoration-orange-950/50 dark:hover:decoration-orange-200/40 transition-all duration-100 vp-external-link-icon"
                        :href="
                            isBranchRelease
                                ? githubPullRequestUrl(selectedRelease?.pr || '')
                                : `${getLocalizedPath('/releases')}/${currentDeviceVersion}`
                        "
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        {{ isBranchRelease ? selectedRelease?.version : currentDeviceVersion }}
                    </a>
                </div>
            </span>
        </div>
    </Transition>
</template>

<style scoped>
.fade-drop-enter-active,
.fade-drop-leave-active {
    transition: all 0.4s ease-out;
}

.fade-drop-enter-from {
    opacity: 0;
    transform: translateY(-10px);
}

.fade-drop-enter-to {
    opacity: 1;
    transform: translateY(0);
}

.fade-drop-leave-from {
    opacity: 1;
    transform: translateY(0);
}

.fade-drop-leave-to {
    opacity: 0;
    transform: translateY(-10px);
}
</style>
