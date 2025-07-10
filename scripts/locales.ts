import * as fs from "node:fs/promises";
import messages, { SupportedLocales } from "../.vitepress/i18n/index.ts";
import { replaceTemplateSection } from "./utils.ts";

export function generateLocaleLinks(basePath: string = ""): string {
    const locales = Object.keys(messages) as Array<SupportedLocales>;
    const localeLinks: string[] = [];

    for (const locale of locales) {
        const localeMessages = messages[locale];
        const localeLabel = localeMessages.config_label;

        localeLinks.push(`[${localeLabel}](${locale === "en" ? "" : `/${locale}`}${basePath})`);
    }

    return localeLinks.join(" · ");
}

async function updateMarkdown(filePath: string, localeLinks: string): Promise<void> {
    try {
        const content = await fs.readFile(filePath, "utf8");
        const updatedContent = replaceTemplateSection(
            content,
            "<!-- LOCALE_LINKS_START -->",
            "<!-- LOCALE_LINKS_END -->",
            localeLinks,
        );

        if (content !== updatedContent) {
            await fs.writeFile(filePath, updatedContent, "utf8");
            console.log(`  Updated locale links in: ${filePath}`);
        } else {
            console.log(`  No changes needed for: ${filePath}`);
        }
    } catch (error) {
        console.error(`❌ Error updating ${filePath}:`, error);
        throw error;
    }
}

export async function updateLocaleLinks(): Promise<void> {
    const localeLinks = generateLocaleLinks("/wiki");
    const locales = Object.keys(messages) as Array<SupportedLocales>;
    const fileCheckPromises = locales.map(async (locale) => {
        const filePath = locale === "en" ? "wiki/index.md" : `${locale}/wiki/index.md`;
        try {
            await fs.access(filePath);
            return filePath;
        } catch {
            return null;
        }
    });

    const filesToUpdate = (await Promise.all(fileCheckPromises)).filter(
        (path): path is string => path !== null,
    );

    console.log(`  Found ${filesToUpdate.length} wiki index files to update.`);
    const updatePromises = filesToUpdate.map((filePath) => updateMarkdown(filePath, localeLinks));
    await Promise.all(updatePromises);
    console.log("Successfully updated locale links in all wiki index files.");
}
