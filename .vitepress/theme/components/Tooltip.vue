<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from "vue";

type TooltipPosition = "top" | "bottom" | "left" | "right";
type TooltipTheme = "default" | "warning" | "error";

interface Props {
    position?: TooltipPosition;
    theme?: TooltipTheme;
    delay?: number;
    hideDelay?: number;
    maxWidth?: string;
    offset?: number;
    zIndex?: number;
    disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
    position: "top",
    theme: "default",
    delay: 200,
    hideDelay: 0,
    maxWidth: "250px",
    offset: 9,
    zIndex: 10,
    disabled: false,
});

const isVisible = ref(false);
const tooltip = ref<HTMLDivElement | null>(null);
const container = ref<HTMLDivElement | null>(null);
const timeoutId = ref<number | null>(null);

const tooltipStyle = computed(() => ({
    maxWidth: props.maxWidth,
    zIndex: props.zIndex,
}));

const themeClass = computed(() => (props.theme !== "default" ? `tooltip-${props.theme}` : ""));

const showTooltip = () => {
    if (timeoutId.value) clearTimeout(timeoutId.value);
    timeoutId.value =
        typeof window !== "undefined"
            ? window.setTimeout(() => {
                  isVisible.value = true;
                  nextTick(() => {
                      positionTooltip();
                  });
              }, props.delay)
            : null;
};

const hideTooltip = () => {
    if (timeoutId.value) clearTimeout(timeoutId.value);
    timeoutId.value =
        typeof window !== "undefined"
            ? window.setTimeout(() => {
                  isVisible.value = false;
              }, props.hideDelay)
            : null;
};

const keepTooltipVisible = () => {
    if (timeoutId.value) clearTimeout(timeoutId.value);
};

const hideTooltipImmediate = () => {
    if (timeoutId.value) clearTimeout(timeoutId.value);
    timeoutId.value =
        typeof window !== "undefined"
            ? window.setTimeout(() => {
                  isVisible.value = false;
              }, props.hideDelay)
            : null;
};

const positionTooltip = () => {
    if (!tooltip.value || !container.value) return;

    const tooltipEl = tooltip.value;
    const triggerEl = container.value;
    const arrowEl = tooltipEl.querySelector(".tooltip-arrow") as HTMLElement | null;
    const triggerRect = triggerEl.getBoundingClientRect();
    const tooltipRect = tooltipEl.getBoundingClientRect();

    tooltipEl.style.position = "fixed";
    const triggerCenter = {
        x: triggerRect.left + triggerRect.width / 2,
        y: triggerRect.top + triggerRect.height / 2,
    };

    if (props.position === "top") {
        tooltipEl.style.bottom = "";
        tooltipEl.style.right = "";
        tooltipEl.style.left = `${triggerCenter.x - 1 - tooltipRect.width / 2}px`;
        tooltipEl.style.top = `${triggerRect.top - 2 - tooltipRect.height - props.offset}px`;

        if (arrowEl) {
            arrowEl.style.left = "50%";
            arrowEl.style.top = "";
        }
    } else if (props.position === "bottom") {
        tooltipEl.style.top = `${triggerRect.bottom + props.offset}px`;
        tooltipEl.style.left = `${triggerCenter.x - tooltipRect.width / 2}px`;
        tooltipEl.style.right = "";
        tooltipEl.style.bottom = "";

        if (arrowEl) {
            arrowEl.style.left = "50%";
            arrowEl.style.top = "";
        }
    } else if (props.position === "left") {
        tooltipEl.style.right = "";
        tooltipEl.style.bottom = "";
        tooltipEl.style.left = `${triggerRect.left - tooltipRect.width - props.offset}px`;
        tooltipEl.style.top = `${triggerCenter.y - tooltipRect.height / 2}px`;

        if (arrowEl) {
            arrowEl.style.left = "";
            arrowEl.style.top = "50%";
        }
    } else if (props.position === "right") {
        tooltipEl.style.left = `${triggerRect.right + props.offset}px`;
        tooltipEl.style.top = `${triggerCenter.y - tooltipRect.height / 2}px`;
        tooltipEl.style.right = "";
        tooltipEl.style.bottom = "";

        if (arrowEl) {
            arrowEl.style.left = "";
            arrowEl.style.top = "50%";
        }
    }

    const viewportWidth = typeof window !== "undefined" ? window.innerWidth : 0;
    const viewportHeight = typeof window !== "undefined" ? window.innerHeight : 0;
    const tooltipLeft = parseFloat(tooltipEl.style.left);
    const tooltipTop = parseFloat(tooltipEl.style.top);

    if (!isNaN(tooltipLeft)) {
        if (tooltipLeft < 10) {
            tooltipEl.style.left = "10px";
        } else if (tooltipLeft + tooltipRect.width > viewportWidth - 10) {
            tooltipEl.style.left = `${viewportWidth - tooltipRect.width - 10}px`;
        }
    }

    if (!isNaN(tooltipTop)) {
        if (tooltipTop < 10) {
            tooltipEl.style.top = "10px";
        } else if (tooltipTop + tooltipRect.height > viewportHeight - 10) {
            tooltipEl.style.top = `${viewportHeight - tooltipRect.height - 10}px`;
        }
    }
};

