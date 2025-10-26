<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import { useClickOutside, useI18n } from "../composables";
import type { DropdownOption, FilterOption, SortDirection, SortField } from "../types";

import Tooltip from "./Tooltip.vue";

const { tr } = useI18n();

interface Props {
    initialSortField?: SortField;
    initialSortDirection?: SortDirection;
    initialFilter?: FilterOption[];
    initialSearchQuery?: string;
    hasUpdates?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
    initialSortField: "updatedDate",
    initialSortDirection: "desc",
    initialFilter: () => [],
    initialSearchQuery: "",
    hasUpdates: false,
});

const emit = defineEmits<{
    search: [query: string];
    sort: [value: string];
    filter: [filters: FilterOption[]];
}>();

const searchQuery = ref(props.initialSearchQuery);
const sortDropdownRef = ref<HTMLElement | null>(null);
const filterDropdownRef = ref<HTMLElement | null>(null);
const mobileSortDropdownRef = ref<HTMLElement | null>(null);
const mobileFilterDropdownRef = ref<HTMLElement | null>(null);
const isSortDropdownOpen = ref(false);
const isFilterDropdownOpen = ref(false);
const sortField = ref<SortField>(props.initialSortField);
const sortDirection = ref<SortDirection>(props.initialSortDirection);
const activeFilters = ref<FilterOption[]>([...props.initialFilter]);

useClickOutside([
    {
        element: sortDropdownRef,
        callback: () => {
            isSortDropdownOpen.value = false;
        },
    },
    {
        element: filterDropdownRef,
        callback: () => {
            isFilterDropdownOpen.value = false;
        },
    },
    {
        element: mobileSortDropdownRef,
        callback: () => {
            isSortDropdownOpen.value = false;
        },
    },
    {
        element: mobileFilterDropdownRef,
        callback: () => {
            isFilterDropdownOpen.value = false;
        },
    },
]);

const sortOptions = computed<DropdownOption[]>(() => [
    { value: "updatedDate", label: tr("Last Updated") },
    { value: "addedDate", label: tr("Date Added") },
    { value: "name", label: tr("Name") },
    { value: "author", label: tr("Author") },
]);

const filterOptions = computed(() => {
    const options: DropdownOption[] = [
        { value: "hasAnims", label: tr("Anims") },
        { value: "hasIcons", label: tr("Icons") },
        { value: "hasPassport", label: tr("Passports") },
        { value: "hasFonts", label: tr("Fonts") },
    ];
    if (props.hasUpdates) options.push({ value: "hasUpdate", label: tr("Updated") });
    return options;
});

const emitSearch = () => emit("search", searchQuery.value);
const clearSearch = () => {
    searchQuery.value = "";
    emitSearch();
};

const getSortLabel = () => {
    const option = sortOptions.value.find((opt) => opt.value === sortField.value);
    return option ? option.label : tr("Sort_By");
};

const toggleSortDropdown = (event?: Event) => {
    if (event) {
        event.stopPropagation();
    }
    if (isSortDropdownOpen.value) {
        isSortDropdownOpen.value = false;
    } else {
        isFilterDropdownOpen.value = false;
        nextTick(() => {
            isSortDropdownOpen.value = true;
        });
    }
};

const emitSortChange = () => {
    const sortValue = `${sortField.value}-${sortDirection.value}`;
    emit("sort", sortValue);
};

const selectSortOption = (value: SortField) => {
    sortField.value = value;
    emitSortChange();
    isSortDropdownOpen.value = false;
};

const toggleSortDirection = () => {
    sortDirection.value = sortDirection.value === "asc" ? "desc" : "asc";
    emitSortChange();
};

const getFilterLabel = () => {
    if (activeFilters.value.length === 0) return tr("none");
    if (activeFilters.value.length === 1) {
        const option = filterOptions.value.find((opt) => opt.value === activeFilters.value[0]);
        return option ? option.label : tr("Filter");
    }

    const selectedLabels = filterOptions.value
        .filter((option) => activeFilters.value.includes(option.value as FilterOption))
        .map((option) => option.label);

    return selectedLabels.join(", ");
};

const shouldScroll = computed(() => {
    if (activeFilters.value.length <= 2) return false;

    const selectedLabels = filterOptions.value
        .filter((option) => activeFilters.value.includes(option.value as FilterOption))
        .map((option) => option.label);

    const labelText = selectedLabels.join(", ");
    return labelText.length > 10;
});

