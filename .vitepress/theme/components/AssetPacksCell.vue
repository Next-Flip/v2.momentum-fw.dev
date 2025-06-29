<script setup lang="ts">
import { useTimeAgo } from "@vueuse/core";
import { computed, inject, onMounted, onUnmounted, ref, watch } from "vue";

import type { AssetPackStats } from "../types";
import { ConnectionState } from "../types";
import { downloadFile, shortenTimeString } from "../util";

import { useDots } from "../composables/useDots";
import { useGalleryState } from "../composables/useGalleryState";
import { useI18n } from "../composables/useI18n";
import { useImageCache } from "../composables/useImageCache";
import type { useSerialConnection } from "../composables/useSerialConnection";
import { useTempState } from "../composables/useTempState";
import Tooltip from "./Tooltip.vue";

const { dots, setDelay } = useDots();
const { setGalleryIndex, getGalleryIndex, hasGalleryState } = useGalleryState();
const { getCachedOrProxiedUrl } = useImageCache();
const { tr } = useI18n();
const serialConnection = inject<ReturnType<typeof useSerialConnection>>("serialConnection")!;

const shadowCanvas = ref<HTMLCanvasElement | null>(null);
const imageRefs = ref<Record<number, HTMLImageElement | null>>({});
const imageError = ref(false);
const currentImageIndex = ref(0);
const loadedImages = ref<Set<number>>(new Set());
const srcAlreadySet = ref<Set<number>>(new Set());

const downloadState = useTempState({
    beforeIcon: "la-download-solid",
    afterIcon: "bi-check2",
    beforeText: tr("download"),
    afterText: tr("saved"),
});

interface Props {
    id: string;
    name: string;
    author: string;
    description?: string;
    imageUrl: string;
    previewUrls?: string[];
    downloadUrl?: string;
    githubUrl?: string;
    updatedDate?: string;
    addedDate?: string;
    stats?: AssetPackStats & { folders?: string[] };
    installed: boolean;
    installedSha256?: string;
    hasUpdate?: boolean;
    tarFile?: {
        url: string;
        sha256: string;
    };
}

const props = withDefaults(defineProps<Props>(), {
    description: "",
    previewUrls: () => [],
    downloadUrl: "",
    githubUrl: "",
    updatedDate: undefined,
    addedDate: undefined,
    stats: () => ({ anims: 0, icons: 0, passport: [], fonts: [] }) as AssetPackStats,
    installed: false,
    installedSha256: undefined,
    hasUpdate: false,
    tarFile: undefined,
});

const allPreviewUrls = computed(() => {
    if (props.previewUrls && Array.isArray(props.previewUrls) && props.previewUrls.length > 0) {
        return props.previewUrls;
    }
    return [props.imageUrl];
});

const nextImage = () => {
    if (currentImageIndex.value < allPreviewUrls.value.length - 1) {
        currentImageIndex.value++;
        setGalleryIndex(props.id, currentImageIndex.value, allPreviewUrls.value.length - 1);
    }
};

const prevImage = () => {
    if (currentImageIndex.value > 0) {
        currentImageIndex.value--;
        setGalleryIndex(props.id, currentImageIndex.value, allPreviewUrls.value.length - 1);
    }
};

const setImage = (index: number) => {
    if (index >= 0 && index < allPreviewUrls.value.length) {
        currentImageIndex.value = index;
        setGalleryIndex(props.id, index, allPreviewUrls.value.length - 1);
    }
};

const loadImage = (index: number) => {
    if (srcAlreadySet.value.has(index)) {
        return;
    }

    const url = allPreviewUrls.value[index];
    if (!url) return;

    const img = imageRefs.value[index];
    if (!img) return;

    srcAlreadySet.value.add(index);

    const finalUrl = getCachedOrProxiedUrl(url);
    img.src = finalUrl;
};

