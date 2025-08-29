import { parse } from "node-html-parser";
import { promises as fs } from "node:fs";
import { ofetch } from "ofetch";
import { join } from "path";
import { DIR_DATA, HEADER, jsonToTypeScript } from "./utils";

interface FirmwareFile {
    url: string;
    target: string;
    type: string;
    sha256: string;
}

interface DevbuildFile {
    filename: string;
    size: string;
}

export interface ReleaseItem {
    version: string;
    branch?: string;
    date?: string;
    commit?: string;
    timestamp?: number;
    changelog?: string;
    files?: FirmwareFile[] | DevbuildFile[] | MainlineFile[];
}

interface MainlineFile {
    filename: string;
    size: string;
    url: string;
}

interface MainlineRelease {
    version: string;
    date: string;
    timestamp: number;
    files: MainlineFile[];
}

interface FirmwareChannel {
    id: string;
    title: string;
    description: string;
    versions: ReleaseItem[];
}

interface FirmwareDirectory {
    channels: FirmwareChannel[];
}

function parseDateString(dateStr: string): number {
    const months: Record<string, number> = {
        Jan: 0,
        Feb: 1,
        Mar: 2,
        Apr: 3,
        May: 4,
        Jun: 5,
        Jul: 6,
        Aug: 7,
        Sep: 8,
        Oct: 9,
        Nov: 10,
        Dec: 11,
    };

    const parts = dateStr.split(/[\s-:]/);
    if (parts.length >= 4) {
        const year = parseInt(parts[0]);
        const month = months[parts[1]];
        const day = parseInt(parts[2]);
        const hour = parseInt(parts[3]) || 0;
        const minute = parseInt(parts[4]) || 0;

        return Date.UTC(year, month, day, hour, minute) / 1000;
    }
    return 0;
}

async function fetchFirmwareDirectory(): Promise<FirmwareDirectory> {
    try {
        const data: FirmwareDirectory = await ofetch(
            "https://up.momentum-fw.dev/firmware/directory.json",
            {
                timeout: 15000,
                headers: {
                    "User-Agent": "Momentum-Firmware-Website",
                },
            },
        );

        if (!data || !data.channels || !Array.isArray(data.channels)) {
            throw new Error("❌ Invalid firmware directory structure received");
        }

        console.log(
            `  Successfully fetched firmware directory with ${data.channels.length} channels`,
        );
        return data;
    } catch (error) {
        console.error("❌  Failed to fetch firmware directory:", error);
        throw error;
    }
}

async function fetchChangelogForVersion(version: string): Promise<string> {
    console.log(`  Fetching changelog for ${version}...`);

    try {
        const localChangelogVersions = ["mntm-004", "mntm-003", "mntm-002", "mntm-001"];
        if (localChangelogVersions.includes(version)) {
            try {
                const changelogPath = join(DIR_DATA, `changelogs/${version}.txt`);
                const changelog = await fs.readFile(changelogPath, "utf8");
                console.log(
                    `  Successfully loaded local changelog for ${version} (${changelog.length} characters)`,
                );
                return changelog.replace(/\r/g, "");
            } catch (error) {
                console.warn(`⁉️  Failed to load local changelog for ${version}:`, error);
                return "";
            }
        }

        const isMainlineVersion = version.startsWith("mntm-");
        const url = isMainlineVersion
            ? `https://raw.githubusercontent.com/Next-Flip/Momentum-Firmware/refs/tags/${version}/CHANGELOG.md`
            : `https://raw.githubusercontent.com/Next-Flip/Momentum-Firmware/${version}/CHANGELOG.md`;
        const changelog: string = await ofetch(url, {
            parseResponse: (txt) => txt,
            timeout: 10000,
            headers: {
                "User-Agent": "Momentum-Firmware-Website",
            },
        });

        if (!changelog || typeof changelog !== "string") {
            console.warn(`⁉️  Empty or invalid changelog received for ${version}`);
            return "";
        }

        console.log(
            `  Successfully fetched changelog for ${version} (${changelog.length} characters)`,
        );
        return changelog.replace(/\n/g, "\n").replace(/\r/g, "");
    } catch (error) {
        console.warn(`⁉️  Failed to fetch changelog for ${version}:`, error);
        return "";
    }
}

