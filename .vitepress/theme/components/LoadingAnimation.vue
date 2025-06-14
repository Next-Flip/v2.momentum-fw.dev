<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";

interface Props {
    framesCount?: number;
    frameSpeed?: number;
    textSpeed?: number;
    basePath?: string;
    baseText?: string;
}

const props = withDefaults(defineProps<Props>(), {
    framesCount: 7,
    frameSpeed: 120,
    textSpeed: 500,
    basePath: "/loading/",
    baseText: "Loading asset packs",
});

const currentFrame = ref(1);
const imageInterval = ref<number | null>(null);
const currentImageSrc = ref("");
const imageError = ref(false);

const updateImageSrc = (): void => {
    if (imageError.value) return;

    const frameNumber = String(currentFrame.value).padStart(2, "0");
    currentImageSrc.value = `${props.basePath}frame_${frameNumber}.png`;
    currentFrame.value = currentFrame.value >= props.framesCount ? 1 : currentFrame.value + 1;
};

const handleImageError = (): void => {
    console.warn("Error loading animation frames. Using text-only loading indicator.");
    imageError.value = true;

    if (imageInterval.value) {
        clearInterval(imageInterval.value);
        imageInterval.value = null;
    }
};

onMounted(() => {
    updateImageSrc();
    if (props.framesCount > 1) {
        imageInterval.value =
            typeof window !== "undefined"
                ? window.setInterval(updateImageSrc, props.frameSpeed)
                : null;
    }
});
onBeforeUnmount(() => {
    if (imageInterval.value) {
        clearInterval(imageInterval.value);
        imageInterval.value = null;
    }
});
</script>

<template>
    <div class="flex flex-col items-center justify-center p-4">
        <div
            v-if="!imageError"
            class="w-32 flex items-center justify-center mb-4 opacity-20 dark:invert"
        >
            <img
                :src="currentImageSrc"
                alt="Loading"
                class="max-w-full max-h-full object-contain"
                @error="handleImageError"
            />
        </div>
    </div>
</template>
