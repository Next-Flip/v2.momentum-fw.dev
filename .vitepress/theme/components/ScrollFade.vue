<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
    defineProps<{
        position: "top" | "bottom";
        offset?: string;
        show: boolean;
        opacity?: number;
        background?: string;
    }>(),
    {
        opacity: 60,
        offset: "0",
        background: "vp-dark",
    },
);

const isVisible = computed(() => props.show);

const gradientClass = computed(() => {
    const direction = props.position === "top" ? "b" : "t";
    return `bg-gradient-to-${direction} from-${props.background}/${props.opacity} dark:from-${props.background}/${props.opacity} to-transparent`;
});

const positionClass = computed(() => {
    return props.position === "top" ? `top-${props.offset}` : `bottom-${props.offset}`;
});
</script>

<template>
    <div
        :class="[
            'absolute left-0 right-0 h-20 pointer-events-none z-10 mr-4 opacity-0 transition-opacity duration-300',
            gradientClass,
            positionClass,
            {
                'opacity-100': isVisible,
            },
        ]"
    ></div>
</template>
