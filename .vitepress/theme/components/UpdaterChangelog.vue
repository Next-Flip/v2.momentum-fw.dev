<script setup lang="ts">
import { useScroll, useWindowSize } from "@vueuse/core";
import MarkdownIt from "markdown-it";
import { computed, useTemplateRef } from "vue";
import { branchReleases, type ReleaseItem } from "../../../_data/releases";
import { useI18n } from "../composables/useI18n";
import { replaceIssuesAndMentions, supportsSerialPort } from "../util";

import ScrollFade from "./ScrollFade.vue";
import Tooltip from "./Tooltip.vue";

const el = useTemplateRef<HTMLElement>("el");
const { tr, getLocalizedPath } = useI18n();
const { width: windowWidth } = useWindowSize();
const { arrivedState } = useScroll(el);

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
    isLogsOpen?: boolean;
    isNarrowViewport?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
    showUpdateOverlay: false,
    changelogState: "closed",
    uploadedFile: null,
    uploadedFileRelease: null,
    selectedRelease: null,
    isLogsOpen: true,
    isNarrowViewport: false,
});

const emit = defineEmits<{
    "toggle-open-close": [];
    "toggle-expand": [];
}>();

const isExpanded = computed(() => props.changelogState === "expanded");
const isOpen = computed(() => props.changelogState === "open");
const isClosed = computed(() => props.changelogState === "closed");
const isMainline = computed(() => {
    return props.selectedRelease?.version.includes("mntm");
});

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

    return release.version;
});

const isBranchRelease = computed(() => {
    if (!displayRelease.value) return false;
    return branchReleases.some((r) => r.version === displayRelease.value?.version);
});

function getIconContent(branch: string, mainline: string, commit: string): string {
    if (isBranchRelease.value) return branch;
    if (isMainline.value) return mainline;
    return commit;
}

const parsedChangelog = computed(() => {
    if (!displayRelease.value?.changelog) return "";
    const withGitHubLinks = replaceIssuesAndMentions(
        displayRelease.value.changelog,
        isBranchRelease.value,
    );
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
    if (isBranchRelease.value) {
        return `https://github.com/Next-Flip/Momentum-Firmware/pull/${displayRelease.value?.pr}`;
    }
    if (!shouldShowExternalLink.value || !displayRelease.value) return "";
    return getLocalizedPath(`/releases/${displayRelease.value.version}`);
});

const expandDisabled = computed(() => {
    return (
        (!props.uploadedFileRelease && !props.selectedRelease) ||
        isClosed.value ||
        props.showUpdateOverlay ||
        !!hasUploadedFileWithoutChangelog.value
    );
});
</script>

