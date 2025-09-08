import { useStorage } from "@vueuse/core";
import { useData } from "vitepress";
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { LOGO_COLORS, LogoColor, STORAGE_KEYS } from "../types";

export function useThemeSwitcher(basePath: string = "/logos/") {
    const logoColors = LOGO_COLORS;
    const currentIndex = ref(0);
    const { isDark } = useData();

    const currentLogo = computed(() => {
        const currentColor = logoColors[currentIndex.value];

        return `${basePath}${
            currentColor === "white" ? (isDark.value ? "white" : "black") : currentColor
        }_round.png`;
    });

    const currentTheme = useStorage(STORAGE_KEYS.THEME, logoColors[0], undefined, {
        initOnMounted: true,
    });
    const currentThemeClass = computed(() => `theme-${logoColors[currentIndex.value]}`);
    const isInitialized = ref(false);
    const isLocked = useStorage(STORAGE_KEYS.THEME_LOCKED, false, undefined, {
        initOnMounted: true,
    });

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

        logoColors.forEach((color: LogoColor) => {
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

    const ifCurrentTheme = (themes: LogoColor[]) => {
        return themes.includes(currentTheme.value as LogoColor);
    };

    const nextLogo = () => {
        if (!isLocked.value) {
            currentIndex.value = (currentIndex.value + 1) % logoColors.length;
        }
    };

    const toggleLock = () => {
        isLocked.value = !isLocked.value;
    };

    const initTheme = () => {
        nextTick(() => {
            const savedTheme = currentTheme.value;
            const themeIndex = logoColors.indexOf(savedTheme as LogoColor);

            if (themeIndex !== -1) {
                currentIndex.value = themeIndex;
            } else {
                currentIndex.value = 0;
                currentTheme.value = logoColors[0];
            }

            applyTheme(logoColors[currentIndex.value]);
            isInitialized.value = true;
        });
    };

    onMounted(() => {
        const htmlElement = document.documentElement;
        if (
            !logoColors.some((color: LogoColor) => htmlElement.classList.contains(`theme-${color}`))
        ) {
            htmlElement.classList.add(`theme-${logoColors[0]}`);
        }

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
        ifCurrentTheme,
        nextLogo,
        toggleLock,
        applyTheme,
    };
}
