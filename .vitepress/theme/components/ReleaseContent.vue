<script setup lang="ts">
import MarkdownIt from "markdown-it";
import { computed } from "vue";
import type { ReleaseItem } from "../../../_data/releases";
import { useI18n } from "../composables/useI18n";
import { replaceIssuesAndMentions } from "../util";

import ReleaseFiles from "./ReleaseFiles.vue";
import ReleaseHeader from "./ReleaseHeader.vue";

const { tr } = useI18n();

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
}>();

const parsedChangelog = computed(() => {
    if (!props.selectedRelease?.changelog) return "";
    const withGitHubLinks = replaceIssuesAndMentions(props.selectedRelease.changelog);
    return md.render(withGitHubLinks);
});

const handleSelectRelease = (release: ReleaseItem) => {
    emit("selectRelease", release);
};
</script>

<template>
    <main
        v-if="selectedRelease"
        class="release-content flex-1 col-span-5 lg:col-span-3 pb-2 rounded-lg border border-vp-divider overflow-clip"
    >
        <ReleaseHeader
            :selected-release="selectedRelease"
            :is-current-version="props.isCurrentVersion"
            @select-release="handleSelectRelease"
        />

        <ReleaseFiles
            :selected-release="selectedRelease"
            :is-current-version="props.isCurrentVersion"
        />

        <div
            v-if="selectedRelease.changelog"
            class="mb-8 px-6 sm:px-10 prose prose-gray dark:prose-invert max-w-none"
        >
            <div
                class="flex flex-row justify-between items-center pb-2 mb-3 border-b border-vp-divider"
            >
                <span
                    class="text-vp-1 text-[13px] font-semibold py-1 leading-6 tracking-wide uppercase"
                    >{{ tr("releases_changelog") }}</span
                >
            </div>
            <div class="prose prose-sm dark:prose-invert text-vp-1 max-w-none">
                <span v-html="parsedChangelog"></span>
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

.dark-blur {
    background-color: color-mix(in srgb, var(--vp-c-bg-elv) 95%, transparent) !important;
    backdrop-filter: blur(10px) !important;
}

.dark .dark-blur {
    background-color: color-mix(in srgb, var(--vp-c-bg-dark) 95%, transparent) !important;
    backdrop-filter: blur(10px) !important;
}

.release-content {
    position: relative;
    background-color: transparent;
    background-image: linear-gradient(
        to bottom,
        color-mix(in srgb, var(--vp-c-bg) 35%, transparent) 0%,
        color-mix(in srgb, var(--vp-c-text-1) 2%, transparent) 100%
    );
    backdrop-filter: blur(10px);
}

.dark .release-content {
    background-image: linear-gradient(
        to bottom,
        color-mix(in srgb, var(--vp-c-text-1) 1%, transparent) 0%,
        color-mix(in srgb, var(--vp-c-bg-soft) 0%, transparent) 100%
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
    color: var(--vp-c-brand-1) !important;
    background-color: color-mix(in srgb, var(--vp-c-brand-1) 10%, transparent) !important;
    padding: 0.2rem 0.2rem !important;
    border-radius: 0.25rem !important;
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