const toggleFilterDropdown = (event?: Event) => {
    if (event) {
        event.stopPropagation();
    }
    if (isFilterDropdownOpen.value) {
        isFilterDropdownOpen.value = false;
    } else {
        isSortDropdownOpen.value = false;
        nextTick(() => {
            isFilterDropdownOpen.value = true;
        });
    }
};

const toggleFilterOption = (value: FilterOption) => {
    const index = activeFilters.value.indexOf(value);
    const newFilters = [...activeFilters.value];

    if (index === -1) {
        newFilters.push(value);
    } else {
        newFilters.splice(index, 1);
    }

    activeFilters.value = newFilters;
    emit("filter", newFilters);
};

watch(
    () => ({
        search: props.initialSearchQuery,
        sortField: props.initialSortField,
        sortDirection: props.initialSortDirection,
        filter: props.initialFilter,
    }),
    (newValues) => {
        searchQuery.value = newValues.search || "";
        if (newValues.sortField) sortField.value = newValues.sortField;
        if (newValues.sortDirection) sortDirection.value = newValues.sortDirection;
        activeFilters.value = Array.isArray(newValues.filter) ? [...newValues.filter] : [];
    },
    { deep: true },
);
</script>

<template>
    <div class="w-full space-y-2.5 md:space-y-0">
        <div class="flex gap-2.5 sm:items-center">
            <div class="flex-1 sm:flex-auto min-w-0">
                <div class="relative w-full flex items-center backdrop-blur">
                    <div class="absolute left-3 text-vp-3 flex items-center justify-center">
                        <span class="vp-icon DocSearch-Search-Icon"></span>
                    </div>
                    <input
                        v-model="searchQuery"
                        type="text"
                        name="search-input"
                        :placeholder="tr('search_placeholder')"
                        class="search-input w-full py-2 pr-4 pl-9 rounded-lg border bg-[color-mix(in_srgb,var(--vp-c-bg-elv)_95%,transparent)] text-vp-1 text-sm transition-all duration-100 ease-in-out leading-6 min-h-[38px]"
                        :aria-label="tr('search_placeholder')"
                        @input="emitSearch"
                    />
                    <button
                        v-if="searchQuery"
                        class="absolute right-3 bg-vp-soft border-none cursor-pointer text-vp-3 flex items-center justify-center p-[2px] rounded-full transition-all duration-100 hover:text-vp-2"
                        :aria-label="tr('clear_search')"
                        :title="tr('clear_search')"
                        @click="clearSearch"
                    >
                        <v-icon name="md-close-round" scale="0.8" />
                    </button>
                </div>
            </div>

            <Tooltip :position="'top'">
                <button
                    class="sort-direction-toggle w-10 h-10 sm:w-10 sm:h-10 flex-shrink-0 flex items-center justify-center rounded-lg bg-[color-mix(in_srgb,var(--vp-c-bg-elv)_95%,transparent)] transition-all duration-100 hover:border-vp-brand-1 hover:text-vp-2 text-vp-3 cursor-pointer backdrop-blur"
                    :aria-label="sortDirection === 'asc' ? tr('sort_desc') : tr('sort_asc')"
                    @click="toggleSortDirection"
                >
                    <v-icon name="md-sort-round" :class="{ flip: sortDirection === 'desc' }" />
                </button>
                <template #content>
                    {{ sortDirection === "asc" ? tr("sort_desc") : tr("sort_asc") }}
                </template>
            </Tooltip>

            <div class="hidden md:flex gap-2.5 items-center">
                <div
                    ref="sortDropdownRef"
                    class="relative w-full max-w-[195px] min-w-[195px] backdrop-blur"
                >
                    <button
                        class="dropdown-button"
                        :class="{ 'is-active': isSortDropdownOpen }"
                        @click="toggleSortDropdown($event)"
                    >
                        <span class="whitespace-nowrap block z-[5] text-vp-3 mr-2 text-[13px]">{{
                            tr("Sort_By") + ":"
                        }}</span>
                        <span class="whitespace-nowrap overflow-hidden text-ellipsis block z-[5]">{{
                            getSortLabel()
                        }}</span>
                        <div
                            class="select-icon flex items-center text-vp-3 transition-transform duration-200 ml-auto"
                            :class="{ 'rotate-180': isSortDropdownOpen }"
                        >
                            <v-icon name="oi-chevron-down" />
                        </div>
                    </button>

                    <Transition name="fade-dropdown">
                        <div v-if="isSortDropdownOpen" class="dropdown-menu-container">
                            <div
                                class="dropdown-menu"
                                :class="{ 'is-visible': isSortDropdownOpen }"
                            >
                                <div
                                    class="flex flex-col overflow-hidden max-h-[200px] transition-all duration-100 overflow-y-hidden rounded-[4px] bg-vp-soft-mute"
                                >
                                    <span
                                        v-for="option in sortOptions"
                                        :key="option.value"
                                        class="dropdown-item items-center justify-start px-3 py-2 cursor-pointer flex transition-colors duration-100 w-full z-[5] text-[13px] overflow-hidden min-w-0"
                                        :class="{
                                            'is-selected': sortField === option.value,
                                        }"
                                        @click="selectSortOption(option.value as SortField)"
                                    >
                                        <span
                                            class="whitespace-nowrap overflow-hidden text-ellipsis flex-1 select-none"
                                            >{{ option.label }}</span
                                        >
                                    </span>
                                </div>
                            </div>
                        </div>
                    </Transition>
                </div>

                <div
                    ref="filterDropdownRef"
                    class="relative w-full max-w-[195px] min-w-[195px] backdrop-blur"
                >
                    <button
                        class="dropdown-button"
                        :class="{ 'is-active': isFilterDropdownOpen }"
                        @click="toggleFilterDropdown($event)"
                    >
                        <span
                            class="whitespace-nowrap overflow-hidden text-ellipsis block z-[5] text-vp-3 mr-2 text-[13px]"
                            >{{ tr("Filter") + ":" }}</span
                        >
                        <div class="flex-1 overflow-hidden relative w-full">
                            <div
                                v-if="shouldScroll"
                                class="marquee relative w-full overflow-hidden"
                            >
                                <div class="inline-block whitespace-nowrap pr-0 marquee-content">
                                    {{ getFilterLabel() }}
                                </div>
                            </div>
                            <span
                                v-else
                                class="whitespace-nowrap overflow-hidden text-ellipsis block z-[5] w-full text-left"
                            >
                                {{ getFilterLabel() }}
                            </span>
                        </div>
                        <div
                            class="select-icon flex items-center text-vp-3 transition-transform duration-200"
                            :class="{ 'rotate-180': isFilterDropdownOpen }"
                        >
                            <v-icon name="oi-chevron-down" />
                        </div>
                    </button>
                    <Transition name="fade-dropdown">
                        <div
                            v-if="isFilterDropdownOpen"
                            class="dropdown-menu-container"
                            @click.stop
                        >
                            <div
                                class="dropdown-menu"
                                :class="{ 'is-visible': isFilterDropdownOpen }"
                            >
                                <div
                                    class="flex flex-col overflow-hidden max-h-[200px] w-full transition-all duration-100 overflow-y-hidden rounded-[4px] bg-vp-soft-mute"
                                >
                                    <span
                                        v-for="option in filterOptions"
                                        :key="option.value"
                                        class="dropdown-item items-center justify-start gap-2 px-3 py-2 cursor-pointer flex transition-colors duration-100 w-full z-[5] text-[13px] overflow-hidden min-w-0"
                                        :class="{
                                            'is-selected': activeFilters.includes(
                                                option.value as FilterOption,
                                            ),
                                        }"
                                        @click="toggleFilterOption(option.value as FilterOption)"
                                    >
                                        <span
                                            class="inline-flex items-center justify-center w-4 h-4 rounded-[4px] transition-all duration-100 checkbox flex-shrink-0"
                                        >
                                            <v-icon
                                                v-if="
                                                    activeFilters.includes(
                                                        option.value as FilterOption,
                                                    )
                                                "
                                                name="bi-check"
                                                scale="1.1"
                                            />
                                        </span>
                                        <span
                                            class="whitespace-nowrap overflow-hidden text-ellipsis flex-1 select-none"
                                            >{{ option.label }}</span
                                        >
                                    </span>
                                </div>
                            </div>
                        </div>
                    </Transition>
                </div>
            </div>
        </div>

        <div class="flex gap-2.5 md:hidden">
            <div ref="mobileSortDropdownRef" class="relative w-full min-w-0 backdrop-blur">
                <button
                    class="dropdown-button"
                    :class="{ 'is-active': isSortDropdownOpen }"
                    @click="toggleSortDropdown($event)"
                >
                    <span
                        class="whitespace-nowrap z-[5] text-vp-3 mr-2 text-[13px] hidden xs:block"
                        >{{ tr("Sort_By") + ":" }}</span
                    >
                    <span class="whitespace-nowrap overflow-hidden text-ellipsis block z-[5]">{{
                        getSortLabel()
                    }}</span>
                    <div
                        class="select-icon flex items-center text-vp-3 transition-transform duration-200 ml-auto"
                        :class="{ 'rotate-180': isSortDropdownOpen }"
                    >
                        <v-icon name="oi-chevron-down" />
                    </div>
                </button>

                <Transition name="fade-dropdown">
                    <div v-if="isSortDropdownOpen" class="dropdown-menu-container">
                        <div class="dropdown-menu" :class="{ 'is-visible': isSortDropdownOpen }">
                            <div
                                class="flex flex-col overflow-hidden max-h-[200px] transition-all duration-100 overflow-y-hidden rounded-[4px] bg-vp-soft-mute"
                            >
                                <span
                                    v-for="option in sortOptions"
                                    :key="option.value"
                                    class="dropdown-item items-center justify-start px-3 py-2 cursor-pointer flex transition-colors duration-100 w-full z-[5] text-[13px] overflow-hidden min-w-0"
                                    :class="{
                                        'is-selected': sortField === option.value,
                                    }"
                                    @click="selectSortOption(option.value as SortField)"
                                >
                                    <span
                                        class="whitespace-nowrap overflow-hidden text-ellipsis flex-1"
                                        >{{ option.label }}</span
                                    >
                                </span>
                            </div>
                        </div>
                    </div>
                </Transition>
            </div>

            <div ref="mobileFilterDropdownRef" class="relative w-full min-w-0 backdrop-blur">
                <button
                    class="dropdown-button"
                    :class="{ 'is-active': isFilterDropdownOpen }"
                    @click="toggleFilterDropdown"
                >
                    <span
                        class="whitespace-nowrap z-[5] text-vp-3 mr-2 text-[13px] hidden xs:block"
                        >{{ tr("Filter") + ":" }}</span
                    >
                    <div class="flex-1 overflow-hidden relative w-full">
                        <div v-if="shouldScroll" class="marquee relative w-full overflow-hidden">
                            <div class="inline-block whitespace-nowrap pr-0 marquee-content">
                                {{ getFilterLabel() }}
                            </div>
                        </div>
                        <span
                            v-else
                            class="whitespace-nowrap overflow-hidden text-ellipsis block z-[5] w-full text-left"
                        >
                            {{ getFilterLabel() }}
                        </span>
                    </div>
                    <div
                        class="select-icon flex items-center text-vp-3 transition-transform duration-200 ml-auto"
                        :class="{ 'rotate-180': isFilterDropdownOpen }"
                    >
                        <v-icon name="oi-chevron-down" />
                    </div>
                </button>
                <Transition name="fade-dropdown">
                    <!-- eslint-disable-next-line vue/max-attributes-per-line -->
                    <div v-if="isFilterDropdownOpen" class="dropdown-menu-container" @click.stop>
                        <div class="dropdown-menu" :class="{ 'is-visible': isFilterDropdownOpen }">
                            <div
                                class="flex flex-col overflow-hidden max-h-[200px] w-full transition-all duration-100 overflow-y-hidden rounded-[4px] bg-vp-soft-mute"
                            >
                                <span
                                    v-for="option in filterOptions"
                                    :key="option.value"
                                    class="dropdown-item items-center justify-start gap-2 px-3 py-2 cursor-pointer flex transition-colors duration-100 w-full z-[5] text-[13px] overflow-hidden min-w-0"
                                    :class="{
                                        'is-selected': activeFilters.includes(
                                            option.value as FilterOption,
                                        ),
                                    }"
                                    @click="toggleFilterOption(option.value as FilterOption)"
                                >
                                    <span
                                        class="inline-flex items-center justify-center w-4 h-4 rounded-[4px] transition-all duration-100 checkbox flex-shrink-0"
                                    >
                                        <v-icon
                                            v-if="
                                                activeFilters.includes(option.value as FilterOption)
                                            "
                                            name="bi-check"
                                            scale="1.1"
                                        />
                                    </span>
                                    <span
                                        class="whitespace-nowrap overflow-hidden text-ellipsis flex-1"
                                        >{{ option.label }}</span
                                    >
                                </span>
                            </div>
                        </div>
                    </div>
                </Transition>
            </div>
        </div>
    </div>
