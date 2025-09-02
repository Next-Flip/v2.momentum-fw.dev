<script setup lang="ts">
import { useWindowSize } from "@vueuse/core";
import { ref } from "vue";
import type { DevbuildFile, FirmwareFile, MainlineFile } from "../../../_data/releases";
import { useThemeSwitcher } from "../composables/useThemeSwitcher";
import { downloadFile } from "../util";

type File = FirmwareFile | DevbuildFile | MainlineFile;

interface Props {
    files: File[];
}

defineProps<Props>();
const { width } = useWindowSize();
const { ifCurrentTheme } = useThemeSwitcher();

const getFileKey = (file: File) => {
    return "url" in file ? file.url : "filename" in file ? file.filename : "";
};

const getFileName = (file: File) => {
    return "filename" in file
        ? file.filename
        : "url" in file
          ? file.url.split("/").pop() || ""
          : "";
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

const handleMouse = (file: File, action: "down" | "up" | "leave") => {
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

const getDownloadUrl = (file: File) => {
    return "url" in file
        ? file.url
        : `https://up.momentum-fw.dev/builds/firmware/dev/${file.filename}`;
};

const handleDownload = (file: File) => {
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

const getButtonIcon = (file: File) => {
    const key = getFileKey(file);
    return buttonStates.value[key]?.isSuccess ? "bi-check2" : "oi-download";
};

const getButtonScale = (file: File) => {
    const key = getFileKey(file);
    return buttonStates.value[key]?.isPressed ? "scale-[0.99]" : "scale-100";
};
</script>

<template>
    <div class="grid grid-cols-1 gap-3">
        <div
            v-for="file in files"
            :key="getFileKey(file)"
            :aria-label="getFileName(file)"
            class="download-button flex items-center justify-between h-10 py-0.5 pl-2 pr-2.5 border border-vp-divider rounded-lg transition-transform duration-100 group cursor-pointer"
            :class="getButtonScale(file)"
            @click.stop="handleDownload(file)"
            @mousedown="handleMouse(file, 'down')"
            @mouseup="handleMouse(file, 'up')"
            @mouseleave="handleMouse(file, 'leave')"
        >
            <div
                :class="[
                    'py-2 pr-2 text-sm font-medium rounded-md flex items-center justify-center flex-shrink-0 select-none',
                    ifCurrentTheme(['orange'])
                        ? 'text-vp-brand-1 group-hover:text-black dark:group-hover:text-black'
                        : ifCurrentTheme(['white'])
                          ? 'text-vp-alternate-1 group-hover:text-vp-neutral-inverse dark:group-hover:text-vp-neutral-inverse'
                          : 'text-vp-brand-1 group-hover:text-white dark:group-hover:text-white',
                ]"
            >
                <v-icon :name="getButtonIcon(file)" scale="0.9" />
            </div>
            <div class="flex flex-row gap-x-4 items-center justify-start text-left min-w-0 flex-1">
                <span
                    :class="[
                        'font-normal text-vp-1 text-sm truncate whitespace-nowrap overflow-ellipsis select-none',
                        width <= 640 ? 'text-right' : 'text-left',
                        ifCurrentTheme(['orange'])
                            ? 'group-hover:text-black dark:group-hover:text-black'
                            : ifCurrentTheme(['white'])
                              ? 'group-hover:text-vp-neutral-inverse dark:group-hover:text-vp-neutral-inverse'
                              : 'group-hover:text-white dark:group-hover:text-white',
                    ]"
                    :dir="width <= 640 ? 'rtl' : 'ltr'"
                    :title="getFileName(file)"
                >
                    {{ getFileName(file) }}
                </span>
                <div
                    class="text-xs select-none font-mono whitespace-nowrap ml-auto"
                    :class="[
                        ifCurrentTheme(['orange'])
                            ? 'text-vp-brand-1 group-hover:text-black dark:group-hover:text-black'
                            : ifCurrentTheme(['white'])
                              ? 'text-vp-alternate-1 group-hover:text-vp-neutral-inverse dark:group-hover:text-vp-neutral-inverse'
                              : 'text-vp-brand-1 group-hover:text-white dark:group-hover:text-white',
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
