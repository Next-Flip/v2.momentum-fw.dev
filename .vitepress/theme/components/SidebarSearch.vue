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
                    <span class="DocSearch-Button-Placeholder">Search</span>
                </span>
                <div class="DocSearch-Button">
                    <kbd
                        class="bg-vp-soft-mute border border-vp-divider rounded px-1.5 py-1 text-[11px] leading-none text-vp-2 font-mono font-medium"
                        >/</kbd
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
    background: color-mix(in srgb, var(--vp-c-bg-dark) 55%, transparent);
    border: 1px solid var(--vp-c-divider);
    margin-left: 0 !important;
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
