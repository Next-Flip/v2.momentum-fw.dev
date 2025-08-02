<script setup lang="ts">
import { useWindowSize } from "@vueuse/core";
import { ref } from "vue";
import type { DevbuildFile, MainlineFile } from "../../../_data/releases";
import { useThemeSwitcher } from "../composables/useThemeSwitcher";
import { downloadFile } from "../util";

type FirmwareFile = DevbuildFile | MainlineFile;

interface Props {
    files: FirmwareFile[];
}

defineProps<Props>();
const { width } = useWindowSize();
const { currentTheme } = useThemeSwitcher();

const getFileKey = (file: FirmwareFile) => {
    return "url" in file ? file.url : file.filename;
};

const buttonStates = ref<
    Record<
        string,
        {
            isPressed: boolean;
            isSuccess: boolean;
            timeout?: NodeJS.Timeout;
        }
    >
>({});

const handleMouse = (file: FirmwareFile, action: "down" | "up" | "leave") => {
    const key = getFileKey(file);
    if (!buttonStates.value[key]) {
        buttonStates.value[key] = { isPressed: false, isSuccess: false };
    }

    if (action === "down") {
        buttonStates.value[key].isPressed = true;
    } else {
        buttonStates.value[key].isPressed = false;
    }
};

const getDownloadUrl = (file: FirmwareFile) => {
    return "url" in file
        ? file.url
        : `https://up.momentum-fw.dev/builds/firmware/dev/${file.filename}`;
};

const handleDownload = (file: FirmwareFile) => {
    const key = getFileKey(file);
    if (!buttonStates.value[key]) {
        buttonStates.value[key] = { isPressed: false, isSuccess: false };
    }

    buttonStates.value[key].isSuccess = true;

    if (buttonStates.value[key].timeout) {
        clearTimeout(buttonStates.value[key].timeout);
    }

    buttonStates.value[key].timeout = setTimeout(() => {
        if (buttonStates.value[key]) {
            buttonStates.value[key].isSuccess = false;
        }
    }, 3000);

    downloadFile(getDownloadUrl(file));
};

const getButtonIcon = (file: FirmwareFile) => {
    const key = getFileKey(file);
    return buttonStates.value[key]?.isSuccess ? "bi-check2" : "la-download-solid";
};

const getButtonScale = (file: FirmwareFile) => {
    const key = getFileKey(file);
    return buttonStates.value[key]?.isPressed ? "scale-[0.99]" : "scale-100";
};
</script>

<template>
    <div class="grid grid-cols-1 gap-3">
        <div
            v-for="file in files"
            :key="'url' in file ? file.url : file.filename"
            :aria-label="file.filename"
            class="download-button flex items-center justify-between h-10 py-0.5 pl-2 pr-2.5 border border-vp-divider rounded-lg transition-all duration-100 group cursor-pointer"
            :class="getButtonScale(file)"
            @click="handleDownload(file)"
            @mousedown="handleMouse(file, 'down')"
            @mouseup="handleMouse(file, 'up')"
            @mouseleave="handleMouse(file, 'leave')"
        >
            <div
                :class="[
                    'py-2 pr-2 text-vp-brand-1/60 saturate-[70%] text-sm font-medium rounded-md transition-all duration-100 flex items-center justify-center flex-shrink-0 select-none',
                    currentTheme === 'orange'
                        ? 'group-hover:text-black dark:group-hover:text-black'
                        : currentTheme === 'white'
                          ? 'group-hover:text-vp-neutral-inverse dark:group-hover:text-vp-neutral-inverse'
                          : 'group-hover:text-white dark:group-hover:text-white',
                ]"
            >
                <v-icon :name="getButtonIcon(file)" scale="0.9" />
            </div>
            <div class="flex flex-row gap-x-4 items-center justify-start text-left min-w-0 flex-1">
                <span
                    :class="[
                        'font-normal text-vp-1 text-sm truncate whitespace-nowrap overflow-ellipsis select-none',
                        width <= 640 ? 'text-right' : 'text-left',
                        currentTheme === 'orange'
                            ? 'group-hover:text-black dark:group-hover:text-black'
                            : currentTheme === 'white'
                              ? 'group-hover:text-vp-neutral-inverse dark:group-hover:text-vp-neutral-inverse'
                              : 'group-hover:text-white dark:group-hover:text-white',
                    ]"
                    :dir="width <= 640 ? 'rtl' : 'ltr'"
                    :title="file.filename"
                >
                    {{ file.filename }}
                </span>
                <div
                    class="text-xs text-vp-brand-1/80 select-none font-mono whitespace-nowrap ml-auto"
                    :class="[
                        currentTheme === 'orange'
                            ? 'group-hover:text-black dark:group-hover:text-black'
                            : currentTheme === 'white'
                              ? 'group-hover:text-vp-neutral-inverse dark:group-hover:text-vp-neutral-inverse'
                              : 'group-hover:text-white dark:group-hover:text-white',
                    ]"
                >
                    {{
                        [
                            "type" in file ? file.type : "",
                            "size" in file ? file.size : "",
                            "target" in file ? file.target : "",
                        ]
                            .filter(Boolean)
                            .join(" • ")
                    }}
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.download-button {
    background-color: color-mix(in srgb, var(--vp-c-bg-elv) 95%, transparent) !important;
    backdrop-filter: blur(10px) !important;
}
.dark .download-button {
    background-color: color-mix(in srgb, var(--vp-c-bg-dark) 95%, transparent) !important;
    backdrop-filter: blur(10px) !important;
}
.download-button:hover {
    background-color: var(--vp-c-brand-1) !important;
    backdrop-filter: blur(10px) !important;
    border-color: var(--vp-c-brand-2) !important;
}
.dark .download-button:hover {
    background-color: var(--vp-c-brand-3) !important;
    border-color: var(--vp-c-brand-3) !important;
}
</style>
