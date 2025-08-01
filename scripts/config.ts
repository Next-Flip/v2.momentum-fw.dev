import { promises as fs } from "fs";
import type { MessageSchema, SupportedLocales } from "../.vitepress/i18n/index.ts";
import messages from "../.vitepress/i18n/index.ts";
import type { ReleaseItem } from "./releases.ts";
import { HEADER, jsonToTypeScript, replaceTemplateSection } from "./utils.ts";

const formatDate = (dateString: string): string => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const month = (date.getMonth() + 1).toString();
    const day = date.getDate().toString();
    const year = date.getFullYear().toString().slice(-2);
    return `${month}/${day}/${year}`;
};

function generateConfigContent(
    locale: string,
    m: MessageSchema,
    mainlineItems: ReleaseItem[],
    devbuildsItems: ReleaseItem[],
): string {
    const isRoot = locale === "en";
    const langCode = isRoot ? "en-US" : locale;
    const configName = isRoot ? "rootConfig" : `${locale}Config`;
    const searchConfigName = isRoot ? "rootSearchLocale" : `${locale}SearchLocale`;

    const navMainlineItems = mainlineItems.map((item) => ({
        text: item.commit + ` (${formatDate(item.date)})`,
        link: `${isRoot ? "" : "/" + langCode}/update?version=${item.commit}`,
        activeMatch: `/update?version=${item.commit}`,
    }));
    const navDevbuildsItems = devbuildsItems.slice(0, 1).map((item) => ({
        text: item.commit + ` (${formatDate(item.date)})`,
        link: `${isRoot ? "" : "/" + langCode}/update?version=${item.commit}`,
        activeMatch: `/update?version=${item.commit}`,
    }));

    const wikiOverrides = isRoot
        ? {}
        : {
              general: m.sidebar_general,
              home: m.sidebar_home,
              faq: m.sidebar_faq,
              installation: m.sidebar_installation,
              webUpdater: m.sidebar_web_updater,
              flipperLab: m.sidebar_flipper_lab,
              qflipper: m.sidebar_qflipper,
              zippedArchive: m.sidebar_zipped_archive,
              assetPacks: m.sidebar_asset_packs,
              whatAreAssetPacks: m.sidebar_what_are_asset_packs,
              howToInstallAssetPacks: m.sidebar_how_to_install_asset_packs,
              createYourOwnAssetPacks: m.sidebar_create_your_own_asset_packs,
              communityAssetPacks: m.sidebar_community_asset_packs,
              momentumSettings: m.sidebar_momentum_settings,
          };

    const sidebarImport =
        locale !== "en"
            ? `const ${locale}WikiTranslations: KeyOverrides = ${JSON.stringify(wikiOverrides, null, 4)};

`
            : "";

    const searchLocaleConfig = `export const ${searchConfigName} = {
    translations: {
        button: {
            buttonText: "${m.search_button_text}",
            buttonAriaLabel: "${m.search_button_aria_label}",
        },
        modal: {
            displayDetails: "${m.search_modal_display_details}",
            resetButtonTitle: "${m.search_modal_reset_button_title}",
            backButtonTitle: "${m.search_modal_back_button_title}",
            noResultsText: "${m.search_modal_no_results_text}",
            footer: {
                selectText: "${m.search_modal_footer_select_text}",
                selectKeyAriaLabel: "${m.search_modal_footer_select_key_aria_label}",
                navigateText: "${m.search_modal_footer_navigate_text}",
                navigateUpKeyAriaLabel: "${m.search_modal_footer_navigate_up_key_aria_label}",
                navigateDownKeyAriaLabel: "${m.search_modal_footer_navigate_down_key_aria_label}",
                closeText: "${m.search_modal_footer_close_text}",
                closeKeyAriaLabel: "${m.search_modal_footer_close_key_aria_label}",
            },
        },
    },
};

`;

    const configContent = `${HEADER}

import { ${locale !== "en" ? "KeyOverrides, " : ""}generateSidebars } from "./sidebar";

const editLinkPattern =
    "https://github.com/Next-Flip/v2.momentum-fw.dev/:path";

const MainlineItems = ${jsonToTypeScript(navMainlineItems)};

const DevbuildsItems = ${jsonToTypeScript(navDevbuildsItems)};

const InstallItems = [
    { text: "${m.nav_web_updater}", link: "${isRoot ? "/update" : `/${locale}/update`}" },
    { text: "${m.nav_recent}", items: [...MainlineItems, ...DevbuildsItems] },
    {
        text: "${m.nav_releases}",
        link: "${isRoot ? "/releases" : `/${locale}/releases`}",
    },
];

const SocialLinks = [
    { text: "Github", link: "https://github.com/Next-Flip/Momentum-Firmware" },
    { text: "Discord", link: "https://discord.gg/momentum" },
    { text: "X/Twitter", link: "https://x.com/FlipperMomentum" },
    { text: "Reddit", link: "https://www.reddit.com/r/flippermomentum/" },
];

const ResourcesItems = [
    { items: SocialLinks },
    {
        text: "${m.nav_report_a_bug}",
        link: "https://github.com/Next-Flip/Momentum-Firmware/issues",
    },
    { text: "${m.nav_donate}", link: "https://ko-fi.com/willyjl" },
];

${sidebarImport}${searchLocaleConfig}export const ${configName} = {
    label: "${m.config_label}",
    lang: "${langCode}",
    title: "${m.config_title}",
    description: "${m.config_description}",
    lastUpdated: true,
    themeConfig: {
        outline: { level: "deep", label: "${m.config_outline_label}" },
        darkModeSwitchLabel: "${m.config_dark_mode_switch_label}",
        lightModeSwitchTitle: "${m.config_light_mode_switch_title}",
        darkModeSwitchTitle: "${m.config_dark_mode_switch_title}",
        sidebarMenuLabel: "${m.config_sidebar_menu_label}",
        returnToTopLabel: "${m.config_return_to_top_label}",
        langMenuLabel: "${m.config_lang_menu_label}",
        skipToContentLabel: "${m.config_skip_to_content_label}",
        nav: [
            { text: "${m.install}", items: InstallItems },
            { text: "${m.asset_packs}", link: "${isRoot ? "/asset-packs" : `/${locale}/asset-packs`}" },
            { text: "${m.nav_wiki}", link: "${isRoot ? "/wiki" : `/${locale}/wiki`}", activeMatch: "${isRoot ? "/wiki/" : `/${locale}/wiki/`}" },
            { text: "${m.nav_resources}", items: ResourcesItems },
        ],
        sidebar: generateSidebars(${isRoot ? "undefined" : `"${locale}", ${locale}WikiTranslations`}),
        sitemap: {
            hostname: 'https://v2.momentum-fw.dev'
        },
        editLink: {
            pattern: editLinkPattern,
            text: "${m.config_edit_link_text}",
        },
    },
};
`;

    return configContent;
}