</template>

<style scoped>
.search-input {
    border: 1px solid var(--vp-c-divider);
}

.dark .search-input {
    background-color: color-mix(in srgb, var(--vp-c-bg-elv) 95%, transparent);
}

.search-input:focus {
    outline: none;
    border: 1px solid var(--vp-c-brand-1);
}

.search-input::placeholder {
    color: var(--vp-c-text-3);
}

.dropdown-button {
    display: flex;
    align-items: center;
    border: 1px solid var(--vp-c-divider);
    justify-content: flex-start;
    width: 100%;
    max-width: 100%;
    min-width: 0;
    background-color: color-mix(in srgb, var(--vp-c-bg-elv) 95%, transparent);
    backface-visibility: hidden;
    border-radius: 8px;
    padding: 8px 10px;
    font-size: 14px;
    color: var(--vp-c-text-1);
    cursor: pointer;
    transition: all 0.1s;
    line-height: 1.6;
    min-height: 38px;
    overflow: hidden;
}

.marquee-content {
    animation: marquee 4s linear infinite alternate;
}

@keyframes marquee {
    0%,
    10% {
        transform: translateX(0);
    }

    90%,
    100% {
        transform: translateX(-33%);
    }
}

.dropdown-button:hover {
    border-color: var(--vp-c-brand-1);
}

