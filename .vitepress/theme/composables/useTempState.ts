import { computed, onBeforeUnmount, ref, type ComputedRef } from "vue";

interface TempStateConfig {
    duration?: number;
    beforeIcon: string;
    afterIcon: string;
    beforeText: string | (() => string) | ComputedRef<string>;
    afterText: string | (() => string) | ComputedRef<string>;
}

export const useTempState = (config: TempStateConfig) => {
    const { duration = 3000, beforeIcon, afterIcon, beforeText, afterText } = config;

    const isPressed = ref(false);
    const isSuccess = ref(false);
    let timeout: NodeJS.Timeout | null = null;

    const currentIcon = computed(() => (isSuccess.value ? afterIcon : beforeIcon));

    const currentText = computed(() => {
        const before =
            typeof beforeText === "function"
                ? beforeText()
                : typeof beforeText === "object" && "value" in beforeText
                  ? beforeText.value
                  : beforeText;

        const after =
            typeof afterText === "function"
                ? afterText()
                : typeof afterText === "object" && "value" in afterText
                  ? afterText.value
                  : afterText;

        return isSuccess.value ? after : before;
    });

    const trigger = () => {
        if (timeout) clearTimeout(timeout);

        isSuccess.value = true;

        timeout = setTimeout(() => {
            isSuccess.value = false;
        }, duration);
    };

    const handleMouseDown = () => {
        isPressed.value = true;
    };

    const handleMouseUp = () => {
        isPressed.value = false;
    };

    const handleMouseLeave = () => {
        isPressed.value = false;
    };

    onBeforeUnmount(() => {
        if (timeout) clearTimeout(timeout);
    });

    return {
        isPressed,
        isSuccess,
        currentIcon,
        currentText,
        trigger,
        handleMouseDown,
        handleMouseUp,
        handleMouseLeave,
    };
};
