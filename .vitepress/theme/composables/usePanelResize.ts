import { useStorage } from "@vueuse/core";
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { STORAGE_KEYS } from "../types";

interface PanelResizeOptions {
    defaultTopPercentage?: number;
    defaultBottomPercentage?: number;
    minTopPercentage?: number;
    minBottomPercentage?: number;
    storageKey?: string;
    snapPoints?: number[];
    snapThreshold?: number;
}

export function usePanelResize(options: PanelResizeOptions = {}) {
    const {
        defaultTopPercentage = 70,
        defaultBottomPercentage = 30,
        minTopPercentage = 30,
        minBottomPercentage = 20,
        storageKey = STORAGE_KEYS.UPDATER_PANEL_SIZES,
        snapPoints = [50],
        snapThreshold = 2,
    } = options;

    const panelSizes = useStorage(storageKey, {
        top: defaultTopPercentage,
        bottom: defaultBottomPercentage,
    });

    const isDragging = ref(false);
    const containerRef = ref<HTMLElement | null>(null);
    const dividerRef = ref<HTMLElement | null>(null);
    const topPanelHeight = computed(() => `${panelSizes.value.top}%`);
    const bottomPanelHeight = computed(() => `${panelSizes.value.bottom}%`);
    const topPanelHeightWhenBottomClosed = computed(() => "100%");
    const bottomPanelHeightWhenTopClosed = computed(() => "100%");

    const startDrag = (event: MouseEvent) => {
        if (!containerRef.value) return;

        isDragging.value = true;
        event.preventDefault();

        const container = containerRef.value;
        const containerRect = container.getBoundingClientRect();
        const containerHeight = containerRect.height;

        const handleMouseMove = (moveEvent: MouseEvent) => {
            if (!isDragging.value || !containerRef.value) return;

            if (typeof window !== "undefined") {
                window.requestAnimationFrame(() => {
                    const mouseY = moveEvent.clientY - containerRect.top;
                    let newTopPercentage = Math.max(
                        minTopPercentage,
                        Math.min(100 - minBottomPercentage, (mouseY / containerHeight) * 100),
                    );

                    for (const snapPoint of snapPoints) {
                        if (Math.abs(newTopPercentage - snapPoint) <= snapThreshold) {
                            newTopPercentage = snapPoint;
                            break;
                        }
                    }

                    const newBottomPercentage = 100 - newTopPercentage;
                    panelSizes.value = {
                        top: Math.round(newTopPercentage * 10) / 10,
                        bottom: Math.round(newBottomPercentage * 10) / 10,
                    };
                });
            }
        };

        const handleMouseUp = () => {
            isDragging.value = false;
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
            document.body.style.cursor = "";
            document.body.style.userSelect = "";
        };

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
        document.body.style.cursor = "row-resize";
        document.body.style.userSelect = "none";
    };

    const resetToDefault = () => {
        panelSizes.value = {
            top: defaultTopPercentage,
            bottom: defaultBottomPercentage,
        };
    };

    onMounted(() => {
        if (panelSizes.value.top + panelSizes.value.bottom !== 100) {
            const topPercent = Math.max(
                minTopPercentage,
                Math.min(100 - minBottomPercentage, panelSizes.value.top),
            );
            panelSizes.value = {
                top: topPercent,
                bottom: 100 - topPercent,
            };
        }
    });

    onBeforeUnmount(() => {
        if (isDragging.value) {
            isDragging.value = false;
            document.body.style.cursor = "";
            document.body.style.userSelect = "";
        }
    });

    return {
        containerRef,
        dividerRef,
        isDragging: computed(() => isDragging.value),
        panelSizes: computed(() => panelSizes.value),
        topPanelHeight,
        bottomPanelHeight,
        topPanelHeightWhenBottomClosed,
        bottomPanelHeightWhenTopClosed,
        startDrag,
        resetToDefault,
    };
}
