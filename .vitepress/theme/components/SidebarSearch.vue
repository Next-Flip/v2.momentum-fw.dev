<script setup lang="ts">
import { useRouter } from "vitepress";
import { computed, onMounted } from "vue";

const router = useRouter();

const isWiki = computed(() => {
    return router.route.path.includes("/wiki");
});

let searchAction: (() => void) | null = null;

onMounted(() => {
    const searchButton = document.querySelector(".VPNavBarSearch .DocSearch-Button");
    if (searchButton) {
        searchAction = () => {
            (searchButton as HTMLElement).click();
        };
    }
});

function openSearch() {
    if (searchAction) {
        searchAction();
    } else {
        const event = new KeyboardEvent("keydown", {
            key: "k",
            metaKey: true,
            ctrlKey: true,
            bubbles: true,
        });
        document.dispatchEvent(event);
    }
}
</script>

<template>
    <div v-if="isWiki" class="VPSidebarSearch">
        <div class="search-button-wrapper">
            <button
                type="button"
                class="DocSearch DocSearch-Button"
                aria-label="Search"
                @click="openSearch"
            >
                <span class="DocSearch-Button-Container">
                    <svg width="20" height="20" class="DocSearch-Search-Icon" viewBox="0 0 20 20">
                        <path
                            d="m19 19-3.5-3.5m0-6.5a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"
                            stroke="currentColor"
                            fill="none"
                            fill-rule="evenodd"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="1.5"
                        />
                    </svg>
                    <span class="DocSearch-Button-Placeholder">Search</span>
                </span>
                <div class="DocSearch-Button">
                    <span class="DocSearch-Button-Keys"
                        ><kbd class="DocSearch-Button-Key"></kbd
                        ><kbd class="DocSearch-Button-Key">K</kbd></span
                    >
                </div>
            </button>
        </div>
    </div>
</template>

<style scoped>
.VPSidebarSearch {
    padding: 14px 0 10px 0;
}

.search-button-wrapper {
    display: flex;
    justify-content: center;
}

.DocSearch.DocSearch-Button {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    height: 40px;
    background: var(--vp-c-bg-alt);
    margin-left: 0 !important;
    border: 1px solid transparent;
    border-radius: 8px;
    padding: 0 10px;
    font-size: 13px;
    color: var(--vp-c-text-2);
    cursor: pointer;
    transition:
        border-color 0.25s,
        color 0.25s;
}

.DocSearch.DocSearch-Button:hover {
    border-color: var(--vp-c-brand-1);
    color: var(--vp-c-text-1);
}

.DocSearch-Button-Container {
    display: flex;
    align-items: center;
}

.DocSearch-Search-Icon {
    width: 16px;
    height: 16px;
    color: var(--vp-c-text-3);
}

.DocSearch-Button-Placeholder {
    font-size: 13px;
    flex: 1;
    text-align: left;
}

.DocSearch-Button {
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 0;
    margin-left: 16px;
    padding: 0;
    width: min-content;
    height: min-content;
    background: transparent;
}

.DocSearch-Button * {
    pointer-events: none;
}
</style>
