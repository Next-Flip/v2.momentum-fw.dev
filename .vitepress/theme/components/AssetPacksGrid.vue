<script setup lang="ts">
import { useScroll, useStorage, useWindowSize } from "@vueuse/core";
import { motion } from "motion-v";
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useI18n } from "../composables/useI18n";
import { useThemeSwitcher } from "../composables/useThemeSwitcher";
import type { AssetPack, FilterOption, SortDirection, SortField } from "../types";
import { STORAGE_KEYS } from "../types";
import { scrollToTop } from "../util";

import AssetPacksCell from "./AssetPacksCell.vue";
import AssetPacksControls from "./AssetPacksControls.vue";
import ExtractNotice from "./ExtractNotice.vue";

const { tr } = useI18n();
const { currentTheme } = useThemeSwitcher();

interface Props {
    title?: string;
    description?: string;
    assetPacks: AssetPack[];
}

const props = withDefaults(defineProps<Props>(), {
    title: "",
    description: "",
});

const searchQuery = ref("");
const sortField = useStorage<SortField>(STORAGE_KEYS.ASSET_PACK_SORT_FIELD, "updatedDate");
const sortDirection = useStorage<SortDirection>(STORAGE_KEYS.ASSET_PACK_SORT_DIRECTION, "desc");
const activeFilters = useStorage<FilterOption[]>(STORAGE_KEYS.ASSET_PACK_FILTERS, []);

const controlsContainerRef = ref<HTMLElement | null>(null);
const containerRef = ref<HTMLElement | null>(null);
const isStuck = ref(false);

const width = ref(1024);
const scrollY = ref(0);
const prevScrollY = ref(0);
const scrollDirection = ref<"up" | "down">("down");

onMounted(() => {
    if (typeof window !== "undefined") {
        scrollToTop();

        scrollY.value = 0;
        prevScrollY.value = 0;
        scrollDirection.value = "down";
        const { width: windowWidth } = useWindowSize();
        const { y: windowScrollY } = useScroll(window);
        width.value = windowWidth.value;
        scrollY.value = 0;

        const stopWidthWatch = watch(
            () => windowWidth.value,
            (newWidth) => {
                width.value = newWidth;
            },
        );

        const stopScrollWatch = watch(
            () => windowScrollY.value,
            (newScrollY) => {
                scrollY.value = newScrollY;
                updateScrollDirection();
            },
        );

        window.addEventListener("scroll", checkSticky);

        onBeforeUnmount(() => {
            stopWidthWatch();
            stopScrollWatch();
            window.removeEventListener("scroll", checkSticky);
        });
    }
});

const responsiveConfig = computed(() => {
    if (width.value >= 1280) return { itemsPerRow: 4, cellHeight: 345 }; // xl
    if (width.value >= 1024) return { itemsPerRow: 3, cellHeight: 400 }; // lg
    if (width.value >= 768) return { itemsPerRow: 2, cellHeight: 440 }; // md
    return { itemsPerRow: 1, cellHeight: 400 }; // sm
});

const CELL_HEIGHT = computed(() => responsiveConfig.value.cellHeight);
const ITEMS_PER_ROW = computed(() => responsiveConfig.value.itemsPerRow);
const ROW_SPACING = 20;

const rows = computed(() => {
    const result = [];
    const items = filteredAssetPacks.value;
    if (!items) return [];

    const perRow = ITEMS_PER_ROW.value;
    for (let i = 0; i < items.length; i += perRow) {
        result.push(items.slice(i, i + perRow));
    }

    return result;
});

const viewportInfo = computed(() => {
    if (!containerRef.value)
        return {
            containerTop: 0,
            viewportHeight: typeof window !== "undefined" ? window.innerHeight : 0,
        };

    const containerRect = containerRef.value.getBoundingClientRect();
    return {
        containerTop: containerRect.top,
        viewportHeight: typeof window !== "undefined" ? window.innerHeight : 0,
    };
});

const updateScrollDirection = () => {
    const currentScrollY = scrollY.value;
    if (currentScrollY > prevScrollY.value) {
        scrollDirection.value = "down";
    } else if (currentScrollY < prevScrollY.value) {
        scrollDirection.value = "up";
    }
    prevScrollY.value = currentScrollY;
};

const visibleRowIndexes = computed(() => {
    if (!rows.value || rows.value.length === 0) return [];

    const { containerTop, viewportHeight } = viewportInfo.value;
    const rowHeight = CELL_HEIGHT.value + ROW_SPACING;
    const scrollPosition = scrollY.value;
    const containerScrollPos = scrollPosition - containerTop;
    const startIndex = Math.max(0, Math.floor(containerScrollPos / rowHeight));
    const endIndex = Math.min(
        rows.value.length - 1,
        Math.ceil((containerScrollPos + viewportHeight) / rowHeight),
    );

    const indexes = [];
    for (let i = startIndex; i <= endIndex; i++) {
        indexes.push(i);
    }

    return indexes;
});

