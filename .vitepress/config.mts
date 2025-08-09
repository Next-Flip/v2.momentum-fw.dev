// This file is edited in the prebuild step, do not remove the "LOCALE_*" comments.

import { defineConfig } from "vitepress";
/* LOCALE_IMPORTS_START */
import { rootConfig, rootSearchLocale } from "./config/en";
/* LOCALE_IMPORTS_END */
import { mainlineReleases } from "../_data/releases";

export default defineConfig({
    async transformPageData(pageData) {
        if (pageData.relativePath.startsWith("releases/") && pageData.params?.version) {
            const version = pageData.params.version;
            const isMainline = mainlineReleases.some((r) => r.version === version);

            pageData.title = `${version}`;
            pageData.frontmatter.title = `${version} | Momentum Firmware`;
            pageData.frontmatter.description = `Changelog and downloads for the ${version} ${isMainline ? "release" : "devbuild"}`;
            pageData.frontmatter.ogImage = `/og/${version}.png`;
            pageData.frontmatter.ogUrl = `https://momentum-fw.dev/releases/${version}`;
        }

        return pageData;
    },

    transformHead: ({ pageData }) => {
        const head: Array<[string, Record<string, string>]> = [];

        if (pageData.relativePath.startsWith("releases/") && pageData.params?.version) {
            const version = pageData.params.version;
            const isMainline = mainlineReleases.some((r) => r.version === version);
            const description = `Changelog and downloads for the ${version} ${isMainline ? "release" : "devbuild"}`;
            const ogImage = isMainline ? `/og/${version}.png` : `/og.png`; // TODO: Use either `/og/releases.png` or `/og/devbuild.png`.

            head.push(
                ["meta", { name: "title", content: `${version} | Momentum Firmware` }],
                ["meta", { name: "description", content: description }],
                ["meta", { property: "og:title", content: `${version} | Momentum Firmware` }],
                ["meta", { property: "og:description", content: description }],
                ["meta", { property: "og:image", content: `https://momentum-fw.dev${ogImage}` }],
                [
                    "meta",
                    { property: "og:url", content: `https://momentum-fw.dev/releases/${version}` },
                ],
                ["meta", { name: "twitter:title", content: `${version} | Momentum Firmware` }],
                ["meta", { name: "twitter:description", content: description }],
                ["meta", { name: "twitter:image", content: `https://momentum-fw.dev${ogImage}` }],
            );
        }

        return head;
    },
    markdown: {
        headers: {
            level: [2, 3, 4, 5],
        },
    },
    srcExclude: ["README.md"],
    ignoreDeadLinks: true,
    // title: "Momentum Firmware",
    // description: "Feature-rich, stable and customizable firmware for Flipper Zero",
    locales: {
        /* LOCALE_CONFIGS_START */
        root: rootConfig,
        /* LOCALE_CONFIGS_END */
    } as Parameters<typeof defineConfig>[0]["locales"],
    head: [
        ["link", { rel: "icon", href: "/logos/logo_round.png" }],
        ["link", { rel: "icon", href: "/logos/black.ico" }],
        [
            "meta",
            { name: "theme-color", media: "(prefers-color-scheme: light)", content: "#ffffff" },
        ],
        [
            "meta",
            { name: "theme-color", media: "(prefers-color-scheme: dark)", content: "#0f0f12" },
        ],
        // [
        //     "meta",
        //     {
        //         name: "description",
        //         content: "Feature-rich, stable and customizable firmware for Flipper Zero",
        //     },
        // ],
        [
            "meta",
            {
                name: "keywords",
                content:
                    "Momentum, Momentum Firmware, MNTM, Flipper, Flipper Zero, Firmware, Fork, Custom, Customization, Updater, Asset Packs, Github",
            },
        ],
        ["meta", { name: "license", content: "GPL-3.0" }],
        ["meta", { property: "og:title", content: "Momentum Firmware" }],
        [
            "meta",
            {
                property: "og:description",
                content: "Feature-rich, stable and customizable firmware for Flipper Zero",
            },
        ],
        ["meta", { name: "author", content: "Next-Flip" }],
        ["meta", { property: "og:author", content: "Next-Flip" }],
        [
            "meta",
            {
                property: "og:image",
                content: "https://momentum-fw.dev/og.png",
            },
        ],
        ["meta", { property: "og:url", content: "https://momentum-fw.dev/" }],
        ["meta", { property: "og:type", content: "website" }],
        ["meta", { property: "og:site_name", content: "momentum-fw.dev" }],
        ["meta", { property: "og:locale", content: "en_US" }],
        ["meta", { name: "twitter:creator", content: "@FlipperMomentum" }],
        ["meta", { name: "twitter:card", content: "summary_large_image" }],
        ["meta", { name: "twitter:title", content: "Momentum Firmware" }],
        [
            "meta",
            {
                name: "twitter:description",
                content: "Feature-rich, stable and customizable firmware for Flipper Zero",
            },
        ],
        [
            "meta",
            {
                name: "twitter:image",
                content: "https://momentum-fw.dev/og.png",
            },
        ],
        ["meta", { name: "twitter:alt", content: "Momentum Firmware" }],
        ["meta", { name: "viewport", content: "width=device-width, initial-scale=1.0" }],
        ["link", { rel: "preconnect", href: "https://fonts.googleapis.com" }],
        ["link", { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "" }],
    ],
    sitemap: {
        hostname: "https://momentum-fw.dev",
    },
    vite: {
        define: {
            __VUE_PROD_DEVTOOLS__: false,
            __INTLIFY_PROD_DEVTOOLS__: false,
            __VUE_OPTIONS_API__: true,
            __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false,
            "process.env.NODE_ENV": JSON.stringify("production"),
            global: "globalThis",
        },
        css: {
            preprocessorOptions: {
                css: {
                    charset: false,
                },
            },
        },
        resolve: {
            preserveSymlinks: true,
            alias: {
                "mark.js/src/lib/mark": "mark.js/src/lib/mark.js",
            },
            extensions: [".mjs", ".js", ".ts", ".json"],
        },
        optimizeDeps: {
            include: ["mark.js", "tailwindcss"],
            exclude: ["mark.js/src/vanilla.js", "oh-vue-icons/icons"],
        },
        ssr: {
            noExternal: ["mark.js", "oh-vue-icons", /^oh-vue-icons\/.*/, "protobufjs"],
        },
        server: {
            cors: true,
            proxy: {
                "/api/asset-packs": {
                    target: "https://up.momentum-fw.dev",
                    changeOrigin: true,
                    rewrite: (path) => path.replace(/^\/api\/asset-packs/, "/builds/asset-packs"),
                },
                "/assets": {
                    target: "https://up.momentum-fw.dev",
                    changeOrigin: true,
                    rewrite: (path) => path.replace(/^\/assets/, "/builds/asset-packs"),
                },
            },
        },
        build: {
            chunkSizeWarningLimit: 2000,
            rollupOptions: {
                onwarn: (warning, warn) => {
                    // Suppress eval warnings from protobufjs
                    if (warning.code === "EVAL" && warning.id?.includes("protobufjs")) {
                        return;
                    }
                    warn(warning);
                },
                output: {
                    manualChunks: (id) => {
                        if (id.includes("protobufjs")) {
                            return "protobuf";
                        }
                        if (id.includes("node_modules")) {
                            return "vendor";
                        }
                    },
                },
            },
            commonjsOptions: {
                transformMixedEsModules: true,
            },
        },
    },
    cleanUrls: true,
    lastUpdated: true,
    themeConfig: {
        logo: "/logos/logo_round.png",
        outline: "deep",
        socialLinks: [
            { icon: "x", link: "https://x.com/FlipperMomentum" },
            { icon: "discord", link: "https://discord.gg/momentum" },
            { icon: "github", link: "https://github.com/Next-Flip/Momentum-Firmware" },
        ],
        search: {
            provider: "local",
            options: {
                locales: {
                    /* SEARCH_LOCALES_START */
                    root: rootSearchLocale,
                    /* SEARCH_LOCALES_END */
                },
            },
        },
    },
});
