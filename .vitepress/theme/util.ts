import log from "loglevel";
import type { ReleaseItem } from "scripts/releases.js";
import messages, { SupportedLocales } from "../i18n/index.js";
import { useI18n } from "./composables/useI18n";
import type { LogoColor, RegionsData, ScreenColor } from "./types";
// @ts-expect-error - pako is a global library
import pako from "pako";
// @ts-expect-error - untar is a global library
import { untar } from "./flipper/untar/untar.js";

export const githubUrl = "https://github.com/Next-Flip/Momentum-Firmware";
export const githubBranchUrl = (branch: string) => `${githubUrl}/tree/${branch}`;
export const githubCommitUrl = (commit: string) => `${githubUrl}/commit/${commit}`;
export const githubPullRequestUrl = (pullRequest: string) => `${githubUrl}/pull/${pullRequest}`;
export const githubBlobUrl = (blob: string) => `${githubUrl}/blob/${blob}`;
export const githubTagUrl = (tag: string) => `${githubUrl}/releases/tag/${tag}`;

export function supportsSerialPort(): boolean {
    return typeof window !== "undefined" && typeof navigator !== "undefined" && "serial" in navigator;
}

export function supportsBluetooth(): boolean {
    return typeof window !== "undefined" && typeof navigator !== "undefined" && "bluetooth" in navigator;
}

export function devMode() {
    if (typeof window === "undefined") return false;
    const host = window.location.hostname;
    return host === "localhost" || host === "127.0.0.1";
}

export const scrollToTop = (behavior: ScrollBehavior = "instant") => {
    if (typeof window === "undefined") return;
    window.scrollTo({ top: 0, left: 0, behavior });
};

export const isExternalLink = (url: string) => {
    return url.startsWith("http");
};

export const bytesToSize = (bytes: number, useStandardUnits = false) => {
    const sizes = useStandardUnits ? ["Bytes", "KB", "MB", "GB", "TB"] : ["Bytes", "KiB", "MiB", "GiB", "TiB"];
    const base = useStandardUnits ? 1000 : 1024;

    if (bytes === 0) return "n/a";
    const i = Math.floor(Math.log(bytes) / Math.log(base));
    if (i === 0) return `${bytes} ${sizes[i]}`;
    return `${(bytes / Math.pow(base, i)).toFixed(useStandardUnits ? 2 : 1)} ${sizes[i]}`;
};

export const getRadioStackType = (radioStackType: string | number | undefined) => {
    if (!radioStackType) return radioStackType;

    switch (parseInt(String(radioStackType))) {
        case 0x01:
            return "FULL";
        case 0x02:
            return "BLE_HCI";
        case 0x03:
            return "LITE";
        case 0x04:
            return "BLE_BEACON";
        case 0x05:
            return "BLE_BASIC";
        case 0x06:
            return "BLE_FULL_EXT_ADV";
        case 0x07:
            return "BLE_HCI_EXT_ADV";
        case 0x10:
            return "THREAD_FTD";
        case 0x11:
            return "THREAD_MTD";
        case 0x30:
            return "ZIGBEE_FFD";
        case 0x31:
            return "ZIGBEE_RFD";
        case 0x40:
            return "MAC";
        case 0x50:
            return "BLE_THREAD_FTD_STATIC";
        case 0x51:
            return "BLE_THREAD_FTD_DYAMIC";
        case 0x60:
            return "802154_LLD_TESTS";
        case 0x61:
            return "802154_PHY_VALID";
        case 0x62:
            return "BLE_PHY_VALID";
        case 0x63:
            return "BLE_LLD_TESTS";
        case 0x64:
            return "BLE_RLV";
        case 0x65:
            return "802154_RLV";
        case 0x70:
            return "BLE_ZIGBEE_FFD_STATIC";
        case 0x71:
            return "BLE_ZIGBEE_RFD_STATIC";
        case 0x78:
            return "BLE_ZIGBEE_FFD_DYNAMIC";
        case 0x79:
            return "BLE_ZIGBEE_RFD_DYNAMIC";
        case 0x80:
            return "RLV";
        case 0x90:
            return "BLE_MAC_STATIC";
        default:
            return String(radioStackType);
    }
};