const handleImageLoad = (event: Event, index: number) => {
    if (!shadowCanvas.value || !event.target) return;

    const img = event.target as HTMLImageElement;
    loadedImages.value.add(index);

    if (index === 0) {
        try {
            const canvas = shadowCanvas.value;
            canvas.width = img.naturalWidth || img.width;
            canvas.height = img.naturalHeight || img.height;

            const ctx = canvas.getContext("2d");
            if (ctx) {
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            } else {
                console.warn("Failed to get 2d context for shadow canvas");
            }
        } catch (err) {
            console.error("Error drawing shadow image:", err);
        }
    }

    imageError.value = false;
};

const handleImageError = (index: number) => {
    if (index === 0) {
        console.warn(`Failed to load image: ${allPreviewUrls.value[index]}`);
        imageError.value = true;
    }
};

const handleResize = () => {
    const firstImg = imageRefs.value[0];
    if (firstImg && loadedImages.value.has(0)) {
        const event = { target: firstImg } as unknown as Event;
        handleImageLoad(event, 0);
    }
};

watch(currentImageIndex, (newIndex) => {
    loadImage(newIndex);
    if (newIndex + 1 < allPreviewUrls.value.length) {
        setTimeout(() => loadImage(newIndex + 1), 100);
    }
});

watch(
    () => allPreviewUrls.value,
    () => {
        loadedImages.value.clear();
        srcAlreadySet.value.clear();

        if (hasGalleryState(props.id) && allPreviewUrls.value.length > 0) {
            const savedIndex = getGalleryIndex(props.id);
            if (savedIndex < allPreviewUrls.value.length) {
                currentImageIndex.value = savedIndex;
            } else {
                currentImageIndex.value = 0;
                setGalleryIndex(props.id, 0, allPreviewUrls.value.length - 1);
            }
        } else {
            currentImageIndex.value = 0;
            if (allPreviewUrls.value.length > 0) {
                setGalleryIndex(props.id, 0, allPreviewUrls.value.length - 1);
            }
        }

        setTimeout(() => loadImage(currentImageIndex.value), 0);
    },
    { deep: true },
);

const handlePackAction = async (action: "install" | "remove" | "download") => {
    if (action === "download") {
        downloadFile(props.downloadUrl);
        return;
    }

    if (serialConnection.connectionData.state === ConnectionState.CONNECTED) {
        const pack = {
            id: props.id,
            name: props.name,
            author: props.author,
            description: props.description,
            tarFile: props.tarFile || {
                url: props.downloadUrl || "",
                sha256: props.installedSha256 || "",
            },
            stats: {
                ...props.stats,
                folders: props.stats?.folders || [],
            },
        };

        try {
            await serialConnection.enqueue(pack, action);
        } catch (error) {
            console.error(`Failed to enqueue pack ${action}:`, error);
        }
    } else {
        handlePackAction("download");
    }
};

const getActionLabel = computed(() => {
    if (serialConnection.connectionData.state === ConnectionState.CONNECTING) {
        return dots.value;
    }
    if (
        serialConnection.connectionData.state !== ConnectionState.CONNECTED ||
        serialConnection.flags.ableToExtract === false
    ) {
        return tr("download");
    }

    const packInQueue = serialConnection.queueState.queue.some(
        (queuedPack) => queuedPack.id === props.id,
    );
    const isCurrentlyProcessing =
        serialConnection.queueState.queue.length > 0 &&
        serialConnection.queueState.queue[0]?.id === props.id;
    const currentAction = isCurrentlyProcessing
        ? serialConnection.queueState.queueActions[0]
        : null;

    if (isCurrentlyProcessing && serialConnection.flags.installStatus) {
        if (currentAction === "remove") {
            setDelay(800);
            return dots.value;
        } else {
            setDelay();
            return dots.value;
        }
    } else {
        setDelay();
    }

    if (packInQueue) {
        return tr("Loading");
    }

    return props.installed ? tr("reflash") : tr("install");
});

const isBeingDeleted = computed(() => {
    const isCurrentlyProcessing =
        serialConnection.queueState.queue.length > 0 &&
        serialConnection.queueState.queue[0]?.id === props.id;
    const currentAction = isCurrentlyProcessing
        ? serialConnection.queueState.queueActions[0]
        : null;
    return isCurrentlyProcessing && currentAction === "remove";
});

