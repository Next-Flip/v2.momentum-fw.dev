<script setup lang="ts">
import { useScroll, useWindowSize } from "@vueuse/core";
import { computed, nextTick, ref } from "vue";
import type { ReleaseItem } from "../../../_data/releases";
import { devbuildReleases, mainlineReleases } from "../../../_data/releases";
import { useClickOutside } from "../composables/useClickOutside";
import { useI18n } from "../composables/useI18n";
import { useSticky } from "../composables/useSticky";
import { useThemeSwitcher } from "../composables/useThemeSwitcher";
import { formatDate, formatTimestamp } from "../date";
import { scrollToTop } from "../util";

import ScrollFade from "./ScrollFade.vue";
import Tooltip from "./Tooltip.vue";

const { tr } = useI18n();
const { width } = useWindowSize();
const { ifCurrentTheme } = useThemeSwitcher();

interface Props {
    selectedRelease: ReleaseItem | null;
    isCurrentVersion: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
    selectRelease: [release: ReleaseItem];
    toggleContentFade: [contentFade: boolean];
}>();

const dropdownRef = ref<HTMLElement | null>(null);
const dropdownMenuRef = ref<HTMLElement | null>(null);
const headerRef = ref<HTMLElement | null>(null);
const isDropdownOpen = ref(false);
const { isStuck } = useSticky(headerRef);
const { arrivedState } = useScroll(dropdownMenuRef);

useClickOutside({
    element: dropdownRef,
    callback: () => {
        isDropdownOpen.value = false;
        emit("toggleContentFade", false);
    },
});

const renderReleaseSection = (title: string, releases: ReleaseItem[]) => {
    return { title, releases };
};

const releaseSections = computed(() => [
    renderReleaseSection(tr("releases_mainline"), mainlineReleases),
    renderReleaseSection(tr("releases_devbuilds"), devbuildReleases),
]);

const toggleDropdown = async () => {
    isDropdownOpen.value = !isDropdownOpen.value;
    emit("toggleContentFade", isDropdownOpen.value);

    if (isDropdownOpen.value && props.selectedRelease) {
        await nextTick();
        scrollToSelectedRelease();
    }
};

const scrollToSelectedRelease = () => {
    if (!dropdownMenuRef.value || !props.selectedRelease) return;
    const selectedElement = dropdownMenuRef.value.querySelector(".dropdown-item.is-selected");

    if (selectedElement) {
        const container = dropdownMenuRef.value;
        const containerHeight = container.clientHeight;
        const elementTop = (selectedElement as HTMLElement).offsetTop;
        const elementHeight = (selectedElement as HTMLElement).offsetHeight;
        const scrollTop = elementTop - containerHeight / 2 + elementHeight / 2;
        container.scrollTop = Math.max(0, scrollTop);
    }
};

const selectRelease = (release: ReleaseItem) => {
    emit("selectRelease", release);
    isDropdownOpen.value = false;
    emit("toggleContentFade", false);
};

const isMainline = computed(() => {
    return props.selectedRelease?.version.includes("mntm");
});

const isSelected = (release: ReleaseItem) => {
    return props.selectedRelease?.version === release.version;
};

const handleHeaderClick = () => {
    if (width.value < 1024) {
        toggleDropdown();
    } else if (isStuck.value) {
        scrollToTop("smooth");
    }
};
</script>

