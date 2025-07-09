import { computed, reactive } from "vue";

const hoverStates = reactive<Record<string, boolean>>({});
const hoverTimeouts = reactive<Record<string, number | null>>({});

export function useSharedHover(key: string) {
    if (!(key in hoverStates)) {
        hoverStates[key] = false;
        hoverTimeouts[key] = null;
    }

    const isHovered = computed(() => hoverStates[key]);

    const expand = () => {
        if (hoverTimeouts[key]) {
            clearTimeout(hoverTimeouts[key]!);
            hoverTimeouts[key] = null;
        }
        hoverStates[key] = true;
    };

    const collapse = (delay = 0) => {
        if (hoverTimeouts[key]) {
            clearTimeout(hoverTimeouts[key]!);
            hoverTimeouts[key] = null;
        }

        if (delay > 0) {
            hoverTimeouts[key] = window.setTimeout(() => {
                hoverStates[key] = false;
            }, delay);
        } else {
            hoverStates[key] = false;
        }
    };

    const clearHoverTimeout = () => {
        if (hoverTimeouts[key]) {
            clearTimeout(hoverTimeouts[key]!);
            hoverTimeouts[key] = null;
        }
    };

    const hostExpand = () => expand();
    const hostCollapse = (delay = 0) => collapse(delay);

    const isHostHovered = () => hoverStates[key];

    return {
        isHovered,
        hostExpand,
        hostCollapse,
        isHostHovered,
        clearHoverTimeout,
    };
}

export function useMultipleSharedHover(keys: string[]) {
    const states = keys.map((key) => {
        const { isHovered } = useSharedHover(key);
        return isHovered;
    });

    return {
        states,
        isAnyHovered: computed(() => states.some((state) => state.value)),
    };
}
