import { onUnmounted, ref } from "vue";

interface UseDotsOptions {
    count?: number;
    delay?: number;
    char?: string;
}

export function useDots(options: UseDotsOptions = {}) {
    const { count = 3, delay = 250, char = "." } = options;

    const currentDots = ref("");
    const currentCount = ref(1);
    let currentDelay = delay;
    let interval: NodeJS.Timeout;

    const startInterval = () => {
        if (interval) {
            clearInterval(interval);
        }
        interval = setInterval(() => {
            currentDots.value = char.repeat(currentCount.value);
            currentCount.value = currentCount.value >= count ? 1 : currentCount.value + 1;
        }, currentDelay);
    };

    const setDelay = (newDelay: number = delay) => {
        currentDelay = newDelay;
        startInterval();
    };

    startInterval();

    onUnmounted(() => {
        if (interval) {
            clearInterval(interval);
        }
    });

    return {
        dots: currentDots,
        setDelay,
    };
}
