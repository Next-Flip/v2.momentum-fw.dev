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

export async function updateBuildInfo(): Promise<void> {
    const now = new Date();
    const timestamp = now.getTime();
    const isoDate = now.toISOString();
    const buildInfoContent = `${HEADER}

export interface BuildInfo {
    timestamp: number;
    date: string;
}

export const buildInfo: BuildInfo = {
    timestamp: ${timestamp},
    date: "${isoDate}"
};
`;

    const buildInfoPath = join(DIR_DATA, "./buildInfo.ts");
    await fs.writeFile(buildInfoPath, buildInfoContent, "utf8");
    console.log(`  Generated buildInfo.ts: ${isoDate}`);
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
    } catch (error) {
        console.error("❌ Failed to generate packs data:", error);
        throw error;
    }
}
