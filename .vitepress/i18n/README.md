> [!WARNING]
> Localization is currently `"paused"`. The project is small and it's not worth the effort right now to keep everything (wiki for example) up to date for all languages as things change. So please don't bother with the steps below _**for now**_.

This directory contains the internationalization system for the Momentum Firmware website. `i18n` provides UI translations for navigation, buttons, search, and other interface elements across multiple languages.

## Directory Structure

```zig
.vitepress/i18n/
├── index.ts           // Main i18n export with MessageSchema type
└── locales/
    ├── en.ts          // English (primary locale)
    └── {locale}.ts    // Other locales
```

The website uses a two-tier translation system:

1. **UI Translations** (this folder) - Interface strings for navigation, buttons, search, etc.
2. **Content Translations** (manual) - Full page content in `{locale}/` directories

The VitePress configuration files (`.vitepress/config/*.ts` and `.vitepress/config.mts`) are automatically generated during the prebuild step based on the available locales in the i18n folder.

## Adding a New Language

You can add a new language either using the automated script or manually:

### Option 1: Automated Script (Recommended)

Use the automated script to create the initial locale structure:

```elixir
# Create a new locale (e.g., Finnish. Use only two letter language codes: fi, ja, ko, zh, etc.)
bun run newLocale fi
```

This script will:
- Check if the locale already exists and error if it does
- Create the locale file `.vitepress/i18n/locales/{locale}.ts` (copied from English)
- Update the main index file to include the new locale
- Copy all content structure (`index.md`, `update.md`, `asset-packs.md`, `wiki/`, `releases/`)

After running the script, you still need to:
1. Translate the content (see steps 3-6 below)
2. Run `bun run prebuild` to generate the VitePress configuration files

> **Note**: The script will prevent duplicate locale creation by checking both the locale file and the i18n system registration.

### Option 2: Manual Setup

Follow these steps to add a new language manually:

#### Step 1: Create the Locale File

1. Create a new file in [`/locales/`](./locales/) named `{locale-code}.ts`
   - Use [ISO 639-1](https://en.wikipedia.org/wiki/List_of_ISO_639_language_codes) language codes (e.g., `fi.ts` for Finnish)

2. Copy the structure from [`.vitepress/i18n/locales/en.ts`](./locales/en.ts):

```typescript
import type { MessageSchema } from "../index";

const messages: MessageSchema = {
    // Translate all strings here
    site_description: "Your translated description",
    by: "translated 'by'",
    asset_packs: "translated 'Asset Packs'",
    // ... continue with all other keys
};

export default messages;
```

#### Step 2: Update the Main Index File

1. Open [`.vitepress/i18n/index.ts`](./index.ts)
2. Add the import for your new locale:

```typescript
import en from "./locales/en";
import ja from "./locales/ja";
import ko from "./locales/ko";
import zh from "./locales/zh";
import fi from "./locales/fi"; // Add your locale
```

3. Add your locale to the `messages` object:

```typescript
const messages = { en, ko, ja, zh, fi } as const; // Add your locale
```

## Translation Guidelines

Whether you used the automated script or manual setup, follow these guidelines for translating:

### Step 3: Translation Guidelines

#### Special Cases

- **HTML Content**: Some strings contain HTML links - preserve the structure:
  ```typescript
  aside_desc: 'Text with <a href="..." class="...">link</a> more text'
  ```

- **Interpolation**: Some strings use `{{variable}}` placeholders:
  ```typescript
  connection_unable_to_extract_desc: "{{version}} cannot extract packs..."
  ```

### Step 4: Generate VitePress Configuration

After adding UI translations, you need to generate the VitePress configuration:

```elixir
bun run prebuild
```

This will automatically:
- Generate `.vitepress/config/{locale}.ts` for your new locale
- Update `.vitepress/config.mts` to include the new locale
- Create the navigation, search, and other configuration for your locale

### Step 5: Copy Content Structure (Skip if using automated script)

After generating the VitePress configuration, copy the content structure from the English content:

> [!NOTE]
> Without this, someone navigating to the `/fi/update` page for example will see a 404 message, because the markdown files inside the `fi/` directory which are required to load the page components are missing. The entire wiki will also be missing for that locale.

1. New directory `{locale}/` in the project root
2. Copy the structure from the English content:
   ```zig
   {locale}/
   ├── index.md           // Homepage
   ├── releases.md        // Releases page
   ├── update.md          // Update page
   ├── asset-packs.md     // Asset packs page
   ├── releases/          // Release pages
   └── wiki/              // Wiki content
   ```

3. Translate the Markdown content in each file. These files do not use the same keys as the UI strings, so they need to be translated all at once.

### Step 6: Testing

1. Run the development server:
   ```elixir
   bun run dev # or bun run dev:skip if you have already fetched data
   ```

2. Test your language by navigating to `localhost:5173/{locale}/`
3. Verify all UI elements are translated on each page
4. Check for any missing translations (TypeScript will catch these)

## Translation Maintenance

### Adding New Translation Keys

1. Add the new key to the `MessageSchema` interface in [`.vitepress/i18n/index.ts`](./index.ts)
2. Add the English translation to [`.vitepress/i18n/locales/en.ts`](./locales/en.ts)
3. Add translations for all other locales
4. Run `bun run prebuild` to regenerate the VitePress configuration files
5. TypeScript will enforce that all locales include the new key

### Configuration Generation

The VitePress configuration files are automatically generated during the prebuild step:

- `.vitepress/config/{locale}.ts` - Individual locale configurations
- `.vitepress/config.mts` - Main configuration file that imports all locales

This ensures that:
- All available locales are automatically included in the site
- Navigation, search, and other UI elements are properly localized
- No manual configuration file editing is required when adding new locales

## Contributing

When contributing translations:

1. Fork the repository [here](https://github.com/Next-Flip/v2.momentum-fw.dev/fork)
2. Create a new branch for your translation
3. Follow the steps above to add your language
4. Submit a pull request with your changes
