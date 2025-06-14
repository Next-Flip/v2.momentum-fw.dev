import { computed, ref } from "vue";

export function useLogoCycle(logoColors: string[], basePath: string = "/logos/") {
    const currentIndex = ref(0);
    const currentLogo = computed(() => `${basePath}${logoColors[currentIndex.value]}_round.png`);

    const nextLogo = () => {
        currentIndex.value = (currentIndex.value + 1) % logoColors.length;
    };

    const previousLogo = () => {
        currentIndex.value =
            currentIndex.value === 0 ? logoColors.length - 1 : currentIndex.value - 1;
    };

    const resetToFirst = () => {
        currentIndex.value = 0;
    };

    return {
        currentLogo,
        nextLogo,
        previousLogo,
        resetToFirst,
        currentIndex,
    };
}