.dropdown-button.is-active {
    border-color: var(--vp-c-brand-1);
}

.dropdown-menu-container {
    position: absolute;
    top: calc(100% + 5px);
    left: 0;
    z-index: 1000;
    min-width: 140px;
    width: 100%;
    border: 1px solid var(--vp-c-divider);
    border-radius: 8px;
    padding: 7px;
    background-color: var(--vp-c-bg-dark);
    box-shadow: var(--vp-shadow-3);
    backdrop-filter: blur(12px);
}

.dropdown-menu {
    background-color: transparent;
    transform: translateY(-8px);
    transition: transform 0.2s ease;
    overflow: hidden;
    max-height: 250px;
    display: flex;
    flex-direction: column;
    width: 100%;
    min-width: 100%;
}

.dropdown-menu.is-visible {
    transform: translateY(0);
}

.sort-direction-toggle {
    border: 1px solid var(--vp-c-divider);
}

.sort-direction-toggle:hover {
    border-color: var(--vp-c-brand-1);
}

.sort-direction-toggle :deep(.flip) {
    transform: scaleY(-1);
}

.dropdown-item:hover {
    background-color: color-mix(in srgb, var(--vp-c-text-1) 5%, transparent);
}

.dark .dropdown-item:hover {
    background-color: color-mix(in srgb, var(--vp-c-text-1) 4%, transparent);
}

