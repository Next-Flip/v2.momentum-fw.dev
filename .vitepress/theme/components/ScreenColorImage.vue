<script setup lang="ts">
import { useBgContainer } from "../composables";

const props = withDefaults(
    defineProps<{
        src: string;
        alt?: string;
        width?: string | number;
    }>(),
    {
        alt: "",
        width: "200",
    },
);

const { shouldUseBgContainer, bgContainerClasses, shouldUseDarkImage } = useBgContainer();
</script>

<template>
    <div
        class="relative inline-block"
        :class="[shouldUseBgContainer ? bgContainerClasses : 'bg-flipper-fill']"
    >
        <img
            :src="props.src"
            :alt="props.alt"
            :width="props.width"
            class="block"
            :class="{
                'saturate-0 contrast-200 brightness-[3]': shouldUseDarkImage,
                'dark:saturate-100 dark:contrast-100 dark:brightness-100': !shouldUseDarkImage,
            }"
        />
    </div>
</template>
