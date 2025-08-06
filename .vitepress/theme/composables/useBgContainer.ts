import { computed } from "vue";
import type { LogoColor } from "../types";
import { getBgContainerClass, getHueRotation, shouldUseDarkImageStyling } from "../util";
import { useSettings } from "./useSettings";
import { useThemeSwitcher } from "./useThemeSwitcher";

export function useBgContainer() {
    const { currentTheme } = useThemeSwitcher();
    const { currentScreenColor } = useSettings();

    const bgContainerClass = computed(() => {
        return getBgContainerClass(currentTheme.value as LogoColor, currentScreenColor.value);
    });

    const shouldUseBgContainer = computed(() => {
        return bgContainerClass.value !== null;
    });

    const bgContainerClasses = computed(() => {
        const classes = [];
        if (bgContainerClass.value) {
            classes.push("bg-container", bgContainerClass.value);
        }
        return classes;
    });

    const hueRotationClass = computed(() => {
        return getHueRotation(currentTheme.value as LogoColor, currentScreenColor.value);
    });

    const shouldUseHueRotation = computed(() => {
        return hueRotationClass.value !== null;
    });

    const shouldUseDarkImage = computed(() => {
        return shouldUseDarkImageStyling(currentTheme.value as LogoColor, currentScreenColor.value);
    });

    return {
        bgContainerClass,
        shouldUseBgContainer,
        bgContainerClasses,
        hueRotationClass,
        shouldUseHueRotation,
        shouldUseDarkImage,
    };
}
