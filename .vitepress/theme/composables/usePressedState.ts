import { ref, type Ref } from "vue";

interface PressedStateOptions {
    initialPressed?: boolean;
    pressedScale?: number;
    autoHandle?: boolean;
}

interface PressedStateReturn {
    isPressed: Ref<boolean>;
    setPressed: (pressed: boolean) => void;
    toggle: () => void;
    handleMouseDown: (_event?: Event) => void;
    handleMouseUp: (_event?: Event) => void;
    handleMouseLeave: (_event?: Event) => void;
    handleTouchStart: (_event?: Event) => void;
    handleTouchEnd: (_event?: Event) => void;
}

export function usePressedState(options: PressedStateOptions = {}): PressedStateReturn {
    const { initialPressed = false, autoHandle = true } = options;
    const isPressed = ref(initialPressed);

    const setPressed = (pressed: boolean) => {
        isPressed.value = pressed;
    };

    const toggle = () => {
        isPressed.value = !isPressed.value;
    };

    const handleMouseDown = (_event?: Event) => {
        if (!autoHandle) return;
        _event?.preventDefault?.();
        setPressed(true);
    };

    const handleMouseUp = (_event?: Event) => {
        if (!autoHandle) return;
        setPressed(false);
    };

    const handleMouseLeave = (_event?: Event) => {
        if (!autoHandle) return;
        setPressed(false);
    };

    const handleTouchStart = (_event?: Event) => {
        if (!autoHandle) return;
        _event?.preventDefault?.();
        setPressed(true);
    };

    const handleTouchEnd = (_event?: Event) => {
        if (!autoHandle) return;
        setPressed(false);
    };

    return {
        isPressed,
        setPressed,
        toggle,
        handleMouseDown,
        handleMouseUp,
        handleMouseLeave,
        handleTouchStart,
        handleTouchEnd,
    };
}

export function useMultiplePressedStates(
    keys: string[],
    options: PressedStateOptions = {},
): Record<string, PressedStateReturn> {
    const states: Record<string, PressedStateReturn> = {};

    for (const key of keys) {
        states[key] = usePressedState(options);
    }

    return states;
}
