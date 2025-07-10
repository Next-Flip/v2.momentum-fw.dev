# Scripts

This directory contains build automation scripts for the Momentum Firmware website. The main entry point is [`prebuild.ts`](./prebuild.ts), which orchestrates the entire build preparation process. The prebuild runs automatically before development and production builds to fetch external data and generate configuration files (it does not need to be run manually).

[`../package.json`](../package.json)

```bash
"scripts": {
    "prebuild": "bun scripts/prebuild.ts",
    # "predev": "bun run prebuild",
    # "dev": "vitepress dev --host 0.0.0.0",
    # "dev:skip": "SKIP_FETCH=true bun run dev",
    # "preview": "vitepress preview --host 0.0.0.0",
    # "build:preview": "bun run build && bun run preview",
    # "preview:skip": "SKIP_FETCH=true bun run build:preview",
    # ...
}
```

## Pre-build Process

1. **Fetch Asset Packs** ([`utils.ts`](./utils.ts))
   - Downloads asset pack directory from `https://up.momentum-fw.dev/asset-packs/directory.json`
   - Generates [`_data/packs.ts`](../_data/packs.ts) with asset pack metadata

2. **Fetch Releases** ([`releases.ts`](./releases.ts))
   - Scrapes firmware builds from `https://up.momentum-fw.dev/builds/firmware/`
   - Downloads changelogs from GitHub for each release
   - Generates [`_data/releases.ts`](../_data/releases.ts) with mainline and devbuild data

3. **Update Locale Links** ([`locales.ts`](./locales.ts))
   - Automatically updates locale navigation links in all wiki index files
   - Reads available locales from i18n config and generates appropriate links

4. **Generate VitePress Configs** ([`config.ts`](./config.ts))
   - Creates locale-specific VitePress configuration files in `.vitepress/config/`
   - Uses i18n messages to localize navigation, search, and UI elements

5. **Update Build Info** ([`utils.ts`](./utils.ts))
   - Generates [`_data/buildInfo.ts`](../_data/buildInfo.ts) with build timestamp

6. **Patch Dependencies** ([`utils.ts`](./utils.ts))
   - Fixes oh-vue-icons import paths for compatibility

## File Overview

- [`prebuild.ts`](./prebuild.ts) - Main orchestrator script
- [`releases.ts`](./releases.ts) - Firmware release data fetching and processing
- [`config.ts`](./config.ts) - VitePress configuration generation for all locales
- [`locales.ts`](./locales.ts) - Automatic locale link updates in wiki files
- [`add-locale.ts`](./add-locale.ts) - Add a new locale (e.g. `bun run add-locale fi`, requires prebuild)
- [`utils.ts`](./utils.ts) - Shared utilities and helper functions

## Environment Variables

- `SKIP_FETCH=true` - Skip external data fetching