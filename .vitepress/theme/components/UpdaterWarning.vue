<script setup lang="ts">
import { computed, inject } from "vue";
import type { ReleaseItem } from "../../../_data/releases";
import { useI18n, useSerialConnection } from "../composables";
import { githubPullRequestUrl, replaceIssuesAndMentions } from "../util";

const props = defineProps<{
    isOverDropZone: boolean;
    isBranchRelease: boolean;
    uploadedFile: File | null;
    selectedRelease: ReleaseItem | null;
    isMatchingRelease: boolean;
    additionalMessage?: string;
}>();

const { tr, getLocalizedPath } = useI18n();
const serialConnection = inject<ReturnType<typeof useSerialConnection> | null>("serialConnection");

const additionalMessage = computed(() => {
    if (!props.isBranchRelease || !props.selectedRelease) return undefined;
    return replaceIssuesAndMentions(props.selectedRelease.description ?? "", true) ?? undefined;
});

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
            class="flex flex-col w-full bg-yellow-300/15 dark:bg-orange-800/5 sm:rounded-lg border-y sm:border border-yellow-400/20 dark:border-orange-300/15"
            :class="{
                'opacity-40': isOverDropZone,
            }"
        >
            <div
                class="flex flex-row items-center justify-center gap-2.5 lg:gap-1.5 w-full py-1.5 px-2.5 min-h-10 lg:h-10"
            >
                <div class="flex-shrink-0 h-full flex items-center justify-center">
                    <v-icon
                        :name="isBranchRelease ? 'md-warningamber-round' : 'ri-error-warning-line'"
                        :scale="isBranchRelease ? 1.1 : 1.0"
                        class="text-yellow-600 dark:text-orange-400/90 p-0.5 mb-px"
                    />
                </div>
                <span
                    class="text-xs font-medium text-yellow-700 dark:text-orange-500 flex flex-col md:flex-row gap-1 lg:gap-1.5 pt-1 pb-1.5 lg:pt-0 lg:pb-0 select-none"
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
                            class="font-medium text-yellow-950/90 dark:text-orange-100/90 hover:underline underline underline-offset-4 dark:decoration-orange-200/20 decoration-yellow-950/20 hover:decoration-yellow-950/50 dark:hover:decoration-orange-200/40 transition-all duration-100 vp-external-link-icon"
                            :href="
                                isBranchRelease && !uploadedFile
                                    ? githubPullRequestUrl(selectedRelease?.pr || '')
                                    : `${getLocalizedPath('/releases')}/${currentDeviceVersion}`
                            "
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {{
                                isBranchRelease && !uploadedFile
                                    ? selectedRelease?.version
                                    : currentDeviceVersion
                            }}
                        </a>
                    </div>
                </span>
            </div>

            <Transition name="additional-message-slide">
                <div v-if="!props.uploadedFile && additionalMessage" class="w-full overflow-hidden">
                    <div
                        class="h-px border-b border-solid border-yellow-400/20 dark:border-orange-600/10 w-auto mx-3"
                        :class="{
                            'opacity-30': isOverDropZone,
                        }"
                    ></div>

                    <p
                        class="message text-xs font-medium text-yellow-600 dark:text-orange-400 text-center py-3 px-8 transition-all duration-100"
                        v-html="additionalMessage"
                    ></p>
                </div>
            </Transition>
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

.additional-message-slide-enter-active {
    transition: all 0.3s ease-out;
}

.additional-message-slide-leave-active {
    transition: all 0.25s ease-in;
}

.additional-message-slide-enter-from {
    max-height: 0;
    opacity: 0;
    transform: translateY(-8px);
}

.additional-message-slide-enter-to {
    max-height: 200px;
    opacity: 1;
    transform: translateY(0);
}

.additional-message-slide-leave-from {
    max-height: 200px;
    opacity: 1;
    transform: translateY(0);
}

.additional-message-slide-leave-to {
    max-height: 0;
    opacity: 0;
    transform: translateY(-8px);
}
</style>