export const replaceIssuesAndMentions = (text: string, isBranchRelease = false): string => {
    const a = (href: string, className: string, content: string) =>
        `<a href="${href}" target="_blank" rel="noopener noreferrer" class="${className} font-bold transition-colors duration-100 no-underline hover:underline">${content}</a>`;
    const code = (content: string) => `<code class="font-mono text-yellow-950/90 dark:text-orange-300/90">${content}</code>`;

    let result = text;

    if (isBranchRelease) {
        result = result.replace(/\\n/g, '\n')
            .replace(/(\[`[a-f0-9]{8}`\])/g, '\n$1')
            .replace(/^\n+/, '')
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text, url) =>
                a(url, "hover:underline underline-offset-4 dark:decoration-orange-200/20 decoration-yellow-950/20 hover:decoration-yellow-950/50 hover:dark:decoration-orange-200/40 text-yellow-800/90 dark:text-orange-300/90 hover:text-yellow-700/90 hover:dark:text-yellow-100/90", text)
            )
            .replace(/`([^`]+)`/g, (_, c) => code(c));
    }

    result = result.replace(/(?<![a-zA-Z])@([a-zA-Z0-9_-]+)/g, (_, username) =>
        a(
            `https://github.com/${username}`,
            "text-vp-brand-1 hover:text-vp-brand-2",
            `@${username}`,
        ),
    );

    result = result.replace(/#(\d+)/g, (_, issueNumber) =>
        a(
            `${githubUrl}/issues/${issueNumber}`,
            isBranchRelease ? "text-vp-brand-1 hover:text-vp-brand-2" : "text-vp-alternate-1 hover:text-vp-alternate-2",
            `#${issueNumber}`,
        ),
    );

    return result;
};

export const shortenTimeString = (timeString: string): string => {
    const { tr } = useI18n();

    let result = timeString;
    if (/just now|a few seconds ago/i.test(result)) {
        return tr("time_just_now");
    }

    const timeReplacements: { pat: RegExp; rep: string }[] = [
        { pat: /^an?\s*second\s*ago$/i, rep: `1${tr("time_second_short")}${tr("time_ago")}` },
        { pat: /^an?\s*minute\s*ago$/i, rep: `1${tr("time_minute_short")}${tr("time_ago")}` },
        { pat: /^an?\s*hour\s*ago$/i, rep: `1${tr("time_hour_short")}${tr("time_ago")}` },
        { pat: /^yesterday$/i, rep: `1${tr("time_day_short")}${tr("time_ago")}` },
        { pat: /^last week$/i, rep: `1${tr("time_week_short")}${tr("time_ago")}` },
        { pat: /^last month$/i, rep: `1${tr("time_month_short")}${tr("time_ago")}` },
        { pat: /^last year$/i, rep: `1${tr("time_year_short")}${tr("time_ago")}` },
        { pat: /(\d+)\s*seconds?\s*ago/i, rep: `$1${tr("time_second_short")}${tr("time_ago")}` },
        { pat: /(\d+)\s*minutes?\s*ago/i, rep: `$1${tr("time_minute_short")}${tr("time_ago")}` },
        { pat: /(\d+)\s*hours?\s*ago/i, rep: `$1${tr("time_hour_short")}${tr("time_ago")}` },
        { pat: /(\d+)\s*days?\s*ago/i, rep: `$1${tr("time_day_short")}${tr("time_ago")}` },
        { pat: /(\d+)\s*weeks?\s*ago/i, rep: `$1${tr("time_week_short")}${tr("time_ago")}` },
        { pat: /(\d+)\s*months?\s*ago/i, rep: `$1${tr("time_month_short")}${tr("time_ago")}` },
        { pat: /(\d+)\s*years?\s*ago/i, rep: `$1${tr("time_year_short")}${tr("time_ago")}` },
        { pat: /in\s*(\d+)\s*seconds?/i, rep: `$1${tr("time_second_short")}` },
        { pat: /in\s*(\d+)\s*minutes?/i, rep: `$1${tr("time_minute_short")}` },
        { pat: /in\s*(\d+)\s*hours?/i, rep: `$1${tr("time_hour_short")}` },
        { pat: /in\s*(\d+)\s*days?/i, rep: `$1${tr("time_day_short")}` },
        { pat: /in\s*(\d+)\s*weeks?/i, rep: `$1${tr("time_week_short")}` },
        { pat: /in\s*(\d+)\s*months?/i, rep: `$1${tr("time_month_short")}` },
        { pat: /in\s*(\d+)\s*years?/i, rep: `$1${tr("time_year_short")}` },
    ];

    for (const { pat, rep } of timeReplacements) {
        if (pat.test(result)) {
            result = result.replace(pat, rep);
            break;
        }
    }

    return result;
};

