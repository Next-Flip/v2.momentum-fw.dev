import { inject } from "@vercel/analytics";
import { injectSpeedInsights } from "@vercel/speed-insights";
import type { Theme } from "vitepress";
import { useRoute } from "vitepress";
import DefaultTheme from "vitepress/theme";
import { h } from "vue";
import "./style.css";

import { OhVueIcon, addIcons } from "oh-vue-icons";
import {
    BiCheck,
    BiCheck2,
    BiFileEarmarkZip,
    BiGithub,
    BiListUl,
    BiUsbSymbol,
    HiCode,
    HiPlusSm,
    LaDownloadSolid,
    LaInfoCircleSolid,
    MdCloseRound,
    MdFontdownloadOutlined,
    MdSortRound,
    OiCheck,
    OiChevronDown,
    OiChevronLeft,
    OiChevronRight,
    OiChevronUp,
    OiCopy,
    PrArrowUpRight,
    PrDownload,
    PrRefresh,
    PrTrash,
    RiAlertLine,
    RiCheckLine,
    RiClapperboardLine,
    RiDeleteBinLine,
    RiDownloadCloud2Line,
    RiDownloadCloudLine,
    RiErrorWarningLine,
    RiExternalLinkLine,
    RiFileListLine,
    RiFileTextLine,
    RiFullscreenExitLine,
    RiFullscreenLine,
    RiImageLine,
    RiInformationLine,
    RiPassportLine,
    RiQuestionMark,
    RiSaveLine,
    RiUsbLine,
} from "oh-vue-icons/icons";

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
import { ConnectionState } from "./types";

export default {
    extends: DefaultTheme,
    Layout: () => {
        const route = useRoute();
        const isWiki = route.path.includes("/wiki");
        const isUpdater = route.path.includes("/update");

        return h(DefaultTheme.Layout, null, {
            "nav-bar-content-before": () =>
                isUpdater ? null : h(ConnectButton, { class: "connect-nav-bar" }),
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
                    ableToUpdate: null,
                    restarting: false,
                    screenStream: false,
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
                startScreenStream: () => Promise.reject(new Error("SSR")),
                stopScreenStream: () => Promise.reject(new Error("SSR")),
                screenScale: { value: 2 },
            };
            app.provide("serialConnection", ssrStub);
        }

        addIcons(
            BiCheck,
            BiCheck2,
            PrDownload,
            MdCloseRound,
            MdFontdownloadOutlined,
            MdSortRound,
            OiCheck,
            OiChevronDown,
            OiChevronLeft,
            OiChevronRight,
            OiChevronUp,
            OiCopy,
            LaDownloadSolid,
            PrTrash,
            RiClapperboardLine,
            RiErrorWarningLine,
            RiExternalLinkLine,
            RiFullscreenExitLine,
            PrArrowUpRight,
            RiFullscreenLine,
            RiImageLine,
            RiPassportLine,
            RiSaveLine,
            RiQuestionMark,
            BiGithub,
            LaInfoCircleSolid,
            RiAlertLine,
            RiCheckLine,
            RiDeleteBinLine,
            RiDownloadCloudLine,
            RiFileListLine,
            RiFileTextLine,
            RiInformationLine,
            RiUsbLine,
            HiCode,
            BiListUl,
            RiDownloadCloud2Line,
            BiUsbSymbol,
            PrRefresh,
            HiPlusSm,
            BiFileEarmarkZip,
        );
        app.component("AssetPacksPage", AssetPacksPage as any);
        app.component("v-icon", OhVueIcon);
        app.component("ExtractNotice", ExtractNotice as any);
        app.component("UpdaterPage", UpdaterPage as any);
        app.component("HomeActions", HomeActions as any);
        app.component("ReleasesPage", ReleasesPage as any);
    },
} satisfies Theme;
