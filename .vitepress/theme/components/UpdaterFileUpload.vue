<script setup lang="ts">
import { ref } from "vue";
import type { ReleaseItem } from "../../../_data/releases";
import { useI18n, useThemeSwitcher } from "../composables";
import { supportsSerialPort } from "../util";

import Tooltip from "./Tooltip.vue";

const { tr, getLocalizedPath } = useI18n();
const { ifCurrentTheme } = useThemeSwitcher();

defineProps<{
    isOverDropZone: boolean;
    showUpdateOverlay: boolean;
    uploadedFile: File | null;
    uploadedFileRelease: ReleaseItem | null;
    displayFileSize: string;
    displayFileDate: string;
    isInstallButtonHovered: boolean;
    isChangelogExpanded: boolean;
}>();

const emit = defineEmits<{
    (e: "file-selected", file: File): void;
    (e: "clear-file"): void;
}>();

const fileInputRef = ref<HTMLInputElement | null>(null);

const handleFileUpload = () => {
    fileInputRef.value?.click();
};

const handleFileChange = (event: Event) => {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
        emit("file-selected", file);
    }
};

const clearUploadedFile = () => {
    emit("clear-file");
    if (fileInputRef.value) {
        fileInputRef.value.value = "";
    }
};
</script>

<template>
    <div
        class="flex flex-col items-start w-full relative flex-shrink-0 z-[1] transition-all duration-300 px-3.5 sm:px-5 pt-5 gap-y-5 gap-x-3"
        :class="{
            'opacity-50 transition-opacity duration-200': isInstallButtonHovered,
            'opacity-0': showUpdateOverlay,
            'h-0 overflow-hidden': showUpdateOverlay && isChangelogExpanded,
            'opacity-90': isOverDropZone && !showUpdateOverlay,
            'opacity-0 pointer-events-none': showUpdateOverlay && !isChangelogExpanded,
            'mb-0': supportsSerialPort(),
        }"
    >
        <div v-if="supportsSerialPort()" class="flex items-end justify-start gap-2">
            <div class="flex items-center justify-start gap-2">
                <Tooltip
                    :aria-label="tr('releases_install')"
                    :delay="0"
                    :hide-delay="100"
                    :max-width="'315px'"
                    class="files-tooltip z-[1]"
                >
                    <div
                        class="flex items-center justify-center text-vp-3/70 hover:!text-vp-2 transition-colors duration-200 cursor-help"
                    >
                        <v-icon name="md-infooutline-round" scale="0.9" />
                    </div>
                    <template #content>
                        <div
                            class="prose prose-sm !leading-5 dark:prose-invert !text-white max-w-none text-center justify-center"
                        >
                            <span
                                v-html="
                                    tr('updater_install_from_file_tooltip', {
                                        url: getLocalizedPath(`/releases`),
                                        text: `here`,
                                    })
                                "
                            ></span>
                        </div>
                    </template>
                </Tooltip>
                <h3
                    class="text-[13px] leading-3 uppercase font-semibold text-vp-1 mr-2 whitespace-nowrap select-none"
                >
                    {{ tr("updater_or_install_from_file") }}
                </h3>
            </div>
        </div>

        <div v-if="supportsSerialPort() && uploadedFile" class="w-full">
            <div
                class="flex items-center justify-between p-4 bg-vp-bg/55 border border-vp-border/75 rounded-lg border-dashed gap-4"
                :class="{ 'border-vp-3/65': isOverDropZone }"
            >
                <div class="flex items-center gap-4">
                    <div
                        class="flex items-center text-sm rounded-md p-1.5 border transition-all duration-100"
                        :class="
                            uploadedFileRelease
                                ? 'text-green-700 dark:text-green-500 bg-green-300/20 dark:bg-green-900/15 border-green-800/15'
                                : 'text-yellow-600 dark:text-yellow-500 bg-yellow-300/20 dark:bg-yellow-900/15 border-yellow-800/15'
                        "
                        :aria-label="tr('releases_current_version')"
                    >
                        <v-icon name="bi-file-earmark-zip" scale="0.95" />
                    </div>
                    <div class="flex items-center gap-2">
                        <div class="flex flex-col gap-0.5">
                            <span class="text-sm font-medium text-vp-1">
                                {{ uploadedFile.name }}
                            </span>
                            <div class="flex items-center gap-1 text-xs text-vp-2/80 font-medium">
                                <span v-if="uploadedFileRelease?.version">
                                    {{ uploadedFileRelease?.version }}
                                </span>
                                <span
                                    v-if="uploadedFileRelease?.version"
                                    class="!text-vp-3/70 select-none"
                                    >{{ "·" }}</span
                                >
                                <span>{{ displayFileSize }}</span>
                                <span class="!text-vp-3/70 select-none">{{ "·" }}</span>
                                <span>{{ displayFileDate }}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="flex items-center gap-3">
                    <button
                        class="px-3 py-[7px] text-xs font-medium !text-vp-2 hover:!text-vp-1 !bg-vp-3/10 hover:!bg-vp-3/25 dark:!bg-vp-3/10 dark:hover:!bg-vp-3/25 rounded-md transition-colors whitespace-nowrap select-none"
                        @click="handleFileUpload"
                    >
                        {{ tr("updater_change_button") }}
                    </button>
                    <button
                        class="px-3 py-[7px] text-xs font-medium !text-red-500 hover:!text-red-600 !bg-red-500/10 hover:!bg-red-500/25 dark:!bg-red-950/30 dark:hover:!bg-red-900/25 rounded-md transition-colors whitespace-nowrap select-none"
                        @click="clearUploadedFile"
                    >
                        {{ tr("updater_remove_button") }}
                    </button>
                </div>
            </div>
        </div>

        <div
            v-else-if="supportsSerialPort()"
            class="w-full border border-dashed border-vp-border/75 rounded-lg flex items-center justify-center cursor-pointer relative h-min lg:h-[72px] z-10 p-0.5 group transition-colors duration-100"
            :class="{
                'bg-vp-3/10 !border-vp-brand-1': isOverDropZone,
                'opacity-50 !cursor-not-allowed': showUpdateOverlay,
                'hover:bg-vp-brand-3/5 hover:dark:bg-vp-brand-3/5 hover:border-vp-brand-1':
                    !showUpdateOverlay,
            }"
            @click="handleFileUpload"
        >
            <div
                class="flex flex-col items-start gap-0.5 text-center select-none bg-vp-dark/60 dark:bg-vp-bg/80 w-full h-full pt-4 pb-4 px-4 rounded-[5px]"
                :class="{
                    'dark:!bg-vp-bg/50': ifCurrentTheme(['skyline']),
                }"
            >
                <div class="flex flex-row justify-start w-full items-center gap-4 -mt-px -ml-px">
                    <div
                        class="flex-shrink-0 text-vp-2/80 group-hover:text-vp-brand-3 group-hover:dark:text-vp-brand-1 transition-colors duration-200 mt-px"
                    >
                        <v-icon
                            :name="isOverDropZone ? 'bi-folder2-open' : 'oi-upload'"
                            scale="1.2"
                            class="stroke-vp-dark stroke-[0.25] group-hover:scale-105 transition-transform duration-100 ease-in"
                            :class="{
                                'scale-105 text-vp-brand-3 dark:text-vp-brand-1 !stroke-0':
                                    isOverDropZone,
                            }"
                        />
                    </div>
                    <div class="flex flex-col items-start gap-0.5 -mt-px">
                        <p
                            class="text-sm text-left text-vp-1 font-medium tracking-tight dark:font-normal"
                        >
                            {{
                                isOverDropZone
                                    ? tr("updater_drop_file_here")
                                    : tr("updater_drop_file_browse")
                            }}
                        </p>
                        <p
                            class="text-xs text-left text-vp-2/80 font-medium dark:font-normal italic"
                        >
                            {{ tr("updater_file_example") }}
                        </p>
                    </div>
                </div>
            </div>
        </div>

        <input
            ref="fileInputRef"
            type="file"
            accept=".tgz"
            class="hidden"
            @change="handleFileChange"
        />
    </div>
</template>
