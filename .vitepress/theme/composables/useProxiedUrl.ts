import { devMode } from "../util";

export function useProxiedUrl(url: string): string {
    if (typeof window === "undefined") return url;

    const isDev = devMode();
    const isActualDev =
        isDev &&
        (window.location.port === "5173" ||
            window.location.port === "3000" ||
            import.meta.env?.DEV === true);

    if (url && url.includes("up.momentum-fw.dev")) {
        if (isActualDev) {
            if (url.includes("/builds/asset-packs")) {
                const assetPath = url.split("up.momentum-fw.dev/builds/asset-packs")[1];
                if (assetPath) {
                    return `/assets${assetPath}`;
                }
            }
            if (url.includes("/asset-packs/directory.json")) {
                return "/api/asset-packs/directory.json";
            }
        } else {
            return url;
        }
    }

    return url;
}
