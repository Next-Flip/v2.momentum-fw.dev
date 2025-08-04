import { DefaultTheme } from "vitepress";

export interface KeyOverrides {
    [key: string]: string | undefined;
}

interface SidebarItemInput {
    text: string;
    page?: string;
    collapsed?: boolean;
    items?: SidebarItemInput[];
}

const override = (defaultText: string, overrides: KeyOverrides, key: string): string => {
    return overrides[key] ?? defaultText;
};

const generateWikiSidebar = (
    lang: string | undefined,
    o: KeyOverrides = {},
): DefaultTheme.SidebarItem[] => {
    const basePath = lang ? `/${lang}` : "";

    const wikiSections = [
        {
            text: override("GENERAL", o, "general"),
            items: [
                { page: "", text: override("Home", o, "home") },
                {
                    page: "FAQ",
                    text: override("Frequently Asked Questions", o, "faq"),
                },
            ],
        },
        {
            text: override("INSTALLATION", o, "installation"),
            items: [
                {
                    page: "Installation",
                    text: override("Web Updater (Browser)", o, "webUpdater"),
                },
                {
                    page: "Installation#flipper-labapp-browsermobile",
                    text: override("Flipper Lab/App (Mobile)", o, "flipperLab"),
                },
                {
                    page: "Installation#qflipper-package-tgz",
                    text: override("qFlipper Package (.tgz)", o, "qflipper"),
                },
                {
                    page: "Installation#zipped-archive-zip",
                    text: override("Zipped Archive (.zip)", o, "zippedArchive"),
                },
            ],
        },
        {
            text: override("ASSET PACKS", o, "assetPacks"),
            items: [
                {
                    page: "Assets",
                    text: override("What are Asset Packs", o, "whatAreAssetPacks"),
                },
                {
                    page: "Assets#how-to-install-asset-packs",
                    text: override("How to install Asset Packs", o, "howToInstallAssetPacks"),
                },
                {
                    page: "Assets#create-your-own-asset-packs",
                    text: override("Create your own Asset Packs", o, "createYourOwnAssetPacks"),
                },
                {
                    page: "Assets/Community-Asset-Packs",
                    text: override("Community Asset Packs (List)", o, "communityAssetPacks"),
                },
            ],
        },
        {
            text: override("MOMENTUM SETTINGS", o, "momentumSettings"),
            collapsed: false,
            items: [
                {
                    text: "Interface",
                    page: "Interface",
                    collapsed: false,
                    items: [
                        {
                            text: "Graphics",
                            page: "Interface/Graphics",
                            collapsed: true,
                            items: [
                                {
                                    page: "Interface/Graphics#asset-pack",
                                    text: "Asset Pack",
                                },
                                {
                                    page: "Interface/Graphics#animation-settings",
                                    text: "Animation Settings",
                                },
                            ],
                        },
                        {
                            text: "Mainmenu",
                            page: "Interface/Mainmenu",
                            collapsed: true,
                            items: [
                                {
                                    page: "Interface/Mainmenu#menu-style",
                                    text: "Menu Style",
                                },
                                {
                                    page: "Interface/Mainmenu#menu-management",
                                    text: "Menu Management",
                                },
                            ],
                        },
                        {
                            text: "Lockscreen",
                            page: "Interface/Lockscreen",
                            collapsed: true,
                            items: [
                                {
                                    page: "Interface/Lockscreen#lock-on-boot",
                                    text: "Security",
                                },
                                {
                                    page: "Interface/Lockscreen#allow-usb-rpc-while-locked",
                                    text: "RPC Access",
                                },
                                {
                                    page: "Interface/Lockscreen#lockscreen-elements",
                                    text: "Lockscreen Elements",
                                },
                            ],
                        },
                        {
                            text: "Statusbar",
                            page: "Interface/Statusbar",
                            collapsed: true,
                            items: [
                                {
                                    page: "Interface/Statusbar#battery-icon",
                                    text: "Battery Icon",
                                },
                                {
                                    page: "Interface/Statusbar#show-clock",
                                    text: "Show Clock",
                                },
                                {
                                    page: "Interface/Statusbar#show-icons",
                                    text: "Show Icons",
                                },
                                {
                                    page: "Interface/Statusbar#bar-borders",
                                    text: "Bar Borders",
                                },
                                {
                                    page: "Interface/Statusbar#bar-background",
                                    text: "Bar Background",
                                },
                            ],
                        },
                        {
                            text: "File Browser",
                            page: "Interface/File-Browser",
                            collapsed: true,
                            items: [
                                {
                                    page: "Interface/File-Browser#display-options",
                                    text: "Display Options",
                                },
                                {
                                    page: "Interface/File-Browser#favorite-timeout",
                                    text: "Favorite Timeout",
                                },
                            ],
                        },
                        {
                            text: "General",
                            page: "Interface/General",
                            collapsed: true,
                            items: [
                                {
                                    page: "Interface/General#text-scroll",
                                    text: "Text Scroll",
                                },
                                {
                                    page: "Interface/General#clock-midnight-format",
                                    text: "Clock Midnight Format",
                                },
                                {
                                    page: "Interface/General#popup-overlay",
                                    text: "Popup Overlay",
                                },
                            ],
                        },
                    ],
                },
                {
                    text: "Protocols",
                    page: "Protocols",
                    collapsed: false,
                    items: [
                        {
                            text: "SubGHz",
                            page: "Protocols/SubGHz",
                            collapsed: true,
                            items: [
                                {
                                    page: "Protocols/SubGHz#subghz-freqs",
                                    text: "SubGHz Freqs",
                                },
                                {
                                    page: "Protocols/SubGHz#bypass-region-lock",
                                    text: "Bypass Region Lock",
                                },
                                {
                                    page: "Protocols/SubGHz#extend-freq-bands",
                                    text: "Extend Freq Bands",
                                },
                                {
                                    page: "Protocols/SubGHz#file-naming-prefix",
                                    text: "File Naming Prefix",
                                },
                            ],
                        },
                        {
                            text: "GPIO Pins",
                            page: "Protocols/GPIO",
                            collapsed: true,
                            items: [
                                {
                                    page: "Protocols/GPIO#cc1101-spi",
                                    text: "CC1101 SPI",
                                },
                                {
                                    page: "Protocols/GPIO#hrf24-spi",
                                    text: "HRF24 SPI",
                                },
                                {
                                    page: "Protocols/GPIO#esp32-8266-uart",
                                    text: "ESP32/8266 UART",
                                },
                                {
                                    page: "Protocols/GPIO#nmea-gps-uart",
                                    text: "NMEA GPS UART",
                                },
                            ],
                        },
                    ],
                },
                {
                    text: "Misc",
                    page: "Misc",
                    collapsed: false,
                    items: [
                        {
                            text: "Screen",
                            page: "Misc/Screen",
                            collapsed: true,
                            items: [
                                {
                                    page: "Misc/Screen#display-mode",
                                    text: "Display Mode",
                                },
                                {
                                    page: "Misc/Screen#rgb-settings",
                                    text: "RGB Settings",
                                },
                            ],
                        },
                        {
                            text: "Dolphin",
                            page: "Misc/Dolphin",
                            collapsed: true,
                            items: [
                                {
                                    page: "Misc/Dolphin#dolphin-level",
                                    text: "Dolphin Level",
                                },
                                {
                                    page: "Misc/Dolphin#dolphin-xp",
                                    text: "Dolphin XP",
                                },
                                {
                                    page: "Misc/Dolphin#dolphin-angry",
                                    text: "Dolphin Angry",
                                },
                                {
                                    page: "Misc/Dolphin#butthurt-timer",
                                    text: "Butthurt Timer",
                                },
                            ],
                        },
                        {
                            text: "Spoofing",
                            page: "Misc/Spoofing",
                            collapsed: true,
                            items: [
                                {
                                    page: "Misc/Spoofing#flipper-name",
                                    text: "Flipper Name",
                                },
                                {
                                    page: "Misc/Spoofing#shell-color",
                                    text: "Shell Color",
                                },
                            ],
                        },
                        {
                            page: "Misc/VGM",
                            text: "VGM Options",
                        },
                        {
                            page: "Misc/index#momentum-intro",
                            text: "Momentum Intro",
                        },
                    ],
                },
            ],
        },
    ];

    const processItems = (items: SidebarItemInput[]) => {
        return items.map((item) => {
            const result: DefaultTheme.SidebarItem = {
                text: item.text,
            };

            if (item.page !== undefined) {
                result.link = `${basePath}/wiki/${item.page}`;
            }

            if (item.collapsed !== undefined) {
                result.collapsed = item.collapsed;
            }

            if (item.items) {
                result.items = processItems(item.items);
            }

            return result;
        });
    };

    return wikiSections.map((section) => ({
        text: section.text,
        collapsed: section.collapsed,
        items: processItems(section.items),
    }));
};

export const generateSidebars = (
    lang: string | undefined,
    o: KeyOverrides = {},
): DefaultTheme.Sidebar => {
    const basePath = lang ? `/${lang}` : "";

    return {
        [`${basePath}/wiki/`]: generateWikiSidebar(lang, o),
    };
};