const shortTimeAgo = computed(() => {
    if (!props.updatedDate) return "";
    const timeAgo = useTimeAgo(props.updatedDate);
    return shortenTimeString(timeAgo.value);
});

onMounted(() => {
    if (hasGalleryState(props.id) && allPreviewUrls.value.length > 0) {
        const savedIndex = getGalleryIndex(props.id);
        if (savedIndex < allPreviewUrls.value.length) {
            currentImageIndex.value = savedIndex;
        } else {
            currentImageIndex.value = 0;
            setGalleryIndex(props.id, 0, allPreviewUrls.value.length - 1);
        }
    } else {
        currentImageIndex.value = 0;
        if (allPreviewUrls.value.length > 0) {
            setGalleryIndex(props.id, 0, allPreviewUrls.value.length - 1);
        }
    }

    loadImage(currentImageIndex.value);

    if (typeof window !== "undefined") {
        window.addEventListener("resize", handleResize);
    }
});

onUnmounted(() => {
    if (typeof window !== "undefined") {
        window.removeEventListener("resize", handleResize);
    }
    loadedImages.value.clear();
    srcAlreadySet.value.clear();
});
</script>

<template>
    <div
        class="pack-cell flex flex-col rounded-xl overflow-hidden border border-vp-divider transition-all duration-200 h-full w-full min-w-0 group backdrop-blur"
    >
        <div class="relative overflow-visible mb-[13px] pt-[7px] px-[7px] pb-0">
            <div
                class="absolute top-[-16px] left-[-16px] w-[calc(100%+32px)] h-[calc(100%+32px)] z-0 p-0 pointer-events-none"
                aria-hidden="true"
            >
                <canvas
                    ref="shadowCanvas"
                    class="absolute top-0 left-0 w-full h-full object-cover rounded-[3px] blur-[14px] opacity-5 dark:opacity-25 brightness-[0.95] dark:brightness-[0.65] saturate-0 dark:saturate-100"
                ></canvas>
            </div>
            <div
                class="relative w-full pt-[50%] overflow-hidden rounded-[7px] z-4 shadow-[0_4px_12px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.1)]"
            >
                <img
                    v-for="(url, index) in allPreviewUrls"
                    :key="`${props.id}-${index}-${url}`"
                    :alt="`${name} - preview ${index + 1}`"
                    @load="handleImageLoad($event, index)"
                    @error="handleImageError(index)"
                    :ref="
                        (el) => {
                            imageRefs[index] = el as HTMLImageElement;
                        }
                    "
                    :class="[
                        'cell-image absolute top-0 left-0 w-full h-full object-cover transition-all duration-300 rounded-[7px] opacity-0 saturate-0 contrast-200 brightness-200 dark:saturate-100 dark:contrast-100 dark:brightness-100',
                        {
                            'opacity-100 visible':
                                index === currentImageIndex && loadedImages.has(index),
                        },
                    ]"
                />
                <div
                    v-if="!loadedImages.has(currentImageIndex) && !imageError"
                    class="absolute top-0 left-0 w-full h-full bg-vp-c-bg-soft rounded-[7px] flex items-center justify-center"
                >
                    <div
                        class="w-4 h-4 border-2 border-vp-brand-1 border-t-transparent rounded-full animate-spin"
                    ></div>
                </div>
                <div
                    v-if="imageError"
                    class="absolute top-0 left-0 w-full h-full bg-vp-c-bg-soft rounded-[7px] flex items-center justify-center"
                >
                    <div class="text-vp-2 text-sm opacity-70">
                        <v-icon name="ri-image-line" scale="1.5" />
                    </div>
                </div>
                <div
                    v-if="allPreviewUrls.length > 1"
                    class="absolute top-0 left-0 bottom-0 right-0 z-[5] pointer-events-none opacity-100 xl:opacity-0 xl:invisible transition-opacity duration-200 group-hover:opacity-100 group-hover:visible"
                >
                    <button
                        v-show="currentImageIndex > 0"
                        class="absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-none bg-black/70 backdrop-blur transition-all duration-200 pointer-events-auto flex items-center justify-center left-[6px] hover:bg-black/80 cursor-pointer text-neutral-200 hover:text-neutral-50"
                        @click="prevImage"
                        aria-label="Previous image"
                    >
                        <v-icon name="oi-chevron-left" scale="1" />
                    </button>
                    <button
                        v-show="currentImageIndex < allPreviewUrls.length - 1"
                        class="absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-none bg-black/70 backdrop-blur transition-all duration-200 pointer-events-auto flex items-center justify-center right-[6px] hover:bg-black/80 cursor-pointer text-neutral-200 hover:text-neutral-50"
                        @click="nextImage"
                        aria-label="Next image"
                    >
                        <v-icon name="oi-chevron-right" scale="1" />
                    </button>
                </div>
                <div
                    v-if="allPreviewUrls.length > 1"
                    class="absolute bottom-[4px] left-1/2 -translate-x-1/2 z-6 flex justify-center items-center gap-[5px] opacity-100 xl:opacity-0 xl:invisible transition-opacity duration-200 group-hover:opacity-100 group-hover:visible rounded-[10px] bg-black/70 backdrop-blur p-[4px]"
                >
                    <button
                        v-for="(_, index) in allPreviewUrls"
                        :key="index"
                        :class="[
                            'w-[5px] h-[5px] rounded-[50%] bg-white/50 border-none p-0 cursor-pointer transition-all duration-200 shadow-[0_1px_3px_rgba(0,0,0,0.15)]',
                            { '!bg-white': index === currentImageIndex },
                        ]"
                        @click="setImage(index)"
                    ></button>
                </div>
            </div>
        </div>
        <div class="flex flex-col flex-grow justify-between w-full min-w-0 px-[15px] pb-[15px]">
            <div class="flex flex-col gap-1 w-full min-w-0">
                <span class="text-[19px] font-medium text-vp-1 z-[5] leading-6">{{ name }}</span>
                <div class="flex items-center gap-[10px] text-vp-2 w-full z-[5] text-[14px]">
                    <div class="flex items-center gap-[5px] min-w-0 max-w-full overflow-hidden">
                        <span class="shrink-0">{{ tr("by") }}</span>
                        <Tooltip :delay="300" class="w-full max-w-full min-w-0 overflow-hidden">
                            <a
                                v-if="githubUrl"
                                :href="githubUrl"
                                target="_blank"
                                rel="noopener noreferrer"
                                class="text-vp-brand-1 hover:underline truncate block overflow-hidden text-ellipsis max-w-full"
                                >{{ author }}</a
                            >
                            <span
                                v-else
                                class="block overflow-hidden text-ellipsis truncate max-w-full whitespace-nowrap font-medium transition-colors duration-200 text-vp-brand-1 hover:text-vp-brand-2"
                                >{{ author }}</span
                            >
                            <template #content>{{ author }}</template>
                        </Tooltip>
                    </div>
                    <Tooltip v-if="updatedDate" :delay="300" class="shrink-0">
                        <span
                            class="text-right text-[13px] text-vp-2 opacity-70 italic whitespace-nowrap cursor-default"
                            >{{ shortTimeAgo }}</span
                        >
                        <template #content>
                            <div
                                class="text-left whitespace-nowrap text-[13px] leading-[22px] py-[2px]"
                            >
                                <div v-if="addedDate">{{ tr("added") }}: {{ addedDate }}</div>
                                <div>{{ tr("last_updated") }}: {{ updatedDate }}</div>
                            </div>
                        </template>
                    </Tooltip>
                </div>
                <span
                    class="text-[14px] text-vp-2 leading-[22px] z-[5] grow two-line-description"
                    >{{ description }}</span
                >
                <div
                    v-if="
                        (stats?.anims || 0) > 0 ||
                        (stats?.icons || 0) > 0 ||
                        (stats?.fonts?.length || 0) > 0 ||
                        (stats?.passport?.length || 0) > 0
                    "
                    class="stats-overlay flex items-center justify-start rounded-lg pt-[6px] px-0 z-10 gap-1 -ml-[3px] pb-4"
                >
                    <Tooltip
                        v-if="(stats?.anims || 0) > 0"
                        :aria-label="tr('animations')"
                        :delay="0"
                        class="stat-tooltip h-4 leading-4 w-[15px] z-[5] text-vp-1/55 hover:text-vp-1/80"
                    >
                        <v-icon name="ri-clapperboard-line" scale="0.78" />
                        <template #content>{{
                            (stats?.anims || 0) === 1
                                ? `1 ${tr("animation")}`
                                : `${stats?.anims} ${tr("animations")}`
                        }}</template>
                    </Tooltip>
                    <Tooltip
                        v-if="(stats?.icons || 0) > 0"
                        :aria-label="tr('icons')"
                        :delay="0"
                        class="stat-tooltip h-4 leading-4 w-3.5 z-[5] text-vp-1/55 hover:text-vp-1/80"
                    >
                        <v-icon name="ri-image-line" scale="0.78" />
                        <template #content>{{
                            (stats?.icons || 0) === 1
                                ? `1 ${tr("icons").toLowerCase()}`
                                : `${stats?.icons} ${tr("icons")}`
                        }}</template>
                    </Tooltip>
                    <Tooltip
                        v-if="(stats?.passport?.length || 0) > 0"
                        :aria-label="tr('passport_moods')"
                        :delay="0"
                        class="stat-tooltip h-4 leading-4 w-[14px] z-[5] text-vp-1/55 hover:text-vp-1/80"
                    >
                        <v-icon name="ri-passport-line" scale="0.72" />
                        <template #content>{{
                            stats?.passport?.join(", ") + " " + tr("passport_moods")
                        }}</template>
                    </Tooltip>
                    <Tooltip
                        v-if="(stats?.fonts?.length || 0) > 0"
                        :aria-label="tr('Fonts')"
                        :delay="0"
                        class="stat-tooltip h-4 leading-4 w-4 z-[5] text-vp-1/55 hover:text-vp-1/80"
                    >
                        <v-icon name="md-fontdownload-outlined" scale="0.72" />
                        <template #content>{{
                            stats?.fonts?.join(", ") + " " + tr("Fonts")
                        }}</template>
                    </Tooltip>
                </div>
            </div>
            <div class="asset-pack-actions flex gap-2 justify-end">
                <div v-if="downloadUrl" class="action flex-1 z-[5] cursor-pointer">
                    <a
                        class="inline-flex text-center font-semibold whitespace-nowrap transition-all duration-100 rounded-full py-0 px-5 leading-10 border border-vp-brand-1 bg-transparent text-sm min-h-5 w-full items-center justify-center h-10 box-border hover:bg-vp-brand-3 hover:!border-vp-brand-3 text-vp-1 uppercase hover:text-white select-none pointer-events-auto z-10"
                        :class="{
                            'tracking-widest':
                                serialConnection.connectionData.state ===
                                    ConnectionState.CONNECTING ||
                                (serialConnection.queueState.queue.length > 0 &&
                                    serialConnection.queueState.queue[0]?.id === props.id &&
                                    serialConnection.flags.installStatus),
                            'opacity-50 cursor-not-allowed pointer-events-none':
                                serialConnection.queueState.queue.some(
                                    (queuedPack) => queuedPack.id === props.id,
                                ) || isBeingDeleted,
                        }"
                        :aria-label="getActionLabel"
                        @click="
                            handlePackAction(
                                serialConnection.flags.ableToExtract ? 'install' : 'download',
                            )
                        "
                        download
                        >{{ getActionLabel }}</a
                    >
                </div>

                <template
                    v-if="
                        serialConnection.connectionData.state === ConnectionState.CONNECTED &&
                        !isBeingDeleted
                    "
                >
                    <Tooltip
                        v-if="downloadUrl && serialConnection.flags.ableToExtract"
                        :delay="400"
                        class="min-w-0 overflow-hidden"
                    >
                        <div class="action w-10 z-[5]">
                            <button
                                @click="
                                    () => {
                                        downloadState.trigger();
                                        handlePackAction('download');
                                    }
                                "
                                :aria-label="downloadState.currentText.value"
                                class="download-button-small inline-flex text-center font-semibold whitespace-nowrap transition-all duration-100 rounded-full py-0 px-0 leading-[38px] text-sm w-full items-center justify-center h-10 box-border text-vp-2 hover:text-vp-brand-1 select-none pointer-events-auto !z-[999]"
                                :class="{ 'scale-95': downloadState.isPressed.value }"
                                @mousedown="downloadState.handleMouseDown"
                                @mouseup="downloadState.handleMouseUp"
                            >
                                <v-icon :name="downloadState.currentIcon.value" :scale="1.1" />
                            </button>
                        </div>
                        <template #content>{{ downloadState.currentText.value }}</template>
                    </Tooltip>
                    <Tooltip
                        v-if="installed && serialConnection.flags.ableToExtract"
                        :delay="400"
                        class="min-w-0 overflow-hidden"
                    >
                        <div v-if="installed" class="action w-10 z-[5]">
                            <button
                                :aria-label="tr('delete')"
                                class="delete-button inline-flex text-center font-semibold whitespace-nowrap transition-colors duration-100 rounded-full py-0 px-0 leading-[38px] text-sm w-full items-center justify-center h-10 box-border text-red-500 hover:text-red-600 select-none pointer-events-auto !z-[999]"
                                :class="{
                                    'opacity-50 cursor-not-allowed pointer-events-none':
                                        serialConnection.queueState.queue.some(
                                            (queuedPack) => queuedPack.id === props.id,
                                        ) || isBeingDeleted,
                                }"
                                :disabled="
                                    serialConnection.queueState.queue.some(
                                        (queuedPack) => queuedPack.id === props.id,
                                    ) || isBeingDeleted
                                "
                                @click="handlePackAction('remove')"
                            >
                                <v-icon name="pr-trash" scale="1.05" />
                            </button>
                        </div>
                        <template #content>{{ tr("delete") }}</template>
                    </Tooltip>
                </template>
            </div>
        </div>
    </div>
