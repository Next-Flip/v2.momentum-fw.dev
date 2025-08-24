import { onBeforeUnmount, onMounted, ref, type Ref } from "vue";

export function useSticky(element: Ref<HTMLElement | null>) {
    const isStuck = ref(false);

    const checkSticky = () => {
        if (!element.value) return;

        const navHeightString = getComputedStyle(document.documentElement)
            .getPropertyValue("--vp-nav-height")
            .trim();
        const navHeight = parseFloat(navHeightString) || 0;
        const rect = element.value.getBoundingClientRect();

        isStuck.value = rect.top <= navHeight;
    };

    onMounted(() => {
        if (typeof window !== "undefined") {
            window.addEventListener("scroll", checkSticky);
            checkSticky();
        }
    });

    onBeforeUnmount(() => {
        if (typeof window !== "undefined") {
            window.removeEventListener("scroll", checkSticky);
        }
    });

    return {
        isStuck,
        checkSticky,
    };
}