async function parseMainFirmwareBuildsHTML(): Promise<{
    mainlineVersions: string[];
    hasDevBuilds: boolean;
}> {
    console.log("  Parsing main firmware builds...");

    try {
        let html: string;

        try {
            console.log("    Fetching main firmware builds from remote URL...");
            html = await ofetch("https://up.momentum-fw.dev/builds/firmware/", {
                parseResponse: (txt) => txt,
                timeout: 15000,
                headers: {
                    "User-Agent": "Momentum-Firmware-Website",
                },
            });
            console.log("    Successfully fetched main firmware builds HTML");
        } catch (error) {
            console.error("❌  Failed to fetch main firmware builds HTML:", error);
            throw error;
        }

        if (!html || typeof html !== "string") {
            throw new Error("❌ Invalid HTML content received");
        }

        const root = parse(html);
        const tbody = root.querySelector("#list tbody");

        if (!tbody) {
            throw new Error("❌ Could not find table body in HTML");
        }

        const mainlineVersions: string[] = [];
        let hasDevBuilds = false;
        const rows = tbody.querySelectorAll("tr");

        console.log(`    Processing ${rows.length} rows from main firmware builds table...`);

        rows.forEach((row) => {
            const linkCell = row.querySelector("td.link");
            if (!linkCell) return;

            const link = linkCell.querySelector("a");
            if (!link) return;

            const href = link.getAttribute("href");
            if (!href || href === "../") return;

            if (href === "dev/") {
                hasDevBuilds = true;
            } else if (href.startsWith("mntm-") && href.endsWith("/")) {
                const version = href.slice(0, -1);
                mainlineVersions.push(version);
            }
        });

        mainlineVersions.sort((a, b) => {
            const aNum = parseInt(a.replace("mntm-", ""));
            const bNum = parseInt(b.replace("mntm-", ""));
            return bNum - aNum;
        });

        console.log(
            `    Found ${mainlineVersions.length} mainline versions: ${mainlineVersions.join(", ")}`,
        );
        console.log(`    Dev builds available: ${hasDevBuilds}`);

        return { mainlineVersions, hasDevBuilds };
    } catch (error) {
        console.error("❌  Failed to parse main firmware builds HTML:", error);
        throw error;
    }
}

async function parseMainlineReleaseHTML(version: string): Promise<MainlineRelease> {
    console.log(`  Parsing mainline release ${version}...`);

    try {
        let html: string;

        try {
            const url = `https://up.momentum-fw.dev/builds/firmware/${version}/`;
            html = await ofetch(url, {
                parseResponse: (txt) => txt,
                timeout: 15000,
                headers: {
                    "User-Agent": "Momentum-Firmware-Website",
                },
            });
            console.log(`    Successfully fetched ${version} HTML`);
        } catch (error) {
            console.error(`❌  Failed to fetch ${version} HTML:`, error);
            throw error;
        }

        if (!html || typeof html !== "string") {
            throw new Error("❌ Invalid HTML content received");
        }

        const root = parse(html);
        const tbody = root.querySelector("#list tbody");

        if (!tbody) {
            throw new Error("❌ Could not find table body in HTML");
        }

        const files: MainlineFile[] = [];
        const rows = tbody.querySelectorAll("tr");
        let releaseDate = "";
        let timestamp = 0;

        console.log(`    Processing ${rows.length} rows from ${version} table...`);

        rows.forEach((row) => {
            const linkCell = row.querySelector("td.link");
            const sizeCell = row.querySelector("td.size");
            const dateCell = row.querySelector("td.date");

            if (!linkCell || !sizeCell || !dateCell) return;
            const link = linkCell.querySelector("a");
            if (!link) return;

            const href = link.getAttribute("href");
            const filename = link.text?.trim();
            const size = sizeCell.text?.trim();
            const date = dateCell.text?.trim();

            if (!href || !filename || href === "../" || !filename.includes(version)) {
                return;
            }

            if (!releaseDate && date) {
                releaseDate = date;
                timestamp = parseDateString(date);
            }

            files.push({
                filename,
                size: size || "",
                url: `https://up.momentum-fw.dev/builds/firmware/${version}/${filename}`,
            });
        });

        const isoDate = timestamp > 0 ? new Date(timestamp * 1000).toISOString().split("T")[0] : "";

        console.log(`    Found ${files.length} files for ${version}, date: ${isoDate}`);

        return {
            version,
            date: isoDate,
            timestamp,
            files,
        };
    } catch (error) {
        console.error(`❌  Failed to parse ${version} HTML:`, error);
        throw error;
    }
}

