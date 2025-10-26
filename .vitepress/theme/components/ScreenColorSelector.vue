<script setup lang="ts">
import { computed, inject } from "vue";
import { useSerialConnection, useSettings, useThemeSwitcher } from "../composables";
import type { ScreenColor } from "../types";

const serialConnection = inject<ReturnType<typeof useSerialConnection> | null>("serialConnection");
const { currentScreenColor, getScreenColorOptions } = useSettings();
const { currentTheme } = useThemeSwitcher();

const screenColorOptions = computed(() => {
    const options = getScreenColorOptions();
    return options.map((color) => ({
        value: color,
        label: color.charAt(0).toUpperCase() + color.slice(1),
    }));
});

const handleScreenColorChange = (color: ScreenColor) => {
    if (serialConnection) {
        currentScreenColor.value = color;
        serialConnection.addLog(
            "info",
            `[{{Screen}}] Color changed to <code class="code-${color}">${color}</code>`,
        );
    }
};

const isSelected = (color: ScreenColor, option: ScreenColor) => {
    return match(color, option) && match(currentScreenColor.value, option);
};
const match = (color: ScreenColor, option: ScreenColor) => {
    return color === option;
};
</script>

<template>
    <div class="relative flex items-center border border-vp-divider/70 rounded-lg w-full">
        <div class="flex items-center gap-px m-1 rounded overflow-hidden w-full">
            <button
                v-for="option in screenColorOptions"
                :key="option.value"
                class="w-full h-6 flex items-center justify-center box-content transition-all duration-100 hover:bg-vp-1/5 group"
                :class="{
                    '!bg-vp-brand-1/10 hover:bg-vp-brand-1/15': isSelected(
                        option.value as ScreenColor,
                        'primary',
                    ),
                    '!bg-white/10':
                        isSelected(option.value as ScreenColor, 'primary') &&
                        currentTheme === 'skyline',
                    '!bg-vp-alternate-1/10 hover:bg-vp-alternate-1/15': isSelected(
                        option.value as ScreenColor,
                        'secondary',
                    ),
                    '!bg-flipper-fill/10 hover:bg-flipper-fill/15': isSelected(
                        option.value as ScreenColor,
                        'default',
                    ),
                    '!bg-neutral-400/10 hover:bg-neutral-400/15': isSelected(
                        option.value as ScreenColor,
                        'white',
                    ),
                }"
                @click="handleScreenColorChange(option.value as ScreenColor)"
            >
                <div
                    class="w-2.5 h-2.5 rounded-full border border-vp-1/10 transition-all duration-100 group-hover:opacity-95 group-hover:scale-110"
                    :class="{
                        '!opacity-100 !scale-110': isSelected(option.value, currentScreenColor),
                        'bg-vp-brand-1': match(option.value, 'primary'),
                        'bg-vp-brand-1 dark:invert':
                            match(option.value, 'primary') && currentTheme === 'white',
                        '!bg-neutral-900 border-vp-1/5':
                            match(option.value, 'primary') && currentTheme === 'skyline',
                        'bg-vp-alternate-1': match(option.value, 'secondary'),
                        'bg-flipper-fill': match(option.value, 'default'),
                        'bg-neutral-300 dark:bg-neutral-50': match(option.value, 'white'),
                    }"
                ></div>
            </button>
        </div>
    </div>
</template>