<template>
    <div
        ref="headerRef"
        class="flex flex-col pt-0 z-[2] sticky top-[47px] sm:top-11 lg:top-[64px] bg-vp-dark lg:bg-vp-dark/85 lg:backdrop-blur-md rounded-t-[10px] border-b border-vp-divider"
    >
        <div ref="dropdownRef" class="relative">
            <div
                class="flex flex-row justify-between items-center overflow-hidden px-3 py-2 transition-all duration-200 sm:shadow-sm z-[1000] min-h-14"
                :class="{
                    'lg:cursor-pointer': isStuck,
                    'sm:rounded-tl-lg sm:rounded-tr-lg': isDropdownOpen,
                }"
                @click="handleHeaderClick"
            >
                <div class="flex flex-row items-center gap-1">
                    <div
                        class="flex items-center justify-center text-sm text-vp-2/80 rounded-md w-7 mt-px"
                        :aria-label="tr('releases_current_version')"
                    >
                        <v-icon
                            :name="isMainline ? 'oi-tag' : 'oi-git-commit'"
                            :aria-label="
                                isMainline ? tr('releases_mainline') : tr('releases_devbuild')
                            "
                            :title="isMainline ? tr('releases_mainline') : tr('releases_devbuild')"
                            :scale="isMainline ? 0.85 : 1"
                        />
                    </div>
                    <span
                        class="text-base leading-none font-semibold text-vp-1 lowercase font-mono"
                    >
                        {{ selectedRelease?.version }}
                    </span>
                    <div
                        class="lg:hidden flex items-center text-vp-3 transition-transform duration-200"
                        :class="{ 'rotate-180': isDropdownOpen }"
                    >
                        <v-icon name="oi-chevron-down" scale="0.85" />
                    </div>
                </div>
                <div class="flex flex-row items-center gap-2">
                    <Tooltip
                        v-if="props.isCurrentVersion"
                        :delay="0"
                        :offset="8"
                        :position="'left'"
                        :max-width="'320px'"
                        :z-index="9999"
                    >
                        <div
                            class="flex items-center text-sm rounded-full bg-vp-alternate-1/5 dark:bg-vp-alternate-1/10 p-0.5 border border-vp-alternate-1/20 hover:border-vp-alternate-1/40 transition-all duration-100 cursor-help"
                            :class="[
                                ifCurrentTheme(['white'])
                                    ? 'text-vp-brand-1 dark:text-vp-brand-1/60'
                                    : 'text-vp-alternate-1 dark:text-vp-alternate-1',
                            ]"
                            :aria-label="tr('releases_current_version')"
                        >
                            <v-icon name="oi-check" scale="0.75" />
                        </div>
                        <template #content>{{ tr("releases_current_version") }}</template>
                    </Tooltip>
                    <Tooltip
                        v-if="selectedRelease?.timestamp"
                        position="left"
                        :delay="0"
                        :offset="8"
                    >
                        <div
                            class="flex items-center gap-4 text-sm text-vp-1/80 rounded-md bg-vp-neutral/[1%] hover:bg-vp-neutral/[2%] hover:border-vp-divider/90 px-2.5 py-1 border border-vp-divider/70 backdrop-blur-sm cursor-help tracking-wider transition-all duration-100"
                        >
                            <span>{{ formatDate(selectedRelease?.date || "", "fullYear") }}</span>
                        </div>
                        <template #content>
                            {{ formatTimestamp(selectedRelease.timestamp.toString()) }}
                        </template>
                    </Tooltip>
                    <div
                        v-else
                        class="flex items-center gap-4 text-sm text-vp-1/80 rounded-md bg-vp-neutral/[1%] px-2.5 py-1 border border-vp-divider/70 backdrop-blur-sm"
                    >
                        <span>{{ formatDate(selectedRelease?.timestamp || 0, "fullYear") }}</span>
                    </div>
                </div>
            </div>

            <Transition name="fade-dropdown">
                <div
                    v-if="isDropdownOpen"
                    class="lg:hidden absolute top-full left-0 w-full z-[1000] px-[7px] bg-vp-dark shadow-[var(--vp-shadow-3)] backdrop-blur-md border-b border-vp-divider"
                >
                    <div
                        class="bg-transparent transition-all duration-200 overflow-hidden max-h-[276px] flex flex-col w-full min-w-full"
                        :class="{ 'is-visible': isDropdownOpen }"
                    >
                        <ScrollFade
                            :show="!arrivedState.top"
                            position="top"
                            offset="0"
                            class="mr-4"
                            :opacity="40"
                        />
                        <ScrollFade
                            :show="!arrivedState.bottom"
                            position="bottom"
                            class="mr-4"
                            :opacity="40"
                        />
                        <div
                            ref="dropdownMenuRef"
                            class="flex flex-col overflow-hidden max-h-[300px] transition-all duration-200 overflow-y-auto rounded-[4px] bg-vp-soft-mute pb-[7px] pr-[7px]"
                        >
                            <template
                                v-for="(section, sectionIndex) in releaseSections"
                                :key="section.title"
                            >
                                <div
                                    v-if="section.releases.length > 0"
                                    class="px-3 py-2 mb-[7px] text-xs font-semibold text-vp-2 uppercase tracking-wide border-b border-vp-divider/40"
                                    :class="{ 'mt-4': sectionIndex > 0 }"
                                >
                                    {{ section.title }}
                                </div>
                                <div
                                    v-for="release in section.releases"
                                    :key="`${section.title}-${release.version}`"
                                    class="dropdown-item flex flex-row min-h-8 items-center justify-between px-3 py-2 cursor-pointer transition-colors duration-200 w-full z-[5] text-[13px] overflow-hidden min-w-0 rounded-[4px]"
                                    :class="{
                                        'is-selected': isSelected(release),
                                    }"
                                    @click="selectRelease(release)"
                                >
                                    <span
                                        class="font-medium text-vp-1 text-left overflow-hidden text-ellipsis whitespace-nowrap flex-shrink-0"
                                        :class="{
                                            'text-vp-brand-1': isSelected(release),
                                        }"
                                    >
                                        {{ release.version }}
                                    </span>
                                    <span
                                        class="text-xs text-vp-3 ml-3 flex-shrink-0 font-mono text-right tracking-tighter"
                                        :class="{
                                            'text-vp-brand-1/60': isSelected(release),
                                        }"
                                    >
                                        {{ formatDate(release.timestamp || 0, "fullYear") }}
                                    </span>
                                </div>
                            </template>
                        </div>
                    </div>
                </div>
            </Transition>
        </div>
    </div>
</template>

<style scoped>
.dropdown-menu.is-visible {
    transform: translateY(0);
}

.dropdown-item:hover {
    background-color: color-mix(in srgb, var(--vp-c-text-1) 5%, transparent);
}

.dark .dropdown-item:hover {
    background-color: color-mix(in srgb, var(--vp-c-text-1) 4%, transparent);
}

.dropdown-item.is-selected {
    background-color: color-mix(in srgb, var(--vp-c-brand-1) 10%, transparent);
    /* background-image: linear-gradient(to right, var(--vp-c-brand-soft), transparent); */
    color: var(--vp-c-brand-1);
}

.dropdown-item.is-selected:hover {
    background-color: color-mix(in srgb, var(--vp-c-brand-1) 15%, transparent);
}

.fade-dropdown-enter-active,
.fade-dropdown-leave-active {
    transition: opacity 0.2s ease;
}

.fade-dropdown-enter-from,
.fade-dropdown-leave-to {
    opacity: 0;
}
</style>
