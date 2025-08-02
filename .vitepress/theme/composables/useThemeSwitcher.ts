import { useStorage } from "@vueuse/core";
import { computed, nextTick, onMounted, ref, watch } from "vue";

export function useThemeSwitcher(basePath: string = "/logos/") {
    const logoColors = ["purp", "orange", "pink", "white"];
    const currentIndex = ref(0);
    const currentLogo = computed(() => `${basePath}${logoColors[currentIndex.value]}_round.png`);
    const currentTheme = useStorage("momentum-theme", logoColors[0]);
    const currentThemeClass = computed(() => `theme-${logoColors[currentIndex.value]}`);
    const isInitialized = ref(false);
    const isLocked = useStorage("momentum-theme-locked", false);

    const updateThemeColor = (color: string) => {
        let meta = document.querySelector('meta[name="theme-color"]');
        if (!meta) {
            meta = document.createElement("meta");
            meta.setAttribute("name", "theme-color");
            document.head.appendChild(meta);
        }
        meta.setAttribute("content", color);
    };

    const applyTheme = (theme: string) => {
        const htmlElement = document.documentElement;

        logoColors.forEach((color) => {
            htmlElement.classList.remove(`theme-${color}`);
        });

        htmlElement.classList.add(`theme-${theme}`);
        currentTheme.value = theme;
        const isDark = htmlElement.classList.contains("dark");
        updateThemeColor(isDark ? "#0f0f12" : "#ffffff");
    };

    watch(
        currentIndex,
        (newIndex) => {
            if (isInitialized.value) {
                applyTheme(logoColors[newIndex]);
            }
        },
        { immediate: false },
    );

    const nextLogo = () => {
        if (!isLocked.value) {
            currentIndex.value = (currentIndex.value + 1) % logoColors.length;
        }
    };

    const previousLogo = () => {
        if (!isLocked.value) {
            currentIndex.value =
                currentIndex.value === 0 ? logoColors.length - 1 : currentIndex.value - 1;
        }
    };

    const toggleLock = () => {
        isLocked.value = !isLocked.value;
    };

    const initTheme = () => {
        nextTick(() => {
            const savedTheme = currentTheme.value;
            const themeIndex = logoColors.indexOf(savedTheme);

            if (themeIndex !== -1) {
                currentIndex.value = themeIndex;
            }

            applyTheme(logoColors[currentIndex.value]);
            isInitialized.value = true;
        });
    };

    onMounted(() => {
        initTheme();

        const observer = new MutationObserver(() => {
            const isDark = document.documentElement.classList.contains("dark");
            updateThemeColor(isDark ? "#0f0f12" : "#ffffff");
        });

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["class"],
        });
    });

    return {
        currentIndex,
        currentLogo,
        currentTheme,
        currentThemeClass,
        isLocked,
        nextLogo,
        previousLogo,
        toggleLock,
        applyTheme,
    };
}
