import * as fs from "node:fs/promises";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { validateLocaleCode } from "./utils.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

async function createLocaleFile(localeCode: string): Promise<void> {
    const sourceFile = path.join(projectRoot, ".vitepress/i18n/locales/en.ts");
    const targetFile = path.join(projectRoot, `.vitepress/i18n/locales/${localeCode}.ts`);
    let content = await fs.readFile(sourceFile, "utf8");
    content = content.replace('config_label: "English"', `config_label: // TODO: Add locale label`);

    await fs.writeFile(targetFile, content, "utf8");
}

async function updateIndexFile(localeCode: string): Promise<void> {
    const indexFile = path.join(projectRoot, ".vitepress/i18n/index.ts");
    let content = await fs.readFile(indexFile, "utf8");
    const importLines = content.split("\n");
    let lastImportIndex = -1;

    for (let i = 0; i < importLines.length; i++) {
        if (importLines[i].match(/^import \w+ from "\.\/locales\/\w+";$/)) {
            lastImportIndex = i;
        }
    }

    if (lastImportIndex !== -1) {
        const newImport = `import ${localeCode} from "./locales/${localeCode}";`;
        importLines.splice(lastImportIndex + 1, 0, newImport);
        content = importLines.join("\n");
    }

    const messagesMatch = content.match(/const messages = \{ ([^}]+) \} as const;/);
    if (messagesMatch) {
        const existingLocales = messagesMatch[1];
        content = content.replace(
            messagesMatch[0],
            `const messages = { ${existingLocales}, ${localeCode} } as const;`,
        );
    }

    await fs.writeFile(indexFile, content, "utf8");
}

async function copyDirectory(src: string, dest: string, fixPaths: boolean = false): Promise<void> {
    await fs.mkdir(dest, { recursive: true });
    const entries = await fs.readdir(src, { withFileTypes: true });

    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            await copyDirectory(srcPath, destPath, fixPaths);
        } else {
            if (fixPaths && entry.name === "[version].paths.ts") {
                let content = await fs.readFile(srcPath, "utf8");
                content = content.replace(
                    'from "../_data/releases"',
                    'from "../../_data/releases"',
                );
                await fs.writeFile(destPath, content, "utf8");
            } else {
                await fs.copyFile(srcPath, destPath);
            }
        }
    }
}

async function copyContentStructure(localeCode: string): Promise<void> {
    const localeDir = path.join(projectRoot, localeCode);
    await fs.mkdir(localeDir, { recursive: true });

    const files = ["index.md", "update.md", "asset-packs.md"];
    for (const file of files) {
        const src = path.join(projectRoot, file);
        const dest = path.join(localeDir, file);
        try {
            await fs.copyFile(src, dest);
        } catch {
            console.warn(`⚠️  Could not copy file ${file}`);
        }
    }

    const dirs = ["releases", "wiki"];
    for (const dir of dirs) {
        const src = path.join(projectRoot, dir);
        const dest = path.join(localeDir, dir);
        try {
            await copyDirectory(src, dest, dir === "releases");
        } catch {
            console.warn(`⚠️  Could not copy dir ${dir}/`);
        }
    }
}

async function localeExists(localeCode: string): Promise<boolean> {
    const localeFile = path.join(projectRoot, `.vitepress/i18n/locales/${localeCode}.ts`);
    try {
        await fs.access(localeFile);
        return true;
    } catch {
        return false;
    }
}

async function createNewLocale(localeCode: string): Promise<void> {
    if (!validateLocaleCode(localeCode)) {
        throw new Error(
            `Invalid locale code: ${localeCode}. Use format like 'fi', not 'en-US' or 'en-GB'`,
        );
    }
    if (await localeExists(localeCode)) {
        throw new Error(`Locale already exists: .vitepress/i18n/locales/${localeCode}.ts`);
    }

    console.log(`Creating locale: ${localeCode}`);
    await createLocaleFile(localeCode);
    console.log(`✓ Created .vitepress/i18n/locales/${localeCode}.ts`);
    await updateIndexFile(localeCode);
    console.log(`✓ Updated .vitepress/i18n/index.ts`);
    await copyContentStructure(localeCode);
    console.log(`✓ Created ${localeCode}/ directory with content`);

    console.log(`\nNext steps:`);
    console.log(`1. Translate strings in .vitepress/i18n/locales/${localeCode}.ts`);
    console.log(`2. Translate content in ${localeCode}/ directory`);
    console.log(`3. Run prebuild to generate VitePress config: bun run prebuild`);
    console.log(`4. Test with: bun run dev`);
    console.log(`5. Visit: http://localhost:5173/${localeCode}/`);
    console.log(`\n⚠️  Important: The prebuild step is required to generate the VitePress configs`);
    console.log(`for your new locale. Without it, the locale won't be available in the site.`);
    console.log(`\n📚 See .vitepress/i18n/README.md for detailed instructions.`);
}

async function main(): Promise<void> {
    const args = process.argv.slice(2);

    if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
        console.log(`Usage: bun run add-locale <locale-code>`);
        console.log(`Example: bun run add-locale fi`);
        process.exit(0);
    }

    const localeCode = args[0].toLowerCase().trim();

    try {
        await createNewLocale(localeCode);
    } catch (error) {
        console.error(`❌ ${error}`);
        process.exit(1);
    }
}

if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}
