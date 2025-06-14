import { defineConfig } from "vitepress";
import { rootConfig, rootSearchLocale } from "./config/en";
import { jaConfig, jaSearchLocale } from "./config/ja";
import { koConfig, koSearchLocale } from "./config/ko";
import { zhConfig, zhSearchLocale } from "./config/zh";

export default defineConfig({
    markdown: {
        headers: {
            level: [2, 3, 4, 5],
        },
    },
    ignoreDeadLinks: true,
    title: "Momentum Firmware",
    description: "Feature-rich, stable and customizable firmware for Flipper Zero",
    locales: {
        root: rootConfig,
        ko: koConfig,
        ja: jaConfig,
        zh: zhConfig,
    } as any,
    head: [
        ["link", { rel: "icon", href: "/logos/black_round.png" }],
        ["link", { rel: "icon", href: "/logos/black.ico" }],
        ["meta", { property: "og:title", content: "Momentum FW for Flipper Zero" }],
        [
            "meta",
            {
                property: "og:description",
                content: "Feature-rich, stable and customizable firmware for Flipper Zero",
            },
        ],
        ["meta", { property: "og:author", content: "Next-Flip" }],
        [
            "meta",
            {
                property: "og:image",
                content: "https://v2.momentum-fw.dev/og.png",
            },
        ],
        ["meta", { property: "og:url", content: "https://v2.momentum-fw.dev/" }],
        ["meta", { property: "og:type", content: "website" }],
        ["meta", { property: "og:site_name", content: "v2.momentum-fw.dev" }],
        ["meta", { property: "og:locale", content: "en_US" }],
        ["meta", { name: "twitter:card", content: "summary_large_image" }],
        ["meta", { name: "twitter:title", content: "Momentum FW for Flipper Zero" }],
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
                content: "https://v2.momentum-fw.dev/og.png",
            },
        ],
        ["meta", { name: "twitter:alt", content: "Momentum Firmware" }],
        ["meta", { name: "viewport", content: "width=device-width, initial-scale=1.0" }],
        ["link", { rel: "preconnect", href: "https://fonts.googleapis.com" }],
        ["link", { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "" }],
    ],
    sitemap: {
        hostname: "https://v2.momentum-fw.dev",
    },
    vite: {
        define: {
            __VUE_PROD_DEVTOOLS__: false,
            __INTLIFY_PROD_DEVTOOLS__: false,
            __VUE_OPTIONS_API__: true,
            __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false,
            "process.env.NODE_ENV": JSON.stringify("production"),
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
            noExternal: ["mark.js", "oh-vue-icons", /^oh-vue-icons\/.*/],
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
            chunkSizeWarningLimit: 1000,
            rollupOptions: {
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
        logo: "/logos/black_round.png",
        outline: "deep",
        socialLinks: [
            { icon: "x", link: "https://x.com/FlipperMomentum" },
            { icon: "discord", link: "https://discord.com/momentum" },
            { icon: "github", link: "https://github.com/Next-Flip/Momentum-Firmware" },
        ],
        search: {
            provider: "local",
            options: {
                locales: {
                    root: rootSearchLocale,
                    ko: koSearchLocale,
                    ja: jaSearchLocale,
                    zh: zhSearchLocale,
                },
            },
        },
    },
});
