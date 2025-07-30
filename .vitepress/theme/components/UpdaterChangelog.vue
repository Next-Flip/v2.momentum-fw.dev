<script setup lang="ts">
import { useScroll, useWindowSize } from "@vueuse/core";
import MarkdownIt from "markdown-it";
import { computed, useTemplateRef } from "vue";
import type { ReleaseItem } from "../../../_data/releases";
import { useI18n } from "../composables/useI18n";
import { replaceIssuesAndMentions } from "../util";

import Tooltip from "./Tooltip.vue";

const el = useTemplateRef<HTMLElement>("el");
const { arrivedState } = useScroll(el);
const { tr, getLocalizedPath } = useI18n();
const { width: windowWidth } = useWindowSize();

const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
});

interface Props {
    showUpdateOverlay?: boolean;
    selectedRelease?: ReleaseItem | null;
    uploadedFile?: File | null;
    uploadedFileRelease?: ReleaseItem | null;
    changelogState?: string;
}

const props = withDefaults(defineProps<Props>(), {
    showUpdateOverlay: false,
    changelogState: "closed",
    uploadedFile: null,
    uploadedFileRelease: null,
    selectedRelease: null,
});

const emit = defineEmits<{
    "toggle-open-close": [];
    "toggle-expand": [];
}>();

const isExpanded = computed(() => props.changelogState === "expanded");
const isOpen = computed(() => props.changelogState === "open");
const isClosed = computed(() => props.changelogState === "closed");

const handleToggleOpenClose = () => {
    emit("toggle-open-close");
};

const handleToggleExpand = () => {
    emit("toggle-expand");
};

const hasUploadedFileWithoutChangelog = computed(() => {
    return props.uploadedFile && !props.uploadedFileRelease;
});

const displayRelease = computed(() => {
    if (hasUploadedFileWithoutChangelog.value) {
        return null;
    }
    return props.uploadedFileRelease || props.selectedRelease;
});