async function parseDevbuildsHTML(): Promise<{
    commitGroups: Record<string, DevbuildFile[]>;
    commitTimestamps: Record<string, number>;
}> {
    console.log("  Parsing devbuilds...");

    try {
        let html: string;

        try {
            console.log("    Fetching firmware builds from remote URL...");
            html = await ofetch("https://up.momentum-fw.dev/builds/firmware/dev/", {
                parseResponse: (txt) => txt,
                timeout: 15000,
                headers: {
                    "User-Agent": "Momentum-Firmware-Website",
                },
            });
            console.log("    Successfully fetched firmware builds HTML");
        } catch (error) {
            console.error("❌  Failed to fetch firmware builds HTML:", error);
            throw error;
        }

        if (!html || typeof html !== "string") {
            throw new Error("❌ Invalid HTML content received");
        }

        const root = parse(html);
        const tbody = root.querySelector("#list tbody");

        if (!tbody) {
            throw new Error("❌ Could not find table body in HTML");
        }

        const files: (DevbuildFile & { commit: string; date: string })[] = [];
        const rows = tbody.querySelectorAll("tr");

        console.log(`    Processing ${rows.length} rows from devbuilds table...`);

        rows.forEach((row) => {
            const linkCell = row.querySelector("td.link");
            const sizeCell = row.querySelector("td.size");
            const dateCell = row.querySelector("td.date");

            if (!linkCell || !sizeCell || !dateCell) return;
            const link = linkCell.querySelector("a");
            if (!link) return;

            const href = link.getAttribute("href");
            const filename = link.text?.trim();
            const size = sizeCell.text?.trim();
            const date = dateCell.text?.trim();

            if (!href || !filename || href === "../" || !filename.includes("mntm-dev-")) {
                return;
            }

            const commitMatch = filename.match(/mntm-dev-([a-f0-9]+)\./);
            if (!commitMatch) return;
            const commit = commitMatch[1];

            files.push({
                filename,
                size: size || "",
                commit,
                date: date || "",
            });
        });

        const commitGroups: Record<string, DevbuildFile[]> = {};
        const commitTimestamps: Record<string, number> = {};

        files.forEach((file) => {
            if (!commitGroups[file.commit]) {
                commitGroups[file.commit] = [];
                const date = parseDateString(file.date);
                commitTimestamps[file.commit] = date;
            }
            commitGroups[file.commit].push({
                filename: file.filename,
                size: file.size,
            });
        });

        console.log(`    Found ${Object.keys(commitGroups).length} unique commits`);

        return { commitGroups, commitTimestamps };
    } catch (error) {
        console.error("❌  Failed to parse devbuilds HTML:", error);
        throw error;
    }
}

export async function getReleaseAndDevbuilds() {
    try {
        const { mainlineVersions, hasDevBuilds } = await parseMainFirmwareBuildsHTML();

        if (mainlineVersions.length === 0) {
            throw new Error("❌ No mainline versions found");
        }

        const mainlineReleases: MainlineRelease[] = [];
        for (const version of mainlineVersions) {
            try {
                const release = await parseMainlineReleaseHTML(version);
                mainlineReleases.push(release);
            } catch (error) {
                console.warn(`⁉️  Failed to parse ${version}, skipping:`, error);
            }
        }

        console.log(`  Successfully processed ${mainlineReleases.length} mainline releases`);

        const devbuildItems: ReleaseItem[] = [];
        const seenVersions = new Set<string>();

        if (hasDevBuilds) {
            const { commitGroups, commitTimestamps } = await parseDevbuildsHTML();

            if (commitGroups && Object.keys(commitGroups).length > 0) {
                const validCommits = Object.entries(commitGroups)
                    .filter(([_commit, files]) => files.length === 6)
                    .sort(([a], [b]) => commitTimestamps[b] - commitTimestamps[a]);

                console.log(
                    `  Found ${validCommits.length} valid devbuild commits (filtered from ${Object.keys(commitGroups).length} total)`,
                );

                for (const [commit, groupFiles] of validCommits) {
                    if (seenVersions.has(commit)) {
                        console.log(`  Skipping duplicate devbuild version ${commit}`);
                        continue;
                    }
                    seenVersions.add(commit);

                    const timestamp = commitTimestamps[commit];
                    const isoDate = new Date(timestamp * 1000).toISOString().split("T")[0];
                    const changelog = await fetchChangelogForVersion(commit);

                    devbuildItems.push({
                        version: commit,
                        branch: "mntm-dev",
                        date: isoDate,
                        commit: commit,
                        timestamp: timestamp,
                        changelog: changelog,
                        files: groupFiles,
                    });
                }

                console.log(`  Successfully processed ${devbuildItems.length} devbuilds`);
            }
        }

        const mainlineItems: ReleaseItem[] = [];
        for (const release of mainlineReleases) {
            const changelog = await fetchChangelogForVersion(release.version);

            if (!seenVersions.has(release.version)) {
                seenVersions.add(release.version);

                mainlineItems.push({
                    version: release.version,
                    branch: release.version,
                    date: release.date,
                    timestamp: release.timestamp,
                    changelog: changelog,
                    files: release.files,
                });
            } else {
                console.log(`  Skipping duplicate mainline version ${release.version}`);
            }
        }

        return {
            mainlineItems,
            devbuildItems,
        };
    } catch (error) {
        console.error("❌ Failed to get release and devbuilds data:", error);
        throw error;
    }
}

