import { onBeforeUnmount, onMounted, type Ref } from "vue";

interface ClickOutsideTarget {
    element: Ref<HTMLElement | null>;
    callback: () => void;
}

export function useClickOutside(targets: ClickOutsideTarget | ClickOutsideTarget[]) {
    const targetArray = Array.isArray(targets) ? targets : [targets];

    const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as Node;

        for (const { element, callback } of targetArray) {
            if (element.value && !element.value.contains(target)) {
                callback();
            }
        }
    };

    onMounted(() => {
        document.addEventListener("click", handleClickOutside);
    });

    onBeforeUnmount(() => {
        document.removeEventListener("click", handleClickOutside);
    });

    return {
        handleClickOutside,
    };
}
