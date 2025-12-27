<script setup lang="ts">
import { useData, useRoute } from "vitepress";
import { computed, ref } from "vue";
import { recentReleases } from "../../../_data/releases";
import { formatDate } from "../date";

import { buildInfo } from "../../../_data/buildInfo";
import { useI18n, useThemeSwitcher } from "../composables";
import { githubBlobUrl, githubUrl } from "../util";
import FooterSection from "./FooterSection.vue";

const { site } = useData();
const { tr } = useI18n();
const { currentLogo, nextLogo, isLocked, toggleLock } = useThemeSwitcher();
const route = useRoute();
const isWiki = computed(() => route.path.includes("wiki"));

const isHovering = ref(false);
const handleLogoHover = () => {
    if (!isHovering.value) {
        isHovering.value = true;
        nextLogo();
    }
};
const handleLogoLeave = () => {
    isHovering.value = false;
};

const siteDescription = computed(() => {
    return (site.value as { description?: string })?.description || tr("site_description");
});

const formattedLastUpdate = computed(() => {
    return formatDate(buildInfo.date, "withTime");
});

const socialLinks = computed(() => [
    { name: "Github", url: githubUrl },
    { name: "Discord", url: "https://discord.gg/momentum" },
    { name: "X/Twitter", url: "https://x.com/FlipperMomentum" },
    { name: "Reddit", url: "https://www.reddit.com/r/flippermomentum/" },
]);

const navigationLinks = computed(() => [
    { name: tr("nav_web_updater"), url: "/update" },
    { name: tr("nav_releases"), url: "/releases" },
    { name: tr("asset_packs"), url: "/asset-packs" },
    { name: tr("nav_wiki"), url: "/wiki" },
    { name: tr("nav_faq"), url: "/wiki/FAQ" },
    {
        name: tr("nav_report_a_bug"),
        url: `${githubUrl}/issues`,
    },
    { name: tr("nav_donate"), url: "https://ko-fi.com/willyjl" },
]);
</script>

<template>
    <footer
        class="footer pt-6 sm:pt-10 xl:pt-0 max-w-3xl mx-auto lg:max-w-full w-full relative"
        :style="{ '--footer-bg-width': '1152px' }"
    >
        <div class="max-w-full mx-auto pb-16 sm:pb-20 xl:pb-32" :class="isWiki ? 'py-0' : 'py-10'">
            <div
                class="flex flex-col-reverse lg:flex-row lg:justify-between gap-16 mx-auto max-w-7xl"
                :class="isWiki ? '2xl:pl-[71px] sm:px-8' : 'px-8 lg:pl-16 sm:px-16'"
            >
                <div class="lg:max-w-md flex flex-col justify-start z-50 group/logo">
                    <div class="flex flex-col pl-3.5 -ml-3.5 pt-3.5 -mt-3.5">
                        <div class="flex flex-row items-center gap-3 pb-3.5">
                            <a
                                href="/"
                                class="footer-logo inline-block transition-transform hover:scale-105 w-8 h-8 object-contain object-center select-none"
                                @mouseenter="handleLogoHover"
                                @mouseleave="handleLogoLeave"
                            >
                                <img
                                    :src="currentLogo"
                                    alt="Momentum Firmware"
                                    class="w-8 h-8 object-contain object-center"
                                />
                            </a>
                            <button
                                :aria-label="isLocked ? tr('theme_locked') : ''"
                                class="lock-button opacity-0 group-hover/logo:opacity-100 transition-all duration-200 pl-0.5 p-1 rounded text-vp-3/80 hover:!text-vp-2"
                                @click="toggleLock"
                            >
                                <v-icon :name="isLocked ? 'oi-lock' : 'oi-unlock'" scale="0.85" />
                            </button>
                            <span
                                class="text-vp-3/80 text-[11px] italic transition-all duration-200 mt-px -ml-2.5 select-none"
                                :class="
                                    !isLocked
                                        ? 'opacity-0'
                                        : 'opacity-0 group-hover/logo:opacity-100'
                                "
                            >
                                {{ tr("theme_locked") }}
                            </span>
                        </div>

                        <p class="text-sm text-vp-2 max-w-72 select-none">
                            {{ siteDescription }}
                        </p>
                    </div>

                    <div
                        class="flex flex-row gap-1.5 mt-3 lg:mt-2 justify-start items-center leading-none"
                    >
                        <p class="text-xs text-vp-3">
                            <a
                                :href="`${githubBlobUrl('dev/LICENSE')}`"
                                target="_blank"
                                rel="noopener noreferrer"
                                class="hover:text-vp-brand-1 transition-colors duration-100 hover:underline select-none"
                            >
                                GPL-3.0 © 2025 Next-Flip
                            </a>
                        </p>
                        <img
                            src="/svg/yapluv.png"
                            alt="Yap"
                            class="w-5 h-5 object-contain object-center cursor-pointer hover:scale-105 transition-transform duration-100 select-none"
                        />
                    </div>

                    <div
                        class="flex flex-row gap-1.5 mt-3 sm:mt-auto xl:mt-auto justify-start items-center leading-none"
                    >
                        <p class="text-xs text-vp-3/50">
                            {{ tr("footer_last_update") }}: {{ formattedLastUpdate }}
                        </p>
                        <template v-if="buildInfo.commitHash">
                            <span class="text-vp-3/40 select-none">·</span>
                            <a
                                class="text-[13px] font-normal text-vp-3/50 hover:underline hover:text-vp-brand-1 transition-colors duration-100"
                                :href="`https://github.com/Next-Flip/v2.momentum-fw.dev/commit/${buildInfo.commitHash}`"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                {{ buildInfo.commitHash }}
                            </a>
                        </template>
                    </div>
                </div>

                <div
                    v-if="recentReleases.mainline.length > 0 || recentReleases.devbuilds.length > 0"
                    class="grid grid-cols-2 grid-rows-[auto_auto] justify-start gap-y-10 md:flex md:flex-row gap-24 xl:gap-20"
                >
                    <div class="contents md:block md:space-y-6">
                        <FooterSection
                            :title="tr('footer_mainline')"
                            :items="recentReleases.mainline"
                            type="release"
                        />

                        <FooterSection
                            :title="tr('footer_devbuilds')"
                            :items="recentReleases.devbuilds.slice(0, 4)"
                            type="release"
                        />
                    </div>

                    <FooterSection :title="tr('footer_navigation')" :items="navigationLinks" />

                    <FooterSection :title="tr('footer_community')" :items="socialLinks" />
                </div>
            </div>
        </div>
    </footer>
</template>

<style scoped>
.footer-logo {
    position: relative;
}

.lock-button:hover {
    transform: scale(1.05);
}

footer {
    position: relative;
}
</style>
