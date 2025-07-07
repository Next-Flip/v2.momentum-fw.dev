<script setup lang="ts">
import { useScroll, useWindowSize } from '@vueuse/core';
import MarkdownIt from "markdown-it";
import { computed, useTemplateRef } from "vue";
import type { ReleaseItem } from "../../../_data/releases";
import { useI18n } from "../composables/useI18n";
import { replaceIssuesAndMentions } from "../util";

import Tooltip from "./Tooltip.vue";

const el = useTemplateRef<HTMLElement>('el')
const { arrivedState } = useScroll(el)
const { tr, getLocalizedPath } = useI18n();
const { width: windowWidth } = useWindowSize();

const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
});

interface Props {
    selectedRelease: ReleaseItem | null;
    previewRelease?: ReleaseItem | null;
    isPreviewMode?: boolean;
    uploadedFile?: File | null;
    uploadedFileRelease?: ReleaseItem | null;
    isExpanded?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
    isExpanded: false,
});

const emit = defineEmits<{
    toggle: [];
}>();

const handleToggle = () => {
    emit("toggle");
};

const isPreviewMode = computed(() => {
    return props.isPreviewMode || false;
});

const hasUploadedFileWithoutChangelog = computed(() => {
    return props.uploadedFile && !props.uploadedFileRelease;
});

const displayRelease = computed(() => {
    if (hasUploadedFileWithoutChangelog.value) {
        return null;
    }
    return props.uploadedFileRelease || props.selectedRelease || props.previewRelease;
});

const displayVersion = computed(() => {
    if (!displayRelease.value && !hasUploadedFileWithoutChangelog.value) return "";
    if (isPreviewMode.value) return "";

    const release = props.uploadedFileRelease || displayRelease.value;
    if (!release) return "";

    const version = release.version;
    const commit = release.commit.substring(0, 7);

    if (version && version.startsWith("mntm-")) {
        return version;
    }

    return commit;
});

const parsedChangelog = computed(() => {
    if (!displayRelease.value?.changelog) return "";
    const withGitHubLinks = replaceIssuesAndMentions(displayRelease.value.changelog);
    return md.render(withGitHubLinks);
});

const isAccessible = computed(() => {
    if (hasUploadedFileWithoutChangelog.value) {
        return false;
    }
    return !isPreviewMode.value && displayRelease.value?.changelog;
});

const shouldShowExternalLink = computed(() => {
    return props.uploadedFileRelease || props.selectedRelease;
});

const releaseHref = computed(() => {
    if (!shouldShowExternalLink.value || !displayRelease.value?.commit) return "";
    return getLocalizedPath(`/releases/${displayRelease.value.commit}`);
});

</script>

<template>
    <div class="flex flex-col h-full changelog-content rounded-lg" :class="{
        'changelog-content-warning': hasUploadedFileWithoutChangelog,
        'max-h-[calc(100vh-var(--vp-nav-height)-24px)]': windowWidth < 1024,
    }">
        <div class="border border-vp-divider rounded-lg flex-1 flex flex-col overflow-hidden relative" :class="{
            'changelog-expanded': isExpanded
        }">
            <div v-if="!hasUploadedFileWithoutChangelog && (uploadedFileRelease || selectedRelease)"
                class="flex items-center justify-between min-h-14 flex-shrink-0 px-4 sm:pl-5 bg-vp-dark/60 backdrop-blur-md dropdown-button"
                :class="{
                    'border-b border-vp-divider': isAccessible,
                    'is-active': isExpanded,
                }">
                <div class="flex items-center gap-4">
                    <div v-if="displayVersion" class="flex items-center gap-0">
                        <span class="text-sm font-semibold text-vp-1 uppercase font-mono">{{ displayVersion }}</span>
                        <Tooltip :delay="0" :zIndex="9999">
                            <a v-if="shouldShowExternalLink" :href="releaseHref" target="_blank"
                                rel="noopener noreferrer"
                                class="rounded-lg transition-all duration-200 text-vp-3 hover:text-vp-2 flex items-center justify-center flex-shrink-0 p-1.5">
                                <v-icon name="pr-arrow-up-right" scale="1.0" />
                            </a>
                            <template #content>
                                {{ tr("releases_view_release_page") }}
                            </template>
                        </Tooltip>
                    </div>
                </div>
                <div class="flex items-center gap-2 flex-shrink-0">
                    <button v-if="isAccessible" @click="handleToggle"
                        class="rounded-lg transition-all duration-200 text-vp-3 hover:text-vp-brand-1 flex items-center justify-center flex-shrink-0 p-1.5">
                        <div class="flex flex-col items-center gap-1">
                            <v-icon name="oi-chevron-up" scale="0.90"
                                class="-mb-1 transition-transform duration-300 ease-in-out chevron-flip"
                                :class="{ 'flipped': isExpanded }" />
                            <v-icon name="oi-chevron-down" scale="0.90"
                                class="-mt-1 transition-transform duration-300 ease-in-out chevron-flip"
                                :class="{ 'flipped': isExpanded }" />
                        </div>
                    </button>
                </div>
            </div>
            <div v-if="isAccessible && !arrivedState.bottom && !isExpanded"
                class="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-vp-dark to-transparent pointer-events-none z-10">
            </div>
            <div v-if="isAccessible && arrivedState.bottom && !isExpanded"
                class="absolute top-14 left-0 right-0 h-20 bg-gradient-to-b from-vp-dark to-transparent pointer-events-none z-10">
            </div>
            <div v-if="isAccessible" class="flex-1 overflow-y-auto px-4 my-1 sm:px-6 mr-1 relative"
                :class="{ 'px-8 pb-8': isExpanded }" ref="el">
                <div class="prose prose-sm dark:prose-invert max-w-none text-vp-1 mb-6">
                    <div v-html="parsedChangelog" class=""></div>
                </div>
            </div>

            <div v-else-if="hasUploadedFileWithoutChangelog || (!uploadedFileRelease && !selectedRelease)"
                class="flex-1 flex items-center justify-center p-8">
                <div class="text-center">
                    <v-icon v-if="hasUploadedFileWithoutChangelog" name="ri-error-warning-line" scale="1.5"
                        class="text-yellow-700 dark:text-yellow-500 bg-yellow-300/20 dark:bg-yellow-900/15 border border-yellow-800/25 rounded-full p-1 mb-2" />
                    <p class="text-vp-2 font-medium mb-1">{{ hasUploadedFileWithoutChangelog ?
                        tr("updater_no_changes_found") :
                        tr("updater_no_release_selected") }}</p>
                    <p class="text-vp-3 text-sm max-w-sm mx-auto">{{ hasUploadedFileWithoutChangelog ?
                        tr("updater_changelog_unavailable") : tr("updater_no_release_selected_description") }}</p>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.prose :deep(h1),
