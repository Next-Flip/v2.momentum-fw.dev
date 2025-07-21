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
                    page: "faq",
                    text: override("Frequently Asked Questions", o, "faq"),
                },
            ],
        },
        {
            text: override("INSTALLATION", o, "installation"),
            items: [
                {
                    page: "installation",
                    text: override("Web Updater (Browser)", o, "webUpdater"),
                },
                {
                    page: "installation#flipper-labapp-browsermobile",
                    text: override("Flipper Lab/App (Mobile)", o, "flipperLab"),
                },
                {
                    page: "installation#qflipper-package-tgz",
                    text: override("qFlipper Package (.tgz)", o, "qflipper"),
                },
                {
                    page: "installation#zipped-archive-zip",
                    text: override("Zipped Archive (.zip)", o, "zippedArchive"),
                },
            ],
        },
        {
            text: override("ASSET PACKS", o, "assetPacks"),
            items: [
                {
                    page: "assets",
                    text: override("What are Asset Packs", o, "whatAreAssetPacks"),
                },
                {
                    page: "assets#how-to-install-asset-packs",
                    text: override("How to install Asset Packs", o, "howToInstallAssetPacks"),
                },
                {
                    page: "assets#create-your-own-asset-packs",
                    text: override("Create your own Asset Packs", o, "createYourOwnAssetPacks"),
                },
                {
                    page: "assets/community-asset-packs",
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
                    page: "interface",
                    collapsed: false,
                    items: [
                        {
                            text: "Graphics",
                            page: "interface/graphics",
                            collapsed: true,
                            items: [
                                {
                                    page: "interface/graphics#asset-pack",
                                    text: "Asset Pack",
                                },
                                {
                                    page: "interface/graphics#animation-settings",
                                    text: "Animation Settings",
                                },
                            ],
                        },
                        {
                            text: "Mainmenu",
                            page: "interface/mainmenu",
                            collapsed: true,
                            items: [
                                {
                                    page: "interface/mainmenu#menu-style",
                                    text: "Menu Style",
                                },
                                {
                                    page: "interface/mainmenu#menu-management",
                                    text: "Menu Management",
                                },
                            ],
                        },
                        {
                            text: "Lockscreen",
                            page: "interface/lockscreen",
                            collapsed: true,
                            items: [
                                {
                                    page: "interface/lockscreen#lock-on-boot",
                                    text: "Security",
                                },
                                {
                                    page: "interface/lockscreen#allow-usb-rpc-while-locked",
                                    text: "RPC Access",
                                },
                                {
                                    page: "interface/lockscreen#lockscreen-elements",
                                    text: "Lockscreen Elements",
                                },
                            ],
                        },
                        {
                            text: "Statusbar",
                            page: "interface/statusbar",
                            collapsed: true,
                            items: [
                                {
                                    page: "interface/statusbar#battery-icon",
                                    text: "Battery Icon",
                                },
                                {
                                    page: "interface/statusbar#show-clock",
                                    text: "Show Clock",
                                },
                                {
                                    page: "interface/statusbar#show-icons",
                                    text: "Show Icons",
                                },
                                {
                                    page: "interface/statusbar#bar-borders",
                                    text: "Bar Borders",
                                },
                                {
                                    page: "interface/statusbar#bar-background",
                                    text: "Bar Background",
                                },
                            ],
                        },
                        {
                            text: "File Browser",
                            page: "interface/file-browser",
                            collapsed: true,
                            items: [
                                {
                                    page: "interface/file-browser#display-options",
                                    text: "Display Options",
                                },
                                {
                                    page: "interface/file-browser#favorite-timeout",
                                    text: "Favorite Timeout",
                                },
                            ],
                        },
                        {
                            text: "General",
                            page: "interface/general",
                            collapsed: true,
                            items: [
                                {
                                    page: "interface/general#text-scroll",
                                    text: "Text Scroll",
                                },
                                {
                                    page: "interface/general#clock-midnight-format",
                                    text: "Clock Midnight Format",
                                },
                                {
                                    page: "interface/general#popup-overlay",
                                    text: "Popup Overlay",
                                },
                            ],
                        },
                    ],
                },
                {
                    text: "Protocols",
                    page: "protocols",
                    collapsed: false,
                    items: [
                        {
                            text: "SubGHz",
                            page: "protocols/subghz",
                            collapsed: true,
                            items: [
                                {
                                    page: "protocols/subghz#subghz-freqs",
                                    text: "SubGHz Freqs",
                                },
                                {
                                    page: "protocols/subghz#bypass-region-lock",
                                    text: "Bypass Region Lock",
                                },
                                {
                                    page: "protocols/subghz#extend-freq-bands",
                                    text: "Extend Freq Bands",
                                },
                                {
                                    page: "protocols/subghz#file-naming-prefix",
                                    text: "File Naming Prefix",
                                },
                            ],
                        },
                        {
                            text: "GPIO Pins",
                            page: "protocols/gpio",
                            collapsed: true,
                            items: [
                                {
                                    page: "protocols/gpio#cc1101-spi",
                                    text: "CC1101 SPI",
                                },
                                {
                                    page: "protocols/gpio#hrf24-spi",
                                    text: "HRF24 SPI",
                                },
                                {
                                    page: "protocols/gpio#esp32-8266-uart",
                                    text: "ESP32/8266 UART",
                                },
                                {
                                    page: "protocols/gpio#nmea-gps-uart",
                                    text: "NMEA GPS UART",
                                },
                            ],
                        },
                    ],
                },
                {
                    text: "Misc",
                    page: "misc",
                    collapsed: false,
                    items: [
                        {
                            text: "Screen",
                            page: "misc/screen",
                            collapsed: true,
                            items: [
                                {
                                    page: "misc/screen#display-mode",
                                    text: "Display Mode",
                                },
                                {
                                    page: "misc/screen#rgb-settings",
                                    text: "RGB Settings",
                                },
                            ],
                        },
                        {
                            text: "Dolphin",
                            page: "misc/dolphin",
                            collapsed: true,
                            items: [
                                {
                                    page: "misc/dolphin#dolphin-level",
                                    text: "Dolphin Level",
                                },
                                {
                                    page: "misc/dolphin#dolphin-xp",
                                    text: "Dolphin XP",
                                },
                                {
                                    page: "misc/dolphin#dolphin-angry",
                                    text: "Dolphin Angry",
                                },
                                {
                                    page: "misc/dolphin#butthurt-timer",
                                    text: "Butthurt Timer",
                                },
                            ],
                        },
                        {
                            text: "Spoofing",
                            page: "misc/spoofing",
                            collapsed: true,
                            items: [
                                {
                                    page: "misc/spoofing#flipper-name",
                                    text: "Flipper Name",
                                },
                                {
                                    page: "misc/spoofing#shell-color",
                                    text: "Shell Color",
                                },
                            ],
                        },
                        {
                            page: "misc/vgm",
                            text: "VGM Options",
                        },
                        {
                            page: "misc/misc#momentum-intro",
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