export async function generateConfigs() {
    console.log("  Loading internationalization messages...");
    const locales = Object.keys(messages) as Array<SupportedLocales>;

    if (!locales || locales.length === 0) {
        throw new Error("❌ No locales found in messages");
    }

    console.log(`  Found ${locales.length} locales: ${locales.join(", ")}`);

    const configDir = "./.vitepress/config";
    try {
        await fs.access(configDir);
    } catch {
        throw new Error(`❌ Config directory does not exist: ${configDir}`);
    }

    console.log("  Loading releases data...");
    const releasesModule = await import("../_data/releases.ts");

    if (!releasesModule.recentReleases) {
        throw new Error("❌ No recentReleases found in releases module");
    }

    const { mainline: navMainlineItems, devbuilds: navDevbuildItems } =
        releasesModule.recentReleases;

    console.log(
        `  Using ${navMainlineItems.length} mainline and ${navDevbuildItems?.length || 0} devbuilds for navigation`,
    );

    for (const locale of locales) {
        console.log(`  Generating config for locale: ${locale}`);

        try {
            if (!messages[locale]) {
                throw new Error(`❌ No messages found for locale: ${locale}`);
            }

            const configContent = generateConfigContent(
                locale,
                messages[locale],
                navMainlineItems,
                navDevbuildItems || [],
            );

            if (!configContent || configContent.trim().length === 0) {
                throw new Error(`❌ Generated config content is empty for locale: ${locale}`);
            }

            const filePath = `./.vitepress/config/${locale}.ts`;
            await fs.writeFile(filePath, configContent, "utf8");
            console.log(`    Generated: ${filePath}`);
        } catch (error) {
            console.error(`❌    Failed to generate config for locale ${locale}:`, error);
            throw error;
        }
    }

    console.log("Successfully generated all configs.");
    console.log("  Updating main config.mts...");
    await updateMainConfigTemplate(locales);
    console.log("    Updated: ./.vitepress/config.mts");
}

async function updateMainConfigTemplate(locales: Array<SupportedLocales>) {
    const configPath = "./.vitepress/config.mts";
    let content = await fs.readFile(configPath, "utf8");

    const imports: string[] = [];
    const localeEntries: string[] = [];
    const searchEntries: string[] = [];

    for (const locale of locales) {
        const configName = locale === "en" ? "rootConfig" : `${locale}Config`;
        const searchName = locale === "en" ? "rootSearchLocale" : `${locale}SearchLocale`;
        const localeKey = locale === "en" ? "root" : locale;

        imports.push(`import { ${configName}, ${searchName} } from "./config/${locale}";`);
        localeEntries.push(`        ${localeKey}: ${configName},`);
        searchEntries.push(`                    ${localeKey}: ${searchName},`);
    }

    content = replaceTemplateSection(
        content,
        "/* LOCALE_IMPORTS_START */",
        "/* LOCALE_IMPORTS_END */",
        imports.join("\n"),
    );
    console.log("Imports updated successfully.");
    content = replaceTemplateSection(
        content,
        "/* LOCALE_CONFIGS_START */",
        "/* LOCALE_CONFIGS_END */",
        localeEntries.join("\n"),
        "        ",
    );
    console.log("Locale configurations updated successfully.");
    content = replaceTemplateSection(
        content,
        "/* SEARCH_LOCALES_START */",
        "/* SEARCH_LOCALES_END */",
        searchEntries.join("\n"),
        "                    ",
    );
    console.log("Search locales updated successfully.");

    await fs.writeFile(configPath, content, "utf8");
}