</template>

<style scoped>
.download-button-small {
    border: 1px solid var(--vp-c-border);
}

.download-button-small:hover {
    background-color: color-mix(in srgb, var(--vp-c-default-soft) 100%, transparent);
    border-color: color-mix(in srgb, var(--vp-c-divider) 70%, transparent);
}

.delete-button {
    border: 1px solid rgb(239 68 68 / var(--tw-text-opacity, 1));
}

.delete-button:hover {
    @apply bg-red-600 text-neutral-100 border-red-600;
}

.cell-image {
    image-rendering: pixelated;
}

.pack-cell {
    background-image: linear-gradient(
        to bottom,
        var(--vp-c-bg-soft),
        color-mix(in srgb, var(--vp-c-bg-elv) 100%, transparent)
    );
    transform: translateZ(0);
    backface-visibility: hidden;
}

@media (min-width: 1281px) {
    .pack-cell:hover {
        transform: translateY(-5px);
    }
}

.dark .pack-cell:hover {
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);
}

.stats-overlay {
    z-index: 5;
}

.stat-tooltip :deep(.tooltip-trigger) {
    display: inline-flex;
    height: 16px;
    width: 20px;
    align-items: center;
    justify-content: center;
    cursor: default !important;
}

.asset-pack-actions .action {
    padding: 0;
}

.asset-pack-actions .action a {
    width: 100%;
    padding: 0;
}

.asset-pack-actions .download-action {
    flex: 1;
    z-index: 5;
}

.asset-pack-actions .action button {
    font-size: 0.85em;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    height: 40px;
    width: 40px;
}

.two-line-description {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: normal;
    min-height: 44px;
}
</style>