async function getExtraBranches(
    excludeBranches?: string[],
): Promise<{ branchItems: ReleaseItem[] }> {
    try {
        const directory = await fetchFirmwareDirectory();
        const branches = directory.channels.filter(
            (branch) => !excludeBranches?.includes(branch.id),
        );

        const branchItems: ReleaseItem[] = [];
        for (const branch of branches) {
            const branchItem: ReleaseItem = {
                // NOTE: yes these are backwards, makes things simpler in the updater controls
                version: branch.id.replace("wip-", ""),
                branch: branch.versions[0].version,
                timestamp: branch.versions[0].timestamp,
                changelog: branch.versions[0].changelog,
                files: branch.versions[0].files,
            };
            branchItems.push(branchItem);
        }
        branchItems.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

        console.log(
            `  Found ${branchItems.length} extra branches: ${branchItems.map((item) => item.version).join(", ")}`,
        );

        return { branchItems };
    } catch (error) {
        console.error("❌ Failed to get extra branches:", error);
        throw error;
    }
}

async function updateReleases(
    mainlineItems: ReleaseItem[],
    devbuildItems: ReleaseItem[],
    branchItems: ReleaseItem[],
): Promise<void> {
    console.log("Updating releases...");

    try {
        if (!mainlineItems || mainlineItems.length === 0) {
            throw new Error("❌ No mainline items provided for releases update");
        }

        console.log(
            `  Processing ${mainlineItems.length} mainline items and ${devbuildItems.length} devbuild items`,
        );

        const releasesContent = `${HEADER}

export type ReleaseChannel = "mainline" | "devbuild" | "branch";

export interface FirmwareFile {
    url: string;
    target: string;
    type: string;
    sha256: string;
}

export interface DevbuildFile {
    filename: string;
    size: string;
}

export interface MainlineFile {
    filename: string;
    size: string;
    url: string;
}

export interface ReleaseItem {
    version: string;
    branch?: string;
    date?: string;
    commit?: string;
    timestamp?: number;
    changelog?: string;
    files?: FirmwareFile[] | DevbuildFile[] | MainlineFile[];
}

export const mainlineReleases: ReleaseItem[] = ${jsonToTypeScript(mainlineItems)};

export const devbuildReleases: ReleaseItem[] = ${jsonToTypeScript(devbuildItems)};

export const branchReleases: ReleaseItem[] = ${jsonToTypeScript(branchItems)};

// Filter releases for navigation: only latest mainline + recent devbuilds
export function getRecentReleases() {
    const latestMainline = mainlineReleases.length > 0 ? mainlineReleases[0] : null;
    const recentDevbuilds = devbuildReleases.slice(0, 4);

    const recentMainlineItems = latestMainline ? [latestMainline] : [];

    return {
        mainline: recentMainlineItems,
        devbuilds: recentDevbuilds,
    };
}

export const recentReleases = getRecentReleases();

export const getReleaseByVersion = (version: string) => {
    return [...mainlineReleases, ...devbuildReleases, ...branchReleases].find(
        (release) => release.version === version,
    );
};
`;

        const releasesPath = join(DIR_DATA, "./releases.ts");
        await fs.writeFile(releasesPath, releasesContent, "utf8");
        console.log("  Generated: _data/releases.ts");
    } catch (error) {
        console.error("❌ Failed to update releases data:", error);
        throw error;
    }
}

export async function fetchReleases() {
    const { mainlineItems, devbuildItems } = await getReleaseAndDevbuilds();

    if (!mainlineItems || !Array.isArray(mainlineItems) || mainlineItems.length === 0) {
        throw new Error("❌ No mainline items received from getReleaseAndDevbuilds");
    }
    if (!devbuildItems || !Array.isArray(devbuildItems)) {
        throw new Error("❌ Invalid devbuild items received from getReleaseAndDevbuilds");
    }

    console.log(`  Received ${mainlineItems.length} mainline releases`);
    console.log(`  Received ${devbuildItems.length} devbuild items`);

    // TODO: uncomment this to include extra branches
    // const { branchItems } = await getExtraBranches(["development", "release"]);

    await updateReleases(mainlineItems, devbuildItems, []);

    console.log("Releases generated successfully");
}
