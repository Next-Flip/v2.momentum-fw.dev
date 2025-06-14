import { ref } from "vue";
import { useProxiedUrl } from "./useProxiedUrl";

const imageCache = ref<Map<string, string>>(new Map());
const imageLoadPromises = ref<Map<string, Promise<string>>>(new Map());
const failedUrls = ref<Set<string>>(new Set());

export function useImageCache() {
    const getCachedOrProxiedUrl = (url: string): string => {
        if (imageCache.value.has(url)) {
            return imageCache.value.get(url)!;
        }

        let finalUrl = url;
        if (url.startsWith("/assets")) {
            const originalUrl = "https://up.momentum-fw.dev/builds/asset-packs" + url.substring(7);
            finalUrl = useProxiedUrl(originalUrl);
        }

        imageCache.value.set(url, finalUrl);
        return finalUrl;
    };

    const isUrlFailed = (url: string): boolean => {
        const cachedUrl = imageCache.value.get(url) || url;
        return failedUrls.value.has(cachedUrl);
    };

    const markUrlAsFailed = (url: string): void => {
        const cachedUrl = getCachedOrProxiedUrl(url);
        failedUrls.value.add(cachedUrl);
        imageLoadPromises.value.delete(cachedUrl);
    };

    const preloadImage = async (url: string): Promise<string> => {
        const cachedUrl = getCachedOrProxiedUrl(url);

        if (imageLoadPromises.value.has(cachedUrl)) {
            return imageLoadPromises.value.get(cachedUrl)!;
        }

        const loadPromise = new Promise<string>((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                imageLoadPromises.value.delete(cachedUrl);
                resolve(cachedUrl);
            };
            img.onerror = () => {
                imageLoadPromises.value.delete(cachedUrl);
                reject(new Error(`Failed to load image: ${cachedUrl}`));
            };
            img.src = cachedUrl;
        });

        imageLoadPromises.value.set(cachedUrl, loadPromise);
        return loadPromise;
    };

    const clearCache = () => {
        imageCache.value.clear();
        imageLoadPromises.value.clear();
        failedUrls.value.clear();
    };

    return {
        getCachedOrProxiedUrl,
        preloadImage,
        clearCache,
        cacheSize: () => imageCache.value.size,
        isUrlFailed,
        markUrlAsFailed,
    };
}
