<script setup lang="ts">
import MarkdownIt from "markdown-it";
import { computed, ref } from "vue";
import type { ReleaseItem } from "../../../_data/releases";
import { replaceIssuesAndMentions } from "../util";

import ReleaseFiles from "./ReleaseFiles.vue";
import ReleaseHeader from "./ReleaseHeader.vue";

const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
});

interface Props {
    selectedRelease: ReleaseItem | null;
    isCurrentVersion: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
    selectRelease: [release: ReleaseItem];
    toggleDevFilesOpen: [devFilesOpen: boolean];
}>();

const parsedChangelog = computed(() => {
    if (!props.selectedRelease?.changelog) return "";
    const withGitHubLinks = replaceIssuesAndMentions(props.selectedRelease.changelog);
    return md.render(withGitHubLinks);
});

const devFilesOpen = ref(false);
const dropdownOpen = ref(false);
const contentFade = computed(() => devFilesOpen.value || dropdownOpen.value);

const handleSelectRelease = (release: ReleaseItem) => {
    emit("selectRelease", release);
};

const toggleDevFilesOpen = (open: boolean) => {
    devFilesOpen.value = open;
};

const toggleContentFade = (fade: boolean) => {
    dropdownOpen.value = fade;
};
</script>

<template>
    <main
        v-if="selectedRelease"
        class="relative flex-1 col-span-5 lg:col-span-3 lg:pb-8 rounded-[10px] overflow-clip"
    >
        <div class="border border-vp-divider rounded-[10px] overflow-clip">
            <ReleaseHeader
                :selected-release="selectedRelease"
                :is-current-version="props.isCurrentVersion"
                @select-release="handleSelectRelease"
                @toggle-content-fade="toggleContentFade"
            />

            <div
                v-if="selectedRelease.changelog"
                class="release-content mb-10 px-6 sm:px-8 prose prose-gray dark:prose-invert max-w-full pt-6 opacity-100 transition-opacity duration-200"
                :class="{ 'opacity-30': contentFade }"
            >
                <div class="prose prose-sm dark:prose-invert text-vp-1 max-w-full -mt-6">
                    <span v-html="parsedChangelog"></span>
                </div>
            </div>

            <div class="h-px border-b border-vp-neutral/35 w-auto mx-6 sm:mx-8"></div>

            <div class="max-w-none files-container">
                <ReleaseFiles
                    :selected-release="selectedRelease"
                    :is-current-version="props.isCurrentVersion"
                    :dev-files-open="devFilesOpen"
                    @toggle-dev-files-open="toggleDevFilesOpen"
                />
            </div>
        </div>
    </main>
</template>

<style scoped>
.shadow {
    opacity: 0.15;
}

.dark .shadow {
    opacity: 0.25;
}

.files-container {
    background-image: linear-gradient(
        to top,
        color-mix(in srgb, var(--vp-c-bg-dark) 100%, transparent) 0%,
        /* color-mix(in srgb, var(--vp-c-bg-dark) 98%, transparent) 50%, */
            color-mix(in srgb, var(--vp-c-bg-dark) 97%, transparent) 70%,
        color-mix(in srgb, var(--vp-c-bg-dark) 0%, transparent) 100%
    );
    margin-top: -96px;
}

.release-content {
    position: relative;
    background-color: transparent;
    backdrop-filter: blur(10px);
}

@media (min-width: 1024px) {
    .release-content {
        background-image: linear-gradient(
            to bottom,
            color-mix(in srgb, var(--vp-c-bg-dark) 100%, transparent) 0%,
            color-mix(in srgb, var(--vp-c-text-1) 2%, transparent) 100%
        );
    }
}

@media (min-height: 1024px) {
    @media (min-width: 1024px) {
        .files-container {
            position: sticky;
            bottom: 0;
        }
    }
}

.dark .release-content {
    background-image: linear-gradient(
        to bottom,
        color-mix(in srgb, var(--vp-c-text-1) 1%, transparent) 0%,
        color-mix(in srgb, var(--vp-c-bg-dark) 0%, transparent) 100%
    );
}

.release-date {
    background-color: color-mix(in srgb, var(--vp-c-brand-soft) 80%, transparent);
}

.prose h3 {
    margin-top: 2rem;
    margin-bottom: 1rem;
}

.prose h4 {
    margin-top: 1.5rem;
    margin-bottom: 0.5rem;
}

.prose ul,
.prose ol {
    margin-top: 0.5rem;
    margin-bottom: 1rem;
}

.prose li {
    margin-top: 0.25rem;
    margin-bottom: 0.25rem;
}

.prose :where(h3):not(:where([class~="not-prose"], [class~="not-prose"] *)) {
    color: var(--vp-c-text-1) !important;
}

.prose :where(code):not(:where([class~="not-prose"], [class~="not-prose"] *)) {
    color: var(--vp-c-alternate-1) !important;
    background-color: color-mix(in srgb, var(--vp-c-alternate-1) 10%, transparent) !important;
    padding: 0.2rem 0.2rem !important;
    border-radius: 0.25rem !important;
}

.theme-white .prose :where(code):not(:where([class~="not-prose"], [class~="not-prose"] *)) {
    color: var(--vp-c-brand-1) !important;
}

.shadow {
    opacity: 0.15;
}

.dark .shadow {
    opacity: 0.25;
}

.prose a[href^="https://github.com/"]
{
    color: var(--vp-c-brand-1);
    text-decoration: none;
    font-weight: 500;
    transition: color 0.2s ease;
}

.prose a[href^="https://github.com/"]:hover
{
    color: var(--vp-c-brand-2);
    text-decoration: underline;
}
</style>
