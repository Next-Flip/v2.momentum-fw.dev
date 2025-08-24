import { onMounted, onUnmounted, watch, type Ref } from "vue";

export interface HeadConfig {
    title?: string;
    description?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    ogUrl?: string;
    twitterTitle?: string;
    twitterDescription?: string;
    twitterImage?: string;
}

export function useHead(config: Ref<HeadConfig> | HeadConfig) {
    const updateTitle = (title: string) => {
        if (typeof document !== "undefined") {
            document.title = title;
        }
    };

    const updateMetaTag = (selector: string, content: string) => {
        if (typeof document !== "undefined") {
            // eslint-disable-next-line no-undef
            let meta = document.querySelector(selector) as HTMLMetaElement;
            if (!meta) {
                meta = document.createElement("meta");
                if (selector.includes("property=")) {
                    const property = selector.match(/property="([^"]+)"/)?.[1];
                    if (property) meta.setAttribute("property", property);
                } else if (selector.includes("name=")) {
                    const name = selector.match(/name="([^"]+)"/)?.[1];
                    if (name) meta.setAttribute("name", name);
                }
                document.head.appendChild(meta);
            }
            meta.setAttribute("content", content);
        }
    };

    const applyHead = (headConfig: HeadConfig) => {
        if (headConfig.title) {
            updateTitle(headConfig.title);
        }
        if (headConfig.description) {
            updateMetaTag('meta[name="description"]', headConfig.description);
        }
        if (headConfig.ogTitle) {
            updateMetaTag('meta[property="og:title"]', headConfig.ogTitle);
        }
        if (headConfig.ogDescription) {
            updateMetaTag('meta[property="og:description"]', headConfig.ogDescription);
        }
        if (headConfig.ogImage) {
            updateMetaTag('meta[property="og:image"]', headConfig.ogImage);
        }
        if (headConfig.ogUrl) {
            updateMetaTag('meta[property="og:url"]', headConfig.ogUrl);
        }
        if (headConfig.twitterTitle) {
            updateMetaTag('meta[name="twitter:title"]', headConfig.twitterTitle);
        }
        if (headConfig.twitterDescription) {
            updateMetaTag('meta[name="twitter:description"]', headConfig.twitterDescription);
        }
        if (headConfig.twitterImage) {
            updateMetaTag('meta[name="twitter:image"]', headConfig.twitterImage);
        }
    };

    if ("value" in config) {
        const stopWatcher = watch(
            config,
            (newConfig) => {
                if (newConfig) {
                    applyHead(newConfig);
                }
            },
            { immediate: true, deep: true },
        );

        onUnmounted(() => {
            stopWatcher();
        });
    } else {
        onMounted(() => {
            applyHead(config as HeadConfig);
        });
    }

    return {
        updateTitle,
        updateMetaTag,
        applyHead,
    };
}
