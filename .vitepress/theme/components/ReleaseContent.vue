<script setup lang="ts">
import MarkdownIt from "markdown-it";
import { computed } from "vue";
import type { ReleaseItem } from "../../../_data/releases";
import { useI18n } from "../composables/useI18n";
import { scrollToTop } from "../util";

import ReleaseFiles from "./ReleaseFiles.vue";

const { tr } = useI18n();

const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
});

interface Props {
    selectedRelease: ReleaseItem | null;
}

const props = defineProps<Props>();

const replaceIssuesAndMentions = (text: string): string => {
    const a = (href: string, className: string, content: string) =>
        `<a href="${href}" target="_blank" rel="noopener noreferrer" class="${className} font-bold transition-colors duration-200">${content}</a>`;

    let result = text.replace(/(?<![a-zA-Z])@([a-zA-Z0-9_-]+)/g, (_, username) =>
        a(
            `https://github.com/${username}`,
            "text-vp-brand-1 hover:text-vp-brand-2",
            `@${username}`,
        ),
    );

    result = result.replace(/#(\d+)/g, (_, issueNumber) =>
        a(
            `https://github.com/Next-Flip/Momentum-Firmware/issues/${issueNumber}`,
            "text-mntm-yellow-1 hover:text-mntm-yellow-2",
            `#${issueNumber}`,
        ),
    );

    return result;
};

const parsedChangelog = computed(() => {
    if (!props.selectedRelease?.changelog) return "";
    const withGitHubLinks = replaceIssuesAndMentions(props.selectedRelease.changelog);
    return md.render(withGitHubLinks);
});
</script>

<template>
    <main
        class="release-content flex-1 col-span-5 lg:col-span-3 pb-2 border-r border-l border-dashed border-vp-divider"
    >
        <div
            v-if="selectedRelease"
            class="prose prose-gray dark:prose-invert max-w-none px-0 sm:px-6"
        >
            <div
                class="flex flex-col sticky top-[47px] sm:top-11 lg:top-[61px] pt-0 sm:pt-9 pb-11 z-[2]"
            >
                <div
                    class="dark-blur flex flex-row justify-between items-center border-b border-dashed sm:border-solid sm:border sm:rounded-lg border-vp-divider px-2 py-2 cursor-pointer sm:hover:scale-[1.01] transition-all duration-200 sm:shadow-sm"
                    @click="scrollToTop('smooth')"
                >
                    <div class="flex flex-row ml-1.5 items-center gap-2">
                        <span
                            class="text-lg leading-none font-semibold text-vp-1 uppercase font-mono"
                        >
                            {{
                                selectedRelease.version ||
                                `${selectedRelease.commit.substring(0, 8)}`
                            }}
                        </span>
                    </div>
                    <div
                        class="flex items-center gap-4 text-sm text-vp-brand-1 rounded-full release-date px-2.5 py-1 border border-vp-1/5"
                    >
                        <span>{{ selectedRelease.date }}</span>
                    </div>
                </div>
            </div>

            <ReleaseFiles :selected-release="selectedRelease" />

            <div v-if="selectedRelease.changelog" class="mb-8 px-4 sm:px-4">
                <div
                    class="flex flex-row justify-between items-center pb-2 mb-3 border-b border-vp-divider"
                >
                    <span class="text-vp-1 text-base font-medium py-1 leading-6 tracking-wide">{{
                        tr("releases_changelog")
                    }}</span>
                </div>
                <div
                    class="prose prose-sm dark:prose-invert text-vp-1 max-w-none"
                    v-html="parsedChangelog"
                ></div>
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
        color-mix(in srgb, var(--vp-c-brand-1) 2%, transparent) 100%
    );
}

.dark .release-content {
    background-image: linear-gradient(
        to top,
        color-mix(in srgb, var(--vp-c-brand-1) 1%, transparent) 0%,
        /* color-mix(in srgb, var(--vp-c-bg-soft) 20%, transparent) 0%, */
            color-mix(in srgb, var(--vp-c-bg-soft) 0%, transparent) 100%
    );
}

.release-date {
    background-color: var(--vp-c-brand-soft);
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