const getStaggeredVariant = (rowIndex: number, cellIndex: number) => {
    const isScrollingDown = scrollDirection.value === "down";
    const perRow = ITEMS_PER_ROW.value;

    const adjustedCellIndex = isScrollingDown ? cellIndex : perRow - 1 - cellIndex;

    return {
        initial: {
            opacity: 0,
            y: isScrollingDown ? 5 : -5,
            x: isScrollingDown ? -5 : 5,
        },
        animate: {
            opacity: 1,
            y: 0,
            x: 0,
            transition: {
                duration: 0.3,
                delay: 0.02 * rowIndex + 0.025 * adjustedCellIndex,
                ease: [0.25, 0.1, 0.25, 1.0],
            },
        },
    };
};

const handleSearch = (query: string) => {
    scrollDirection.value = "down";
    if (searchQuery.value !== query) {
        nextTick(() => {
            scrollToTop();
        });
    }

    searchQuery.value = query;
};

const handleSort = (sort: string) => {
    scrollDirection.value = "down";
    const [field, direction] = sort.split("-");
    const newSortField = (field as SortField) || "updatedDate";
    const newSortDirection = (direction as SortDirection) || "desc";

    if (sortField.value !== newSortField || sortDirection.value !== newSortDirection) {
        nextTick(() => {
            scrollToTop();
        });
    }

    sortField.value = newSortField;
    sortDirection.value = newSortDirection;
};

const handleFilter = (filter: FilterOption[]) => {
    scrollDirection.value = "down";
    const filtersChanged =
        activeFilters.value.length !== filter.length ||
        !activeFilters.value.every((f) => filter.includes(f));

    if (filtersChanged) {
        nextTick(() => {
            scrollToTop();
        });
    }

    activeFilters.value = filter;
};

const resetFilters = () => {
    scrollDirection.value = "down";
    searchQuery.value = "";
    sortField.value = "updatedDate";
    sortDirection.value = "desc";
    activeFilters.value = [];
    nextTick(() => {
        scrollToTop();
    });
};

const checkSticky = () => {
    if (!controlsContainerRef.value) return;
    const navHeightString = getComputedStyle(document.documentElement)
        .getPropertyValue("--vp-nav-height")
        .trim();
    const navHeight = parseFloat(navHeightString) || 0;
    const rect = controlsContainerRef.value.getBoundingClientRect();
    isStuck.value = rect.top <= navHeight;
};

const filteredAssetPacks = computed(() => {
    let results = props.assetPacks;

    if (searchQuery.value.trim()) {
        const query = searchQuery.value.toLowerCase();
        results = results.filter(
            (pack) =>
                pack.name.toLowerCase().includes(query) ||
                pack.author.toLowerCase().includes(query) ||
                (pack.description && pack.description.toLowerCase().includes(query)),
        );
    }

    const field = sortField.value;
    const direction = sortDirection.value;
    const multiplier = direction === "asc" ? 1 : -1;

    if (activeFilters.value && activeFilters.value.length > 0) {
        results = results.filter((pack) => {
            return activeFilters.value.some((filterType: FilterOption) => {
                let result = false;
                switch (filterType) {
                    case "hasAnims":
                        result = (pack.stats?.anims ?? 0) > 0;
                        break;
                    case "hasIcons":
                        result = (pack.stats?.icons ?? 0) > 0;
                        break;
                    case "hasPassport":
                        result = (pack.stats?.passport?.length ?? 0) > 0;
                        break;
                    case "hasFonts":
                        result = (pack.stats?.fonts?.length ?? 0) > 0;
                        break;
                    default:
                        result = false;
                }
                return result;
            });
        });
    }

    return [...results].sort((a, b) => {
        let valueA, valueB;
        if (field === "updatedDate" || field === "addedDate") {
            valueA = field === "updatedDate" ? a.stats?.updated : a.stats?.added;
            valueB = field === "updatedDate" ? b.stats?.updated : b.stats?.added;
            valueA = valueA === undefined ? 0 : valueA;
            valueB = valueB === undefined ? 0 : valueB;
        } else {
            valueA = (a[field as keyof AssetPack] as string | undefined)?.toLowerCase() || "";
            valueB = (b[field as keyof AssetPack] as string | undefined)?.toLowerCase() || "";
        }

        if (valueA < valueB) return -1 * multiplier;
        if (valueA > valueB) return 1 * multiplier;
        return 0;
    });
});
</script>

