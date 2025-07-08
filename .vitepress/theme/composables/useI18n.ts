import { PageData, type Route, SiteData, useData, useRoute } from "vitepress";
import { computed } from "vue";
import messages, { type MessageSchema, type SupportedLocales, isSupportedLocale } from "../../i18n";

export function useI18n() {
    let route: Route;
    let site: SiteData;

    try {
        route = useRoute();
        const data = useData();
        site = data.site.value;
    } catch {
        route = { path: "/", data: {} as PageData, component: null };
        site = { lang: "en-US" } as SiteData;
    }

    const currentLocale = computed((): SupportedLocales => {
        if (typeof window === "undefined") {
            try {
                const siteLocale = site?.lang?.split("-")[0] || "en";
                return isSupportedLocale(siteLocale) ? siteLocale : "en";
            } catch {
                return "en";
            }
        }

        try {
            const pathSegments = route.path.split("/").filter(Boolean);
            const potentialLocale = pathSegments[0];

            if (potentialLocale && isSupportedLocale(potentialLocale)) {
                return potentialLocale;
            }
        } catch {
            return "en";
        }

        return "en";
    });

    const currentMessages = computed((): MessageSchema => {
        try {
            return messages[currentLocale.value] || messages.en;
        } catch {
            return messages.en;
        }
    });

    const interpolate = (message: string, params?: Record<string, string | number>): string => {
        if (!params) return message;

        return message.replace(/\{\{(\w+)\}\}/g, (match, key) => {
            return params[key]?.toString() || match;
        });
    };

    const t = (key: keyof MessageSchema, params?: Record<string, string | number>): string => {
        try {
            const message = currentMessages.value[key];
            const text = message || key;
            return interpolate(text, params);
        } catch {
            return key;
        }
    };

    const tr = computed(() => {
        return (key: keyof MessageSchema, params?: Record<string, string | number>): string => {
            try {
                const message = currentMessages.value[key];
                const text = message || key;
                return interpolate(text, params);
            } catch {
                return key;
            }
        };
    });

    const isLocale = (locale: SupportedLocales): boolean => {
        try {
            return currentLocale.value === locale;
        } catch {
            return locale === "en";
        }
    };

    const getLocalizedPath = (path: string, targetLocale?: SupportedLocales): string => {
        try {
            const locale = targetLocale || currentLocale.value;

            if (locale === "en") {
                return path.startsWith("/") ? path : `/${path}`;
            }

            const cleanPath = path.startsWith("/") ? path.slice(1) : path;
            return `/${locale}/${cleanPath}`;
        } catch {
            return path.startsWith("/") ? path : `/${path}`;
        }
    };

    return {
        currentLocale: currentLocale.value,
        locale: currentLocale,
        messages: currentMessages,
        t,
        tr: tr.value,
        isLocale,
        getLocalizedPath,
        supportedLocales: Object.keys(messages) as SupportedLocales[],
    };
}
