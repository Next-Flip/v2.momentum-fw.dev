<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";

const htmlClasses = ref("");
const currentThemeColor = computed(() => {
    const themeMatch = htmlClasses.value.match(/theme-(\w+)/);
    return themeMatch?.[1] || "purp";
});

const heroImageSrc = computed(() => {
    const themeColor = currentThemeColor.value;
    const isDark = htmlClasses.value.includes("dark");

    if (themeColor === "pink") {
        return `/banners/logo_${isDark ? "dark" : "light"}_pink.png`;
    } else if (themeColor === "white") {
        return `/banners/logo_${isDark ? "dark" : "light"}_white.png`;
    } else {
        return `/banners/logo_${isDark ? "dark" : "light"}.png`;
    }
});

let observer: globalThis.MutationObserver | null = null;

onMounted(() => {
    htmlClasses.value = document.documentElement.className;
    observer = new (
        window as unknown as { MutationObserver: typeof globalThis.MutationObserver }
    ).MutationObserver(() => {
        htmlClasses.value = document.documentElement.className;
    });

    if (observer) {
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["class"],
        });
    }
});

onUnmounted(() => {
    if (observer) {
        observer.disconnect();
    }
});
</script>

<template>
    <div class="hero-image-container mr-4 select-none">
        <img :src="heroImageSrc" alt="Momentum Firmware" class="hero-image" />
    </div>
</template>

<style scoped>
.hero-image-container {
    display: flex;
    justify-content: center;
    align-items: center;
}

.hero-image {
    width: 100%;
    max-height: 200px;
    object-fit: contain;
    transition: opacity 0.3s ease-in-out;
}
</style>