.dropdown-item.is-selected {
    background-color: color-mix(in srgb, var(--vp-c-brand-1) 10%, transparent);
    color: var(--vp-c-brand-1);
    font-weight: 500;
}

.dropdown-item.is-selected:hover {
    background-color: color-mix(in srgb, var(--vp-c-brand-1) 15%, transparent);
}

.checkbox {
    border: 1px solid var(--vp-c-divider);
}

.dropdown-item.is-selected .checkbox {
    background-color: var(--vp-c-brand-2);
    border-color: var(--vp-c-brand-2);
    color: var(--vp-c-neutral);
}

.theme-purp .dropdown-item.is-selected .checkbox {
    color: white;
}

.theme-pink .dropdown-item.is-selected .checkbox {
    color: white;
    background-color: var(--vp-c-brand-1);
    border-color: var(--vp-c-brand-1);
}

.theme-skyline .dropdown-item.is-selected .checkbox {
    color: #000;
    background-color: var(--vp-c-brand-1);
    border-color: var(--vp-c-brand-1);
}

.theme-orange .dropdown-item.is-selected .checkbox {
    color: #000;
    background-color: var(--vp-c-brand-1);
    border-color: var(--vp-c-brand-1);
}

.theme-white .dropdown-item.is-selected .checkbox {
    color: var(--vp-c-neutral-inverse);
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