const handlePositionUpdate = () => {
    if (isVisible.value) {
        positionTooltip();
    }
};

onMounted(() => {
    if (typeof window !== "undefined") {
        window.addEventListener("resize", handlePositionUpdate);
        window.addEventListener("scroll", handlePositionUpdate, true);
    }
});
onBeforeUnmount(() => {
    if (typeof window !== "undefined") {
        window.removeEventListener("resize", handlePositionUpdate);
        window.removeEventListener("scroll", handlePositionUpdate, true);
    }
    if (timeoutId.value) clearTimeout(timeoutId.value);
});
</script>

<template>
    <div v-if="!disabled" ref="container" class="relative inline">
        <div class="tooltip-trigger" @mouseenter="showTooltip" @mouseleave="hideTooltip">
            <slot />
        </div>
        <teleport to="body">
            <transition name="tooltip-fade">
                <div
                    v-if="isVisible"
                    ref="tooltip"
                    :class="[
                        'tooltip fixed z-10 backdrop-blur-md text-vp-1 border border-vp-divider rounded-md p-1.5 px-3 text-[13px] box-border text-center whitespace-normal will-change-transform will-change-opacity max-w-full',
                        position,
                        themeClass,
                    ]"
                    :style="tooltipStyle"
                    @mouseenter="keepTooltipVisible"
                    @mouseleave="hideTooltipImmediate"
                >
                    <div class="text-center relative z-10 max-w-full">
                        <slot name="content"></slot>
                    </div>
                </div>
            </transition>
        </teleport>
    </div>
    <div v-else>
        <slot />
    </div>
</template>

<style scoped>
.tooltip-trigger {
    display: inherit;
    align-items: inherit;
    justify-content: inherit;
}

.tooltip {
    box-shadow: var(--vp-shadow-3) !important;
    background-color: color-mix(in srgb, var(--vp-c-neutral-inverse) 90%, transparent);
}

.tooltip-fade-enter-active,
.tooltip-fade-leave-active {
    transition:
        opacity 0.2s,
        transform 0.2s;
}

.tooltip-fade-enter-from,
.tooltip-fade-leave-to {
    opacity: 0;
}

.tooltip.top.tooltip-fade-enter-from,
.tooltip.top.tooltip-fade-leave-to {
    transform: translateY(5px);
}

.tooltip.bottom.tooltip-fade-enter-from,
.tooltip.bottom.tooltip-fade-leave-to {
    transform: translateY(-5px);
}

.tooltip.left.tooltip-fade-enter-from,
.tooltip.left.tooltip-fade-leave-to {
    transform: translateX(5px);
}

.tooltip.right.tooltip-fade-enter-from,
.tooltip.right.tooltip-fade-leave-to {
    transform: translateX(-5px);
}

@media (prefers-color-scheme: dark) {
    .tooltip {
        box-shadow: 0 3px 10px rgba(0, 0, 0, 0.25);
    }
}
</style>