.prose :deep(h2),
.prose :deep(h3),
.prose :deep(h4),
.prose :deep(h5),
.prose :deep(h6) {
    color: var(--vp-c-text-1);
    margin-top: 1.5rem;
    margin-bottom: 0.5rem;
}

.prose :deep(h1) {
    font-size: 1.25rem;
    font-weight: 600;
}

.prose :deep(h2) {
    font-size: 1.125rem;
    font-weight: 600;
}

.prose :deep(h3) {
    font-size: 1rem;
    font-weight: 600;
}

.prose :deep(ul),
.prose :deep(ol) {
    margin-top: 0.5rem;
    margin-bottom: 1rem;
    padding-left: 1.25rem;
}

.prose :deep(li) {
    margin-top: 0.25rem;
    margin-bottom: 0.25rem;
    color: var(--vp-c-text-1);
}

.prose :deep(p) {
    margin-top: 0.5rem;
    margin-bottom: 0.5rem;
    color: var(--vp-c-text-1);
}

.prose :deep(code) {
    color: var(--vp-c-brand-1);
    background-color: color-mix(in srgb, var(--vp-c-brand-1) 10%, transparent);
    padding: 0.125rem 0.25rem;
    border-radius: 0.25rem;
    font-size: 0.875rem;
}

.prose :deep(a) {
    color: var(--vp-c-brand-1);
    text-decoration: none;
    font-weight: 500;
}

.prose :deep(a:hover) {
    color: var(--vp-c-brand-2);
    text-decoration: underline;
}

.prose :deep(strong) {
    color: var(--vp-c-text-1);
    font-weight: 600;
}

.prose :deep(em) {
    color: var(--vp-c-text-2);
    font-style: italic;
}

.changelog-expanded .prose {
    max-width: none !important;
}

.changelog-content {
    position: relative;
    background-color: transparent;
    background-image: linear-gradient(to bottom,
            color-mix(in srgb, var(--vp-c-bg) 35%, transparent) 0%,
            color-mix(in srgb, var(--vp-c-brand-1) 2%, transparent) 100%);
    backdrop-filter: blur(10px);
}

.dark .changelog-content {
    background-image: linear-gradient(to bottom,
            color-mix(in srgb, var(--vp-c-brand-1) 1%, transparent) 0%,
            color-mix(in srgb, var(--vp-c-bg-soft) 0%, transparent) 100%);
}

/* 
.dark .changelog-content-warning {
    background-image: linear-gradient(to bottom,
            color-mix(in srgb, var(--vp-c-warning-1) 2%, transparent) 0%,
            color-mix(in srgb, var(--vp-c-bg-soft) 0%, transparent) 100%);
} */

.chevron-flip.flipped {
    transform: scaleY(-1);
}
</style>