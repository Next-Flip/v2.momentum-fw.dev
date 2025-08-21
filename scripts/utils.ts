import { AssetPackEntry, AssetPacksResponse } from ".vitepress/theme/types.ts";
import * as fs from "node:fs/promises";
import { join, resolve } from "node:path";
import { $fetch } from "ofetch";
import path from "path";
import { fileURLToPath } from "url";

const __filename: string = fileURLToPath(import.meta.url);
const __dirname: string = path.dirname(__filename);
export const DIR_DATA = resolve(__dirname, "../_data");
export const HEADER = `// This file is generated in the prebuild step (Must be run before everything. Don't edit it manually.)`;

const iconsIndexPath: string = path.resolve(
    __dirname,
    "../node_modules/oh-vue-icons/icons/index.js",
);

export const jsonToTypeScript = (obj: unknown): string => {
    return JSON.stringify(obj, null, 4).replace(/"([^"]+)":/g, "$1:");
};

export function validateLocaleCode(localeCode: string): boolean {
    return /^[a-z]{2}$/.test(localeCode);
}

export function replaceTemplateSection(
    content: string,
    startComment: string,
    endComment: string,
    replacement: string,
    indent: string = "",
): string {
    const regex = new RegExp(
        `(${startComment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})[\\s\\S]*?(${endComment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
        "g",
    );
    return content.replace(regex, `$1\n${replacement}\n${indent}$2`);
}

export async function getGitCommitHash(): Promise<string> {
    try {
        const { execSync } = await import("node:child_process");
        const commitHash = execSync("git rev-parse --short HEAD", {
            encoding: "utf8",
            cwd: process.cwd(),
        }).trim();
        return commitHash;
    } catch (error) {
        console.warn("❌ Failed to get git commit hash:", error);
        return "";
    }
}

export async function updateBuildInfo(): Promise<void> {
    const now = new Date();
    const timestamp = now.getTime();
    const isoDate = now.toISOString();
    const commitHash = await getGitCommitHash();
    const buildInfoContent = `${HEADER}

export interface BuildInfo {
    timestamp: number;
    date: string;
    commitHash: string;
}

export const buildInfo: BuildInfo = {
    timestamp: ${timestamp},
    date: "${isoDate}",
    commitHash: "${commitHash}"
};
`;

    const buildInfoPath = join(DIR_DATA, "./buildInfo.ts");
    await fs.writeFile(buildInfoPath, buildInfoContent, "utf8");
    console.log(`  Generated buildInfo.ts: ${isoDate} (${commitHash})`);
}

export async function patchVueIcons(): Promise<void> {
    try {
        let content: string = await fs.readFile(iconsIndexPath, "utf8");

        if (content.includes("/index.js")) {
            console.log("  oh-vue-icons was already patched, skipping...");
        } else {
            content = content.replace(
                /from ['"]\.\/([^'"]+)['"]/g,
                function (_match: string, dirName: string): string {
                    return `from './${dirName}/index.js'`;
                },
            );

            await fs.writeFile(iconsIndexPath, content);
            console.log("  Fixed oh-vue-icons directory imports");
        }
    } catch (error) {
        console.error("❌ Error fixing oh-vue-icons:", error);
        throw error;
    }
}

export async function fetchAssetPacks(): Promise<void> {
    try {
        let packs: AssetPackEntry[] = [];

        try {
            const url = "https://up.momentum-fw.dev/asset-packs/directory.json";
            console.log(`  Fetching from: ${url}`);

            const response = await $fetch<AssetPacksResponse>(url, {
                timeout: 15000,
                headers: {
                    "User-Agent": "Momentum-Firmware-Website",
                    Accept: "application/json",
                },
            });

            if (response && response.packs && Array.isArray(response.packs)) {
                packs = response.packs.map((pack) => {
                    const processedPack: AssetPackEntry = {
                        ...pack,
                        author: pack.author || "",
                        source_url: pack.source_url || "",
                        preview_urls: pack.preview_urls || [],
                    };
                    return processedPack;
                });
                console.log(`  Successfully fetched ${packs.length} asset packs from API`);
            } else {
                throw new Error("⁉️ Invalid response format from API");
            }
        } catch (error) {
            console.warn("❌  Failed to fetch from API:", error);
        }

        const packsContent = `${HEADER}

import type { AssetPackEntry } from "../.vitepress/theme/types.ts";

export const packs: AssetPackEntry[] = ${jsonToTypeScript(packs)};
`;

        const packsPath = join(DIR_DATA, "./packs.ts");
        await fs.writeFile(packsPath, packsContent, "utf8");
        console.log(`  Generated packs.ts with ${packs.length} asset packs`);
        await updateCommunityAssetPacksMarkdown(packs);
    } catch (error) {
        console.error("❌ Failed to generate packs data:", error);
        throw error;
    }
}

export async function updateCommunityAssetPacksMarkdown(packs: AssetPackEntry[]): Promise<void> {
    try {
        const markdownPath = resolve(__dirname, "../wiki/Assets/Community-Asset-Packs.md");
        let content = await fs.readFile(markdownPath, "utf8");

        const packEntries = packs
            .map((pack) => {
                const previewUrl =
                    pack.preview_urls && pack.preview_urls.length > 0 ? pack.preview_urls[0] : "";

                const githubUrl =
                    pack.source_url ||
                    `https://github.com/Next-Flip/Asset-Packs/tree/dev/${pack.id}`;

                const dateStr = pack.stats.added
                    ? new Date(pack.stats.added * 1000).toISOString().split("T")[0]
                    : "";

                const statsItems: string[] = [];
                if (typeof pack.stats.packs === "number" && pack.stats.packs > 1) {
                    statsItems.push(`Asset Packs: <b>${pack.stats.packs}</b>`);
                }
                if (pack.stats.anims) {
                    statsItems.push(`Anims: <b>${pack.stats.anims}</b>`);
                }
                if (pack.stats.passport && pack.stats.passport.length > 0) {
                    statsItems.push(`Passports: <b>${pack.stats.passport.length}</b>`);
                }
                if (pack.stats.icons) {
                    statsItems.push(`Icons: <b>${pack.stats.icons}</b>`);
                }
                if (pack.stats.fonts && pack.stats.fonts.length > 0) {
                    statsItems.push(`Fonts: <b>${pack.stats.fonts.length}</b>`);
                }

                const statsLine =
                    statsItems.length > 0
                        ? `<sub><i>${statsItems.join(" &nbsp;&nbsp; ")}</i></sub>`
                        : "";

                return `---

${previewUrl ? `<ScreenColorImage src="${previewUrl}" width="200"/>` : ""}

#### <a href="${githubUrl}">${pack.name}</a>

${pack.description} <a href="https://github.com/${pack.author}" class="pack-author">${pack.author}</a>${dateStr ? ` (${dateStr})` : ""}

${statsLine}`;
            })
            .join("\n\n");

        content = replaceTemplateSection(
            content,
            "<!-- COMMUNITY_PACKS_START -->",
            "<!-- COMMUNITY_PACKS_END -->",
            packEntries,
        );

        await fs.writeFile(markdownPath, content, "utf8");
        console.log(`  Updated Community-Asset-Packs.md with ${packs.length} asset packs`);
    } catch (error) {
        console.error("❌ Failed to update Community Asset Packs markdown:", error);
        throw error;
    }
}
