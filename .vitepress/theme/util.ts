import { useI18n } from "./composables/useI18n";

export function devMode() {
    if (typeof window === "undefined") return false;
    const host = window.location.hostname;
    return host === "localhost" || host === "127.0.0.1";
}

export const scrollToTop = (behavior: ScrollBehavior = "instant") => {
    window.scrollTo({ top: 0, left: 0, behavior });
};

export const isExternalLink = (url: string) => {
    return url.startsWith("http");
};

export const formatDate = (dateString: string): string => {
    if (!dateString) return "";

    const date = new Date(dateString);
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const year = date.getFullYear().toString().slice(-2);

    return `${month}/${day}/${year}`;
};

const ensureDate = (dateInput: number) => {
    if (!dateInput) return null;
    if (typeof dateInput === "number") return new Date(dateInput * 1000);
    return new Date(dateInput);
};

export const formatFullDate = (dateInput: number) => {
    const date = ensureDate(dateInput);
    if (!date) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}/${month}/${day}`;
};

export const formatDisplayDate = (dateInput: number) => {
    const date = ensureDate(dateInput);
    if (!date) return "";
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 1) return "today";
    if (diffDays < 2) return "yesterday";
    if (diffDays < 30) return `${diffDays} days ago`;

    if (date.getFullYear() !== now.getFullYear()) {
        return formatFullDate(dateInput);
    }

    const month = date.toLocaleString("default", { month: "short" });
    const day = date.getDate();
    return `${month} ${day}`;
};

export const formatMonthDay = (dateInput: number) => {
    const date = ensureDate(dateInput);
    if (!date) return { month: "", day: 0, year: 0, isCurrentYear: false };

    const now = new Date();
    const currentYear = now.getFullYear();
    const dateYear = date.getFullYear();

    return {
        month: date.toLocaleString("default", { month: "short" }).toLowerCase(),
        day: date.getDate(),
        year: dateYear,
        isCurrentYear: dateYear === currentYear,
    };
};

export const bytesToSize = (bytes: number) => {
    const sizes = ["Bytes", "KiB", "MiB", "GiB", "TiB"];
    if (bytes === 0) return "n/a";
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    if (i === 0) return `${bytes} ${sizes[i]})`;
    return `${(bytes / 1024 ** i).toFixed(1)}${sizes[i]}`;
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

export const replaceIssuesAndMentions = (text: string): string => {
    const a = (href: string, className: string, content: string) =>
        `<a href="${href}" target="_blank" rel="noopener noreferrer" class="${className} font-bold transition-colors duration-200">${content}</a>`;

    let result = text.replace(/(?<![a-zA-Z])@([a-zA-Z0-9_-]+)/g, (_, username) =>
        a(
            `https://github.com/${username}`,
            "text-vp-brand-1 hover:text-vp-brand-2",
            `@${username}`,
        ),
    );

    result = result.replace(/#(\d+)/g, (_, issueNumber) =>
        a(
            `https://github.com/Next-Flip/Momentum-Firmware/issues/${issueNumber}`,
            "text-mntm-yellow-1 hover:text-mntm-yellow-2",
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
        { pat: /^yesterday$/i, rep: tr("time_yesterday") },
        { pat: /^last week$/i, rep: tr("time_last_week") },
        { pat: /^last month$/i, rep: tr("time_last_month") },
        { pat: /^last year$/i, rep: tr("time_last_year") },
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

export const downloadFile = (url: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = "";
    link.target = "_self";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
