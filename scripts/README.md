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

## Environment Variables

- `SKIP_FETCH=true` - Skip external data fetching (e.g. `bun run dev:skip`)

## Pre-build Process

1. **Fetch Asset Packs** ([`utils.ts`](./utils.ts))
   - Downloads asset pack directory from `https://up.momentum-fw.dev/asset-packs/directory.json`
   - Generates [`_data/packs.ts`](../_data/packs.ts) with asset pack metadata

2. **Fetch Releases** ([`releases.ts`](./releases.ts))
   - Scrapes firmware builds from `https://up.momentum-fw.dev/builds/firmware/`
   - Downloads changelogs from GitHub for each release
   - Generates [`_data/releases.ts`](../_data/releases.ts) with mainline and devbuild data

3. **Generate VitePress Configs** ([`config.ts`](./config.ts))
   - Creates locale-specific VitePress configuration files in `.vitepress/config/`
   - Uses i18n messages to localize navigation, search, and UI elements

4. **Update Build Info** ([`utils.ts`](./utils.ts))
   - Generates [`_data/buildInfo.ts`](../_data/buildInfo.ts) with build timestamp

5. **Patch Dependencies** ([`utils.ts`](./utils.ts))
   - Fixes oh-vue-icons import paths for compatibility
