<script setup lang="ts">
import { useTimeAgo } from "@vueuse/core";
import { computed, nextTick, onMounted, ref, watch } from "vue";
import type { ReleaseItem } from "../../../_data/releases";
import { shortenTimeString } from "../util";

interface Props {
    title: string;
    releases: ReleaseItem[];
    selectedRelease: ReleaseItem | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
    selectRelease: [release: ReleaseItem];
}>();

const containerRef = ref<HTMLElement | null>(null);
const linePosition = ref({ top: 0, height: 18, show: false });
const backgroundPosition = ref({ top: 0, height: 0, show: false });
const contentHeight = ref(0);

const selectRelease = (release: ReleaseItem) => {
    emit("selectRelease", release);
};

const isSelected = (release: ReleaseItem) => {
    return props.selectedRelease?.commit === release.commit;
};

const selectedReleaseInThisList = computed(() => {
    return props.releases.find((release) => release.commit === props.selectedRelease?.commit);
});

const updateLinePosition = async () => {
    if (!containerRef.value) {
        linePosition.value.show = false;
        backgroundPosition.value.show = false;
        return;
    }

    await nextTick();
    const buttons = containerRef.value.querySelectorAll("button");

    if (buttons.length > 0) {
        const lastButton = buttons[buttons.length - 1] as HTMLElement;
        contentHeight.value = lastButton.offsetTop + lastButton.offsetHeight;
    }
    if (!selectedReleaseInThisList.value) {
        linePosition.value.show = false;
        backgroundPosition.value.show = false;
        return;
    }

    const selectedIndex = props.releases.findIndex(
        (release) => release.commit === props.selectedRelease?.commit,
    );

    if (selectedIndex >= 0 && buttons[selectedIndex]) {
        const button = buttons[selectedIndex] as HTMLElement;

        linePosition.value = {
            top: button.offsetTop + button.offsetHeight / 2,
            height: 18,
            show: true,
        };

        backgroundPosition.value = {
            top: button.offsetTop,
            height: button.offsetHeight,
            show: true,
        };
    } else {
        linePosition.value.show = false;
        backgroundPosition.value.show = false;
    }
};

watch(() => props.selectedRelease, updateLinePosition);
watch(() => props.releases, updateLinePosition);
onMounted(() => {
    updateLinePosition();
});
</script>

<template>
    <div class="flex flex-col">
        <h2 class="text-[13px] font-semibold text-vp-1 pb-2 leading-6 uppercase tracking-wide">
            {{ title }}
        </h2>
        <div ref="containerRef" class="overflow-y-auto flex flex-col pr-1 pl-0 relative">
            <div
                v-if="backgroundPosition.show"
                class="absolute left-0 z-[1] transition-all duration-300 ease-out bg-vp-brand-1/5"
                :style="{
                    top: `${backgroundPosition.top}px`,
                    height: `${backgroundPosition.height}px`,
                    width: 'calc(100% - 4px)',
                    // backgroundImage:
                    //     'linear-gradient(to left, var(--vp-c-brand-soft), transparent)',
                }"
            ></div>

            <div
                v-if="linePosition.show"
                class="item-line absolute left-0 w-px z-10 transition-all duration-300 ease-out"
                :style="{
                    top: `${linePosition.top}px`,
                    height: `${linePosition.height}px`,
                    transform: 'translateY(-50%)',
                }"
            ></div>

            <div
                class="absolute left-0 top-0 w-px bg-vp-divider z-[5]"
                :style="{ height: `${contentHeight}px` }"
            ></div>

            <button
                v-for="release in releases"
                :key="release.commit"
                :class="[
                    'relative flex flex-row w-full justify-between items-center text-sm group py-1 pr-2.5 transition-all duration-100 z-[2] !cursor-pointer',
                    isSelected(release) ? 'text-vp-brand-1 pl-3.5 gap-x-2.5' : 'pl-6 gap-x-3',
                    !isSelected(release) && 'release-item-bg',
                ]"
                @click="selectRelease(release)"
            >
                <span
                    :class="[
                        'text-sm font-medium truncate text-left font-mono pointer-events-none whitespace-nowrap uppercase',
                        isSelected(release)
                            ? 'text-vp-brand-1'
                            : 'text-vp-2 group-hover:text-vp-brand-1',
                    ]"
                >
                    {{ release.commit }}
                </span>
                <span
                    class="text-[11px] text-right font-mono pointer-events-none overflow-hidden text-ellipsis whitespace-nowrap"
                    :class="[isSelected(release) ? 'text-vp-brand-1/60' : '!text-vp-3']"
                >
                    {{
                        shortenTimeString(
                            useTimeAgo(new Date((release.timestamp || 0) * 1000)).value,
                        )
                    }}
                    <!-- {{ formatFullDate(release.timestamp || 0) }} -->
                </span>
            </button>
        </div>
    </div>
</template>

<style scoped>
.release-item-bg {
    position: relative;
}

.release-item-bg::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    /* background-image: linear-gradient(to left, var(--vp-c-bg-soft), var(--vp-c-bg-dark)); */
    background-color: color-mix(in srgb, var(--vp-c-brand-1) 5%, transparent);
    opacity: 0;
    transition: opacity 100ms ease-out;
    border-radius: inherit;
    z-index: -1;
}

.release-item-bg:hover::before {
    opacity: 1;
}

.item-line {
    background-color: var(--vp-c-brand-2);
}

.dark .item-line {
    background-color: var(--vp-c-brand-2);
}
</style>