const displayVersion = computed(() => {
    if (!displayRelease.value && !hasUploadedFileWithoutChangelog.value) return "";

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
    return displayRelease.value?.changelog;
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
    <div
        class="changelog-content rounded-[10px] group mx-5"
        :class="{
            'max-h-[calc(100vh-var(--vp-nav-height)-24px)]': windowWidth < 1024,
            'h-auto': isClosed,
            'flex flex-col h-full': !isClosed,
        }"
    >
        <div
            class="border rounded-[10px] border-vp-divider bg-vp-elv/95 flex flex-col overflow-hidden relative mb-5"
            :class="{
                'changelog-expanded mt-5': isExpanded,
                'flex-1': !isClosed,
                'flex-shrink-0': isClosed,
            }"
        >
            <div
                class="flex items-center justify-between min-h-14 flex-shrink-0 px-4 pr-2 sm:pl-5 dropdown-button"
                :class="{
                    'is-active': isExpanded,
                    'border-b border-vp-divider':
                        (selectedRelease || uploadedFileRelease) && !isClosed,
                    'bg-vp-dark': selectedRelease || uploadedFileRelease,
                }"
            >
                <div class="flex items-center gap-2">
                    <Tooltip
                        v-if="displayVersion"
                        :disabled="!shouldShowExternalLink"
                        :delay="0"
                        position="right"
                    >
                        <a
                            v-if="shouldShowExternalLink"
                            :href="releaseHref"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="text-sm font-semibold text-vp-1 uppercase font-mono transition-all duration-100 flex items-center justify-center vp-external-link-icon hover:underline mt-px"
                        >
                            {{ displayVersion }}
                        </a>
                        <template #content>
                            {{ tr("updater_go_to_release") }}
                        </template>
                    </Tooltip>
                    <template v-if="displayVersion">
                        <div
                            class="block h-5 mx-1 w-px bg-vp-divider transition-opacity duration-200"
                        />
                        <span class="text-[13px] font-normal text-vp-3 mt-px">
                            {{ tr("updater_changelog") }}
                        </span>
                    </template>
                </div>
                <div class="flex items-center gap-1 flex-shrink-0">
                    <button
                        class="rounded-lg transition-all duration-200 text-vp-3 hover:text-vp-brand-1 flex items-center justify-center flex-shrink-0 p-1.5 icon-button-opacity"
                        :class="{
                            'opacity-0 pointer-events-none': showUpdateOverlay,
                            'opacity-0': windowWidth > 1024,
                            'group-hover:opacity-100':
                                isAccessible && (isOpen || isExpanded) && !showUpdateOverlay,
                        }"
                        @click="handleToggleExpand"
                    >
                        <v-icon
                            :name="isExpanded ? 'hi-minus-sm' : 'hi-plus-sm'"
                            scale="1.0"
                            class="transition-transform duration-200 ease-in-out"
                        />
                    </button>
                    <button
                        class="rounded-lg transition-all duration-200 text-vp-3 hover:text-vp-brand-1 flex items-center justify-center flex-shrink-0 p-1.5"
                        @click="handleToggleOpenClose"
                    >
                        <v-icon
                            :name="'oi-chevron-down'"
                            scale="1"
                            class="transition-all duration-200"
                            :class="{
                                'rotate-180': !isClosed,
                            }"
                        />
                    </button>
                </div>
            </div>

            <div
                class="absolute top-14 left-0 right-0 h-20 bg-gradient-to-b from-vp-elv/95 dark:from-vp-elv/95 to-transparent pointer-events-none z-10 mr-4 opacity-0 transition-opacity duration-300"
                :class="{ 'opacity-100': isAccessible && !arrivedState.top && !isClosed }"
            ></div>
            <div
                class="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-vp-elv/95 dark:from-vp-elv/95 to-transparent pointer-events-none z-10 mr-4 opacity-0 transition-opacity duration-300"
                :class="{ 'opacity-100': isAccessible && !arrivedState.bottom && !isClosed }"
            ></div>

            <div
                v-if="isAccessible && !isClosed"
                ref="el"
                class="flex-1 overflow-y-auto px-4 my-[7px] sm:px-6 mr-[7px] relative transition-all duration-300 ease-in-out"
                :class="{ 'px-8 pb-8': isExpanded }"
            >
                <div class="prose prose-sm dark:prose-invert max-w-none text-vp-1 mb-6">
                    <div class="" v-html="parsedChangelog"></div>
                </div>
            </div>

            <div
                v-else-if="
                    hasUploadedFileWithoutChangelog || (!uploadedFileRelease && !selectedRelease)
                "
                class="flex-1 flex items-center justify-center px-8 pb-14"
            >
                <div class="text-center">
                    <v-icon
                        v-if="hasUploadedFileWithoutChangelog"
                        name="ri-error-warning-line"
                        scale="1.5"
                        class="text-yellow-700 dark:text-yellow-500 bg-yellow-300/20 dark:bg-yellow-900/15 border border-yellow-800/25 rounded-full p-1 mb-2"
                    />
                    <p class="text-vp-2 font-medium mb-1">
                        {{
                            hasUploadedFileWithoutChangelog
                                ? tr("updater_no_changes_found")
                                : tr("updater_no_release_selected")
                        }}
                    </p>
                    <p class="text-vp-3 text-sm max-w-sm mx-auto">
                        {{
                            hasUploadedFileWithoutChangelog
                                ? tr("updater_changelog_unavailable")
                                : tr("updater_no_release_selected_description")
                        }}
                    </p>
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
    /* background-image: linear-gradient(
        to bottom,
        color-mix(in srgb, var(--vp-c-bg) 35%, transparent) 0%,
        color-mix(in srgb, var(--vp-c-text-1) 2%, transparent) 100%
    );
    backdrop-filter: blur(10px);
    backdrop-filter: blur(10px); */
}

.dark .changelog-content {
    background-image: linear-gradient(
        to bottom,
        color-mix(in srgb, var(--vp-c-text-1) 1%, transparent) 0%,
        color-mix(in srgb, var(--vp-c-bg-soft) 0%, transparent) 100%
    );
}

.rotate-180 {
    transform: rotate(180deg);
}

.icon-button-opacity {
    transition: opacity 150ms ease-out !important;
}
</style>
