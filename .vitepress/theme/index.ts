import { inject } from "@vercel/analytics";
import { injectSpeedInsights } from "@vercel/speed-insights";
import type { Theme } from "vitepress";
import DefaultTheme from "vitepress/theme";
import { h } from "vue";
import "./style.css";

import { OhVueIcon, addIcons } from "oh-vue-icons";
import {
    BiCheck,
    BiCheck2,
    BiGithub,
    LaDownloadSolid,
    LaInfoCircleSolid,
    MdCloseRound,
    MdFontdownloadOutlined,
    MdSortRound,
    OiCheck,
    OiChevronDown,
    OiChevronLeft,
    OiChevronRight,
    OiCopy,
    PrTrash,
    RiClapperboardLine,
    RiErrorWarningLine,
    RiImageLine,
    RiPassportLine,
    RiQuestionMark,
    RiSaveLine,
} from "oh-vue-icons/icons";

import AssetPacksPage from "./components/AssetPacksPage.vue";
import ConnectButton from "./components/ConnectButton.vue";
import ExtractNotice from "./components/ExtractNotice.vue";
import Footer from "./components/Footer.vue";
import HomeActions from "./components/HomeActions.vue";
import ReleasesPage from "./components/ReleasesPage.vue";
import SidebarSearch from "./components/SidebarSearch.vue";
import WarningPopup from "./components/WarningPopup.vue";
import { useSerialConnection } from "./composables/useSerialConnection";
import { ConnectionState } from "./types";

export default {
    extends: DefaultTheme,
    Layout: () => {
        return h(DefaultTheme.Layout, null, {
            "nav-bar-content-before": () => h(ConnectButton, { class: "connect-nav-bar" }),
            "page-top": () => h(ConnectButton, { class: "connect-page-top" }),
            "sidebar-nav-before": () => h(SidebarSearch),
            "home-hero-info-after": () => h(HomeActions),
            "layout-bottom": () => [h(WarningPopup), h(Footer)],
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

        if (
            typeof window !== "undefined" &&
            typeof navigator !== "undefined" &&
            !import.meta.env.SSR
        ) {
            const serialConnection = useSerialConnection();
            serialConnection.setupEventListeners();
            app.provide("serialConnection", serialConnection);
        } else {
            const ssrStub = {
                connectionData: {
                    state: ConnectionState.DISCONNECTED,
                    installedPacks: {},
                },
                flags: {
                    serialSupported: false,
                    portSelectRequired: false,
                    connected: false,
                    rpcActive: false,
                    rpcToggling: false,
                    updateInProgress: false,
                    progress: 0,
                    installStatus: null,
                    ableToExtract: null,
                    restarting: false,
                },
                queueState: {
                    queue: [],
                    queueActions: [],
                    fakeExtractProgress: null,
                },
                connect: () => Promise.reject(new Error("SSR")),
                disconnect: () => Promise.reject(new Error("SSR")),
                installAssetPack: () => Promise.reject(new Error("SSR")),
                setupEventListeners: () => {},
                enqueue: () => Promise.reject(new Error("SSR")),
                updateExtractCapability: () => Promise.reject(new Error("SSR")),
                restartRpc: () => Promise.reject(new Error("SSR")),
            };
            app.provide("serialConnection", ssrStub);
        }

        addIcons(
            BiCheck,
            BiCheck2,
            MdCloseRound,
            MdFontdownloadOutlined,
            MdSortRound,
            OiCheck,
            OiChevronDown,
            OiChevronLeft,
            OiChevronRight,
            OiCopy,
            LaDownloadSolid,
            PrTrash,
            RiClapperboardLine,
            RiErrorWarningLine,
            RiImageLine,
            RiPassportLine,
            RiSaveLine,
            RiQuestionMark,
            BiGithub,
            LaInfoCircleSolid,
        );
        app.component("v-icon", OhVueIcon);
        app.component("AssetPacksPage", AssetPacksPage);
        app.component("ExtractNotice", ExtractNotice);
        app.component("HomeActions", HomeActions);
        app.component("ReleasesPage", ReleasesPage);
    },
} satisfies Theme;