<template>
    <div
        class="changelog-content group mx-3.5 sm:mx-5"
        :class="{
            'max-h-[calc(100vh-var(--vp-nav-height)-24px)]':
                windowWidth < 1024 && !isNarrowViewport,
            'min-h-[300px]': windowWidth < 1024 && isNarrowViewport && !isClosed,
            'h-auto': isClosed,
            'flex flex-col h-full min-h-0': !isClosed,
        }"
    >
        <div
            class="border rounded-lg border-vp-divider bg-vp-dark/75 flex flex-col overflow-hidden relative"
            :class="{
                'changelog-expanded': isExpanded,
                'flex-1 min-h-0': !isClosed,
                'flex-shrink-0': isClosed,
            }"
        >
            <div
                class="flex items-center justify-between min-h-14 flex-shrink-0 px-4 pr-2 sm:pl-4 dropdown-button z-[3]"
                :class="{
                    'is-active': isExpanded,
                    'border-b border-vp-divider bg-vp-dark':
                        ((selectedRelease && !uploadedFile) || uploadedFileRelease) && !isClosed,
                }"
            >
                <div class="flex items-center gap-2">
                    <template v-if="displayVersion">
                        <div
                            class="flex items-center justify-center text-sm text-vp-2/80 rounded-md mt-0.5 mr-px"
                            :aria-label="tr('releases_current_version')"
                        >
                            <v-icon
                                :name="getIconContent('oi-git-branch', 'oi-tag', 'oi-git-commit')"
                                :aria-label="
                                    getIconContent(
                                        tr('updater_branch_label'),
                                        tr('releases_mainline'),
                                        tr('releases_devbuild'),
                                    )
                                "
                                :title="
                                    getIconContent(
                                        tr('updater_branch_label'),
                                        tr('releases_mainline'),
                                        tr('releases_devbuild'),
                                    )
                                "
                                :scale="isBranchRelease ? 0.9 : isMainline ? 0.85 : 1"
                            />
                        </div>
                        <Tooltip
                            :disabled="!shouldShowExternalLink"
                            :delay="0"
                            position="right"
                            :x-padding="isBranchRelease ? 1.5 : 2.5"
                        >
                            <a
                                v-if="shouldShowExternalLink"
                                :href="releaseHref"
                                target="_blank"
                                rel="noopener noreferrer"
                                class="text-sm font-semibold text-vp-1 lowercase font-mono transition-all duration-100 flex items-center justify-center vp-external-link-icon hover:underline mt-px"
                            >
                                {{ displayVersion }}
                            </a>
                            <template #content>
                                <div v-if="isBranchRelease" class="-mb-px">
                                    <v-icon
                                        name="bi-github"
                                        scale="1"
                                        aria-label="GitHub"
                                        title="GitHub"
                                    />
                                </div>
                                <div v-else>
                                    {{ tr("updater_go_to_release") }}
                                </div>
                            </template>
                        </Tooltip>
                        <div
                            class="block h-5 mx-1 w-px bg-vp-divider transition-opacity duration-200"
                        />
                        <span class="text-[13px] font-normal text-vp-2/80 mt-px">
                            {{ tr("updater_changelog") }}
                        </span>
                    </template>
                </div>
                <div v-if="supportsSerialPort()" class="flex items-center gap-1 flex-shrink-0">
                    <Tooltip
                        :delay="0"
                        :z-index="9999"
                        :disabled="!!expandDisabled || !supportsSerialPort()"
                    >
                        <button
                            class="rounded-lg transition-all duration-200 text-vp-3 hover:text-vp-brand-1 flex items-center justify-center flex-shrink-0 p-1.5 icon-button-opacity"
                            :class="{
                                'opacity-0 pointer-events-none': showUpdateOverlay,
                                'opacity-0': windowWidth > 1024,
                                'opacity-100': isAccessible && isExpanded,
                                'group-hover:opacity-100':
                                    isAccessible && (isOpen || isExpanded) && !showUpdateOverlay,
                                'opacity-0 pointer-events-none cursor-not-allowed':
                                    (!uploadedFileRelease && !selectedRelease && !isExpanded) ||
                                    isClosed,
                            }"
                            :disabled="!!expandDisabled"
                            :aria-label="isExpanded ? tr('updater_collapse') : tr('updater_expand')"
                            @click="handleToggleExpand"
                        >
                            <v-icon
                                :name="isExpanded ? 'hi-minus-sm' : 'hi-plus-sm'"
                                scale="1"
                                class="transition-transform duration-200 ease-in-out"
                            />
                        </button>
                        <template #content>{{
                            isExpanded ? tr("updater_collapse") : tr("updater_expand")
                        }}</template>
                    </Tooltip>
                    <button
                        v-if="isAccessible"
                        class="rounded-lg transition-all duration-200 text-vp-3 hover:text-vp-brand-1 flex items-center justify-center flex-shrink-0 p-1.5"
                        :class="{
                            '!hidden pointer-events-none hover:text-vp-3':
                                isExpanded || !isLogsOpen,
                        }"
                        @click="handleToggleOpenClose"
                    >
                        <v-icon
                            :name="'oi-chevron-down'"
                            :aria-label="isClosed ? tr('updater_open') : tr('updater_close')"
                            scale="1"
                            class="transition-all duration-200"
                            :class="{
                                'rotate-180': !isClosed,
                            }"
                        />
                    </button>
                </div>
            </div>

            <ScrollFade
                :show="!arrivedState.top"
                position="top"
                class="mr-4 top-[56px]"
                :opacity="40"
            />
            <ScrollFade :show="!arrivedState.bottom" position="bottom" class="mr-4" :opacity="40" />

            <div
                v-if="isAccessible && !isClosed"
                ref="el"
                class="flex-1 overflow-y-auto relative"
                :class="{
                    'px-8 pb-8': isExpanded,
                    'pt-4 px-4 sm:px-5': isBranchRelease,
                    'px-4 sm:px-6': !isBranchRelease,
                }"
            >
                <div
                    class="prose prose-sm dark:prose-invert max-w-none text-vp-1 mb-5"
                    :class="{ 'prose-branch': isBranchRelease }"
                >
                    <Transition name="changelog-fade" mode="out-in">
                        <div :key="displayVersion" v-html="parsedChangelog"></div>
                    </Transition>
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
.prose-branch :deep(p) {
    margin-top: 0.15rem !important;
    margin-bottom: 0.15rem !important;
}

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
    color: var(--vp-c-brand-1);
    font-weight: 600;
}

.prose :deep(em) {
    color: var(--vp-c-text-2);
    font-style: italic;
}

.prose-branch :deep(code) {
    margin-right: 4px;
}

.prose :deep(code) {
    font-size: 13px;
    color: var(--vp-c-alternate-1);
    background-color: color-mix(in srgb, var(--vp-c-alternate-1) 10%, transparent);
}

.prose :deep(code):before,
.prose :deep(code):after {
    content: "";
}

.changelog-expanded .prose {
    max-width: none !important;
}

.changelog-content {
    position: relative;
    background-color: transparent;
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
