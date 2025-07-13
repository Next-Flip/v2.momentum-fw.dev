import { inject } from "@vercel/analytics";
import { injectSpeedInsights } from "@vercel/speed-insights";
import type { Theme } from "vitepress";
import { useRoute } from "vitepress";
import DefaultTheme from "vitepress/theme";
import { h } from "vue";
import "./style.css";

import { OhVueIcon, addIcons } from "oh-vue-icons";
import * as icons from "./icons";

import AssetPacksPage from "./components/AssetPacksPage.vue";
import ConnectButton from "./components/ConnectButton.vue";
import ExtractNotice from "./components/ExtractNotice.vue";
import Footer from "./components/Footer.vue";
import HomeActions from "./components/HomeActions.vue";
import ReleasesPage from "./components/ReleasesPage.vue";
import SidebarSearch from "./components/SidebarSearch.vue";
import UpdaterPage from "./components/UpdaterPage.vue";
import WarningPopup from "./components/WarningPopup.vue";
import { useSerialConnection } from "./composables/useSerialConnection";

export default {
    extends: DefaultTheme,
    Layout: () => {
        const route = useRoute();
        const isWiki = route.path.includes("/wiki");

        return h(DefaultTheme.Layout, null, {
            "nav-bar-content-before": () => h(ConnectButton, { class: "connect-nav-bar" }),
            "sidebar-nav-before": () => h(SidebarSearch),
            "home-hero-info-after": () => h(HomeActions),
            ...(isWiki
                ? { "doc-bottom": () => h(Footer) }
                : { "layout-bottom": () => [h(WarningPopup), h(Footer)] }),
        });
    },
    enhanceApp({ app, router }) {
        if (typeof window !== "undefined") {
            inject({ mode: "auto" });
            injectSpeedInsights({
                framework: "vitepress",
            });
        }

        router.onAfterRouteChange = () => {
            if (typeof document !== "undefined") {
                document.body.dataset.route = router.route.path;
            }
        };

        const serialConnection = useSerialConnection();
        if (
            typeof window !== "undefined" &&
            typeof navigator !== "undefined" &&
            !import.meta.env.SSR
        ) {
            serialConnection.setupEventListeners();
        }
        app.provide("serialConnection", serialConnection);

        try {
            addIcons(...Object.values(icons));
        } catch (error) {
            console.error("Failed to load icons:", error);
        }

        app.component("AssetPacksPage", AssetPacksPage as never);
        app.component("VIcon", OhVueIcon as never);
        app.component("ExtractNotice", ExtractNotice as never);
        app.component("UpdaterPage", UpdaterPage as never);
        app.component("HomeActions", HomeActions as never);
        app.component("ReleasesPage", ReleasesPage as never);
    },
} satisfies Theme;
