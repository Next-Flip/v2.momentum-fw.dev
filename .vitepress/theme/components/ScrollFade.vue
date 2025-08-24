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
</script>

<template>
    <div
        :class="[
            'absolute left-0 right-0 h-20 pointer-events-none select-none z-20 opacity-0 transition-opacity duration-300',
            position === 'top'
                ? `top-${offset} bg-gradient-to-b from-${background}/${opacity} dark:from-${background}/${opacity} to-transparent`
                : `bottom-${offset} bg-gradient-to-t from-${background}/${opacity} dark:from-${background}/${opacity} to-transparent`,
            {
                'opacity-100': isVisible,
            },
        ]"
    ></div>
</template>