export const downloadFile = (url: string, filename: string = "") => {
    if (typeof document === "undefined") return;
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.target = "_self";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

export async function fetchFirmware(url: string) {
    if (typeof window === "undefined") {
        throw new Error("fetchFirmware is not available during SSR");
    }

    const buffer = await fetch(url, { cache: 'reload' })
        .then(async response => {
            if (response.status >= 400) {
                throw new Error('Failed to fetch resources (' + response.status + ')');
            }

            const contentType = response.headers.get('content-type');
            if (contentType?.includes('text/html')) {
                if (url.startsWith('/')) {
                    throw new Error();
                }
            }

            const buffer = await response.arrayBuffer();
            log.debug(`[Firmware] Downloaded ${buffer.byteLength} bytes`);

            return unpack(buffer);
        });

    return buffer;
}

export async function fetchRegions(): Promise<RegionsData> {
    if (typeof window === "undefined") {
        throw new Error("fetchRegions is not available during SSR");
    }

    return fetch('https://update.flipperzero.one/regions/api/v0/bundle')
        .then((response) => {
            if (response.status >= 400) {
                throw new Error('Failed to fetch region (' + response.status + ')');
            }
            return response.json();
        })
        .then(result => {
            if (result.error) {
                throw new Error(result.error.text);
            } else if (result.success) {
                return result.success;
            }
        });
}

export async function unpack(buffer: ArrayBuffer) {
    if (typeof window === "undefined") {
        throw new Error("unpack is not available during SSR");
    }

    try {
        log.debug(`[Firmware] Unpacking ${buffer.byteLength} byte archive`);
        const ungzipped = pako.ungzip(new Uint8Array(buffer));
        const result = await untar(ungzipped.buffer);
        log.debug(`[Firmware] Extracted ${result.length} files`);
        return result;
    } catch (error) {
        log.error("[Firmware] Unpack failed:", error);
        throw error;
    }
}

export const parseUploadedFileName = (filename: string): string | null => {
    const mntmMatch = filename.match(/(mntm-\d{3})/);
    if (mntmMatch) {
        return `${mntmMatch[1]}`;
    }

    const devMatch = filename.match(/mntm-dev-([a-f0-9]{8})/);
    if (devMatch) {
        return devMatch[1];
    }

    return null;
};

export const getCurrentLocale = (): SupportedLocales => {
    if (typeof window === "undefined") return "en";
    const pathSegments = window.location.pathname.split("/").filter(Boolean);
    const potentialLocale = pathSegments[0];
    const supportedLocales = Object.keys(messages) as SupportedLocales[];
    return supportedLocales.includes(potentialLocale as SupportedLocales) ? (potentialLocale as SupportedLocales) : "en";
};

export const getFirmwareDownloadUrl = (release: ReleaseItem): string | null => {
    if (!release.files) return null;

    for (const file of release.files) {
        // Handle branch files (url, type)
        if (
            "url" in file &&
            file.url &&
            "type" in file &&
            file.type === "update_tgz" &&
            file.url.includes("update-mntm-") &&
            file.url.endsWith(".tgz")
        ) {
            return file.url;
        }

        // Handle mainline/devbuild files (filename)
        if (
            "url" in file &&
            file.url &&
            "filename" in file &&
            file.filename?.includes("update-mntm-") &&
            file.filename?.endsWith(".tgz")
        ) {
            return file.url;
        }

        if (
            "filename" in file &&
            file.filename?.includes("update-mntm-") &&
            file.filename.endsWith(".tgz")
        ) {
            return `https://up.momentum-fw.dev/builds/firmware/dev/${file.filename}`;
        }
    }

    return null;
};

interface ThemeConfig {
    hueRotation: string | null;
    useDarkImage: boolean;
    bgContainer: string | null;
}

type ThemeConfigMap = Record<LogoColor, Record<ScreenColor, ThemeConfig>>;

// prettier-ignore
const THEME_CONFIG: ThemeConfigMap = {
    purp: {
        primary: {  hueRotation: "hue-rotate-[216deg]", useDarkImage: true, bgContainer: "bg-container-primary" },
        secondary: {  hueRotation: null, useDarkImage: true, bgContainer: "bg-container-secondary" },
        default: {  hueRotation: null, useDarkImage: false, bgContainer: null },
        white: {  hueRotation: null, useDarkImage: true, bgContainer: "bg-container-white" },
    },
    orange: {
        primary: {  hueRotation: null, useDarkImage: true, bgContainer: "bg-container-primary" },
        secondary: {  hueRotation: "hue-rotate-[216deg]", useDarkImage: true, bgContainer: "bg-container-secondary" },
        default: {  hueRotation: null, useDarkImage: false, bgContainer: null },
        white: {  hueRotation: null, useDarkImage: true, bgContainer: "bg-container-white" },
    },
    pink: {
        primary: {  hueRotation: "hue-rotate-[310deg]", useDarkImage: true, bgContainer: "bg-container-primary" },
        secondary: {  hueRotation: "hue-rotate-[216deg]", useDarkImage: true, bgContainer: "bg-container-secondary" },
        default: {  hueRotation: null, useDarkImage: false, bgContainer: null },
        white: {  hueRotation: null, useDarkImage: true, bgContainer: "bg-container-white" },
    },
    white: {
        primary: {  hueRotation: null, useDarkImage: true, bgContainer: "bg-container-primary invert" },
        secondary: {  hueRotation: null, useDarkImage: true, bgContainer: "bg-container-secondary" },
        default: {  hueRotation: null, useDarkImage: false, bgContainer: null },
        white: {  hueRotation: null, useDarkImage: true, bgContainer: "bg-container-white" },
    },
    skyline: {
        primary: {  hueRotation: null, useDarkImage: true, bgContainer: "bg-container-primary invert" },
        secondary: {  hueRotation: 'hue-rotate-[93deg]', useDarkImage: true, bgContainer: "bg-container-secondary" },
        default: {  hueRotation: null, useDarkImage: false, bgContainer: null },
        white: {  hueRotation: null, useDarkImage: true, bgContainer: "bg-container-white" },
    },
};

const getThemeConfig = (theme: LogoColor, screenColor: ScreenColor): ThemeConfig => {
    return THEME_CONFIG[theme]?.[screenColor] ?? { 
        hueRotation: null, 
        useDarkImage: false, 
        bgContainer: null 
    };
};

export const getHueRotation = (theme: LogoColor, screenColor: ScreenColor): string | null => {
    return getThemeConfig(theme, screenColor).hueRotation;
};

export const shouldUseDarkImageStyling = (theme: LogoColor, screenColor: ScreenColor): boolean => {
    return getThemeConfig(theme, screenColor).useDarkImage;
};

export const getBgContainerClass = (theme: LogoColor, screenColor: ScreenColor): string | null => {
    return getThemeConfig(theme, screenColor).bgContainer;
};

export const formatFileSize = (bytes: number): string => {
    const kb = bytes / 1024;
    if (kb >= 1024) {
        return `${(kb / 1024).toFixed(1)} MB`;
    }
    return `${kb.toFixed(1)} KB`;
};

export const formatDuration = (milliseconds: number): string => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes > 0) {
        return `<code>${minutes}min</code>, <code>${remainingSeconds}s</code>`;
    } else {
        return `<code>${remainingSeconds}s</code>`;
    }
};

export const stripHtmlFromLogs = (htmlString: string): string => {
    return htmlString
        .replace(/<code>(.*?)<\/code>/g, '$1')
        .replace(/<a[^>]*>(.*?)<\/a>/g, '$1')
        .replace(/<[^>]*>/g, '')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
};

export const replaceIn = (str: string, search: string, replace: string): string => {
    return str.split(search).join(replace);
};