<template>
    <div class="relative w-full pb-1 pt-8 lg:pt-16 lg:pb-8 px-0 items-center justify-center">
        <div v-if="title || description" class="text-center z-[5] pb-5 lg:pb-9">
            <h1
                v-if="title"
                class="text-vp-1 text-center font-medium tracking-normal text-[32px] lg:text-[40px] leading-8 lg:leading-10 lg:tracking-tight"
            >
                {{ tr("asset_packs") }}
            </h1>
            <p class="text-sm lg:text-base font-medium text-vp-2 pt-3 leading-5 my-0 mx-auto px-3">
                {{ tr("pack_advert") }}
                <a
                    href="https://github.com/Next-Flip/Asset-Packs"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-vp-brand-1 no-underline hover:underline hover:text-vp-brand-2 vp-external-link-icon"
                    >Next-Flip/Asset-Packs</a
                >
            </p>
            <ExtractNotice />
        </div>

        <div
            ref="controlsContainerRef"
            class="controls-container w-full sm:mb-4 lg:mb-10 justify-center items-center p-0 sticky top-[calc(var(--vp-nav-height)_-_17px)] lg:top-[var(--vp-nav-height)] z-[5] bg-transparent backdrop-filter-none box-shadow-none md:flex pt-2 pb-6 md:py-[10px] px-6 lg:px-[32px] md:margin-y-0 md:margin-x-auto"
            :class="{ 'is-stuck': isStuck }"
        >
            <div class="w-full max-w-[800px] mx-auto">
                <AssetPacksControls
                    :initial-sort-field="sortField"
                    :initial-sort-direction="sortDirection"
                    :initial-filter="activeFilters"
                    @search="handleSearch"
                    @sort="handleSort"
                    @filter="handleFilter"
                />
            </div>
        </div>

        <div ref="containerRef" class="max-w-[1200px] mx-auto my-0 px-[24px]">
            <div
                class="grid-placeholder"
                :style="{
                    height:
                        rows && rows.length
                            ? `${rows.length * (CELL_HEIGHT + ROW_SPACING)}px`
                            : '0px',
                    position: 'relative',
                }"
            >
                <div
                    v-for="index in visibleRowIndexes"
                    :key="index"
                    class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 absolute w-full"
                    :style="{
                        transform: `translateY(${index * (CELL_HEIGHT + ROW_SPACING)}px)`,
                        height: `${CELL_HEIGHT}px`,
                        top: 0,
                        left: 0,
                    }"
                >
                    <motion.div
                        v-for="(pack, cellIndex) in rows[index]"
                        :key="`${pack.id}-${pack.installedSha256 || 'no-sha'}`"
                        class="min-w-0"
                        v-bind="getStaggeredVariant(index, cellIndex)"
                    >
                        <AssetPacksCell
                            :id="pack.id"
                            :name="pack.name"
                            :author="pack.author"
                            :description="pack.description"
                            :image-url="pack.imageUrl"
                            :preview-urls="pack.previewUrls"
                            :download-url="pack.downloadUrl"
                            :github-url="pack.githubUrl"
                            :show-time-ago="sortField === 'addedDate' ? 'added' : 'updated'"
                            :updated-date="pack.updatedDate"
                            :added-date="pack.addedDate"
                            :stats="pack.stats"
                            :installed="pack.installed"
                            :installed-sha256="pack.installedSha256"
                            :has-update="pack.hasUpdate"
                            :tar-file="pack.tarFile"
                        />
                    </motion.div>
                </div>
            </div>
        </div>

        <div v-if="filteredAssetPacks.length === 0" class="text-center text-vp-2 py-12 px-0">
            <p>{{ tr("no_packs_found") }}</p>
            <button
                class="reset-button mt-6 bg-vp-dark/75 p-4 py-2 text-[14px] cursor-pointer transition-colors duration-100 text-vp-neutral rounded-full"
                :class="currentTheme === 'orange' ? 'hover:text-black' : 'hover:text-white'"
                @click="resetFilters"
            >
                {{ tr("reset_filters") }}
            </button>
        </div>

        <div
            class="sticky bottom-5 left-0 right-0 w-full lg:flex justify-end items-center z-10 fade-slide-up px-6 max-w-[1200px] mx-auto pt-3 h-12"
        >
            <div
                v-if="isStuck"
                class="hidden sticky bottom-5 left-0 right-0 w-full lg:flex justify-end items-center z-10 fade-slide-up px-6 max-w-[1200px] mx-auto pt-3"
            >
                <button
                    class="bg-vp-brand-2 text-neutral-100 px-4 py-2 rounded-full text-sm font-medium shadow-lg hover:bg-vp-brand-3 transition-colors duration-100 whitespace-nowrap"
                    @click="scrollToTop('smooth')"
                >
                    {{ tr("return_to_top") }}
                </button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.controls-container.is-stuck {
    background-color: var(--vp-local-nav-bg-color) !important;
    border-bottom: 1px solid var(--vp-c-divider);
}
@media (min-width: 1024px) {
    .controls-container.is-stuck {
        background-color: color-mix(in srgb, var(--vp-c-bg-dark) 98%, transparent) !important;
        backdrop-filter: blur(10px);
    }
}

.reset-button {
    border: 1px solid var(--vp-c-brand-1);
    background-color: color-mix(in srgb, var(--vp-c-bg-dark) 75%, transparent);
    backdrop-filter: blur(1px);
}

.reset-button:hover {
    border-color: var(--vp-c-brand-2);
    background-color: var(--vp-c-brand-3);
}

.fade-slide-up {
    animation: fadeSlideUp 0.3s ease forwards;
}

@keyframes fadeSlideUp {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>
