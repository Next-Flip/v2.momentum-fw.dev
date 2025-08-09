# v2.momentum-fw.dev

This repository contains the source for the Momentum Firmware website at [momentum-fw.dev](https://momentum-fw.dev). The site is built using VitePress with Vue 3 components and provides multilingual documentation, firmware update capabilities, release changelogs, and asset packs.

## Project Structure

```zig
v2.momentum-fw.dev/
├── .vitepress/          // VitePress configuration and theme
│   ├── theme/           // Vue components and composables
│   ├── config/          // Generated locale-specific configs
│   └── i18n/            // Internationalization messages
├── scripts/             // Build and utility scripts
│   ├── config.ts        // VitePress config generation
│   ├── prebuild.ts      // Pre-build automation
│   ├── releases.ts      // Release data fetching
│   └── utils.ts         // Build utilities
├── wiki/                // Documentation content (`locale/` have their own `wiki/` directory)
├── public/              // Static assets (png, svg, etc.)
└── _data/               // Generated data files created during the build process
```

## Development Setup

##### Prerequisites

- Node.js (v18 or higher)
- [Bun](https://bun.sh/docs/installation) (package manager) (v1.2.2 or higher)

### Installation

1. Clone the repository:
   ```matlab
   git clone https://github.com/Next-Flip/v2.momentum-fw.dev.git
   cd v2.momentum-fw.dev
   ```

2. Install dependencies:
   ```elixir
   bun install
   ```

3. Start the development server:
   ```elixir
   bun run dev
   ```

The development server will be available at `http://localhost:5173`.

> [!NOTE]
> Data fetching (releases and asset packs) is required at least once for certain pages to function. After the initial fetch, you can use `bun run dev:skip` without re-fetching external data.

### Available Commands

```elixir
# Development
bun run dev              # Start development server with data fetching
bun run dev:skip         # Start development server without fetching external data (fetch needs to be run at least once before dev or preview)

# Production
bun run build            # Build for production
bun run preview          # Preview production build
bun run build:skip       # Build without fetching external data (fetch needs to be run at least once before dev or preview)
bun run build:preview    # Build and preview
bun run preview:skip     # Preview production build without fetching external data (fetch needs to be run at least once)

# Maintenance
bun run lint            # Lint components and composables
bun run lint:all        # Lint all project files
bun run pretty          # Format code with Prettier
bun run clean:build     # Clean install and build
```

### Pre-build Process

1. **Pre-build** ([`scripts/prebuild.ts`](scripts/)):
   - `SKIP_FETCH=true` These can be skipped if you're just developing the site and don't need to fetch the latest data.
        - **Asset Packs**: Fetches asset pack directory from `https://up.momentum-fw.dev/asset-packs/directory.json`
        - **Releases**: Scrapes firmware build pages from `https://up.momentum-fw.dev/builds/firmware/` to get mainline releases and devbuilds
   - **Changelogs**: Downloads changelog files from GitHub raw content for each release
   - **Config Generation**: Creates VitePress configuration files for all locales ([`scripts/config.ts`](scripts/config.ts))
   - **Dependencies**: Patches oh-vue-icons imports and updates build metadata ([`scripts/utils.ts`](scripts/utils.ts))

## Credits

- [flipperzero-protobuf](https://github.com/flipperdevices/flipperzero-protobuf)
- [labs.flipper.net](https://github.com/flipperdevices/lab.flipper.net)
- [Momentum-Website](https://github.com/Next-Flip/Momentum-Website)

## Support

If you enjoy the firmware please __**spread the word!**__ And if you really love it, maybe consider donating to the team? :D

- **[Ko-fi](https://ko-fi.com/willyjl)**: One-off or Recurring, No signup required
- **[PayPal](https://paypal.me/willyjl1)**: One-off, Signup required
- **BTC**: `1EnCi1HF8Jw6m2dWSUwHLbCRbVBCQSyDKm`

**Thank you <3**
