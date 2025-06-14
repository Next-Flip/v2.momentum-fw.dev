<script setup lang="ts">
import { useWindowSize } from "@vueuse/core";
import { ref } from "vue";

interface Props {
    files: any[];
    branch: string;
}

defineProps<Props>();
const { width } = useWindowSize();

const getFilename = (file: any) => {
    return "filename" in file ? file.filename : file.url.split("/").pop() || "";
};

const getFileKey = (file: any) => {
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

const handleMouse = (file: any, action: "down" | "up" | "leave") => {
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

const getDownloadUrl = (file: any, branch: string) => {
    if (branch.includes("dev")) {
        return `https://up.momentum-fw.dev/builds/firmware/dev/${file.filename}`;
    }
    return file.url;
};

const handleDownload = (file: any, branch: string) => {
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

    import("../util").then(({ downloadFile }) => {
        downloadFile(getDownloadUrl(file, branch));
    });
};

const getButtonIcon = (file: any) => {
    const key = getFileKey(file);
    return buttonStates.value[key]?.isSuccess ? "bi-check2" : "la-download-solid";
};

const getButtonScale = (file: any) => {
    const key = getFileKey(file);
    return buttonStates.value[key]?.isPressed ? "scale-[0.99]" : "scale-100";
};
</script>

<template>
    <div class="grid grid-cols-1 gap-3">
        <div
            v-for="file in files"
            :key="'url' in file ? file.url : file.filename"
            @click="handleDownload(file, branch)"
            @mousedown="handleMouse(file, 'down')"
            @mouseup="handleMouse(file, 'up')"
            @mouseleave="handleMouse(file, 'leave')"
            :aria-label="getFilename(file)"
            class="download-button flex items-center justify-between h-10 py-0.5 pl-2 pr-2.5 border border-vp-divider rounded-lg transition-all duration-100 group cursor-pointer"
            :class="getButtonScale(file)"
        >
            <div
                :class="[
                    'py-2 pr-2 text-vp-3 group-hover:text-vp-brand-2 text-sm font-medium rounded-md transition-all duration-200 flex items-center justify-center flex-shrink-0 select-none',
                ]"
            >
                <v-icon :name="getButtonIcon(file)" scale="0.9" />
            </div>
            <div class="flex flex-row gap-x-4 items-center justify-start text-left min-w-0 flex-1">
                <span
                    :class="[
                        'font-normal text-vp-1 text-sm truncate whitespace-nowrap overflow-ellipsis select-none',
                        width <= 640 ? 'text-right' : 'text-left',
                    ]"
                    :dir="width <= 640 ? 'rtl' : 'ltr'"
                    :title="getFilename(file)"
                >
                    {{ getFilename(file) }}
                </span>
                <div
                    class="text-xs text-vp-brand-1/80 select-none font-mono whitespace-nowrap ml-auto"
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
    background-color: color-mix(in srgb, var(--vp-c-bg-soft) 35%, transparent) !important;
    backdrop-filter: blur(10px) !important;
}
.dark .download-button {
    background-color: color-mix(in srgb, var(--vp-c-bg-dark) 95%, transparent) !important;
    backdrop-filter: blur(10px) !important;
}
.download-button:hover {
    background-color: color-mix(in srgb, var(--vp-c-bg-elv) 25%, transparent) !important;
    backdrop-filter: blur(10px) !important;
    border-color: var(--vp-c-brand-2) !important;
}
.dark .download-button:hover {
    border-color: var(--mntm-yellow-1) !important;
}
</style>
