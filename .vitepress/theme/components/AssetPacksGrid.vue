<script setup lang="ts">
import { useStorage } from "@vueuse/core";
import { motion } from "motion-v";
import { computed, nextTick, ref } from "vue";
import type { AssetPack, FilterOption, SortDirection, SortField } from "../types";
import { STORAGE_KEYS } from "../types";
import { scrollToTop } from "../util";

import { useI18n, useSticky, useThemeSwitcher } from "../composables";
import AssetPacksCard from "./AssetPacksCard.vue";
import AssetPacksControls from "./AssetPacksControls.vue";
import ExtractNotice from "./ExtractNotice.vue";

const { tr } = useI18n();
const { ifCurrentTheme } = useThemeSwitcher();

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
const animationKey = ref(0);
const { isStuck } = useSticky(controlsContainerRef);

const hasUpdates = computed(() => {
    return !!props.assetPacks.find((pack) => pack.hasUpdate);
});

const getStaggeredVariant = (index: number) => {
    return {
        initial: {
            opacity: 0,
            y: 20,
        },
        animate: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.15,
                delay: index * 0.05,
                ease: [0.25, 0.1, 0.25, 1.0],
            },
        },
    };
};

const handleSearch = (query: string) => {
    if (searchQuery.value !== query) {
        animationKey.value++;
        nextTick(() => {
            scrollToTop();
        });
    }
    searchQuery.value = query;
};

const handleSort = (sort: string) => {
    const [field, direction] = sort.split("-");
    const newSortField = (field as SortField) || "updatedDate";
    const newSortDirection = (direction as SortDirection) || "desc";

    if (sortField.value !== newSortField || sortDirection.value !== newSortDirection) {
        animationKey.value++;
        nextTick(() => {
            scrollToTop();
        });
    }

    sortField.value = newSortField;
    sortDirection.value = newSortDirection;
};

const handleFilter = (filter: FilterOption[]) => {
    const filtersChanged =
        activeFilters.value.length !== filter.length ||
        !activeFilters.value.every((f) => filter.includes(f));

    if (filtersChanged) {
        animationKey.value++;
        nextTick(() => {
            scrollToTop();
        });
    }

    activeFilters.value = filter;
};

const resetFilters = () => {
    animationKey.value++;
    searchQuery.value = "";
    sortField.value = "updatedDate";
    sortDirection.value = "desc";
    activeFilters.value = [];
    nextTick(() => {
        scrollToTop();
    });
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

    const filters = activeFilters.value;
    if (filters && !hasUpdates.value) {
        const hasUpdateIndex = filters.indexOf("hasUpdate");
        if (hasUpdateIndex > -1) filters.splice(hasUpdateIndex, 1);
    }

    if (filters && filters.length > 0) {
        results = results.filter((pack) => {
            return filters.some((filterType: FilterOption) => {
                switch (filterType) {
                    case "hasAnims":
                        return (pack.stats?.anims ?? 0) > 0;
                    case "hasIcons":
                        return (pack.stats?.icons ?? 0) > 0;
                    case "hasPassport":
                        return (pack.stats?.passport?.length ?? 0) > 0;
                    case "hasFonts":
                        return (pack.stats?.fonts?.length ?? 0) > 0;
                    case "hasUpdate":
                        return pack?.hasUpdate || false;
                    default:
                        return false;
                }
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
    <div class="relative w-full pb-1 pt-12 md:pt-16 md:pb-8 px-0 items-center justify-center">
        <div v-if="title || description" class="text-center z-[5] pb-10 md:pb-9">
            <h1
                v-if="title"
                class="text-vp-1 text-center font-medium tracking-normal text-[32px] md:text-[40px] leading-8 md:leading-10 md:tracking-tight"
            >
                {{ tr("asset_packs") }}
            </h1>
            <p
                class="text-sm md:text-base italic font-normal text-vp-2 pt-3 leading-5 my-0 mx-auto px-5"
            >
                {{ tr("pack_advert") }}
                <a
                    href="https://github.com/Next-Flip/Asset-Packs"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-vp-brand-1 no-underline hover:underline hover:text-vp-brand-2 font-medium"
                    >Next-Flip/Asset-Packs</a
                >
            </p>
            <ExtractNotice />
        </div>

        <div
            ref="controlsContainerRef"
            class="controls-container w-full mb-5 md:mb-10 justify-center items-center p-0 sticky top-[calc(var(--vp-nav-height)_-_17px)] lg:top-[var(--vp-nav-height)] z-[5] bg-transparent backdrop-filter-none box-shadow-none md:flex py-[10px] px-6 lg:px-[32px] md:margin-y-0 md:margin-x-auto"
            :class="{ 'is-stuck': isStuck }"
        >
            <div class="w-full max-w-[860px] mx-auto">
                <AssetPacksControls
                    :initial-sort-field="sortField"
                    :initial-sort-direction="sortDirection"
                    :initial-filter="activeFilters"
                    :has-updates="hasUpdates"
                    @search="handleSearch"
                    @sort="handleSort"
                    @filter="handleFilter"
                />
            </div>
        </div>

        <div class="max-w-[1200px] mx-auto my-0 px-[24px]">
            <div
                class="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 md:gap-5"
            >
                <motion.div
                    v-for="(pack, index) in filteredAssetPacks"
                    :key="`${pack.id}-${animationKey}`"
                    v-bind="getStaggeredVariant(index)"
                >
                    <AssetPacksCard
                        :id="pack.id"
                        :name="pack.name"
                        :author="pack.author"
                        :description="pack.description"
                        :image-url="pack.imageUrl"
                        :preview-urls="pack.previewUrls"
                        :download-url="pack.downloadUrl"
                        :github-url="pack.githubUrl"
                        :show-time-ago="sortField === 'addedDate' ? 'added' : 'updated'"
                        :updated-timestamp="pack.updatedTimestamp"
                        :added-timestamp="pack.addedTimestamp"
                        :stats="pack.stats"
                        :installed="pack.installed"
                        :has-update="pack.hasUpdate"
                        :tar-file="pack.tarFile"
                    />
                </motion.div>
            </div>
        </div>

        <div v-if="filteredAssetPacks.length === 0" class="text-center text-vp-2 py-12 px-0">
            <p>{{ tr("no_packs_found") }}</p>
            <button
                class="reset-button mt-6 bg-vp-dark/75 p-4 py-2 text-[14px] cursor-pointer transition-colors duration-100 text-vp-neutral rounded-full"
                :class="
                    ifCurrentTheme(['orange'])
                        ? 'hover:text-black'
                        : ifCurrentTheme(['white'])
                          ? 'hover:text-vp-neutral-inverse dark:hover:text-vp-neutral-inverse'
                          : 'hover:text-white'
                "
                @click="resetFilters"
            >
                {{ tr("reset_filters") }}
            </button>
        </div>

        <div
            class="sticky bottom-8 left-0 right-0 w-full lg:flex justify-center items-center z-10 fade-slide-up pt-3 h-12 pointer-events-none"
        >
            <div
                v-if="isStuck"
                class="hidden sticky bottom-5 left-0 right-0 w-full lg:flex justify-end items-center z-10 fade-slide-up px-7 pt-3"
            >
                <button
                    class="bg-vp-divider text-vp-neutral px-4 py-2 rounded-full text-sm font-medium shadow-sm hover:bg-vp-brand-3 transition-colors duration-100 whitespace-nowrap pointer-events-auto"
                    :class="
                        ifCurrentTheme(['white'])
                            ? 'hover:text-vp-neutral-inverse dark:hover:text-vp-neutral-inverse'
                            : 'hover:text-white'
                    "
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
