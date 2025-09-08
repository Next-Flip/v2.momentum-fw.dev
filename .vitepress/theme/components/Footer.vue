<script setup lang="ts">
import { useData, useRoute } from "vitepress";
import { computed, ref } from "vue";
import { recentReleases } from "../../../_data/releases";
import { useI18n } from "../composables/useI18n";
import { formatDate } from "../date";

import { buildInfo } from "../../../_data/buildInfo";
import { useThemeSwitcher } from "../composables/useThemeSwitcher";
import FooterSection from "./FooterSection.vue";

const { site } = useData();
const { tr } = useI18n();
const { currentLogo, nextLogo, isLocked, toggleLock } = useThemeSwitcher();
const route = useRoute();
const isWiki = computed(() => route.path.includes("/wiki"));

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
    { name: "Github", url: "https://github.com/Next-Flip/Momentum-Firmware" },
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
        url: "https://github.com/Next-Flip/Momentum-Firmware/issues",
    },
    { name: tr("nav_donate"), url: "https://ko-fi.com/willyjl" },
]);
</script>

<template>
    <footer class="footer pt-6" :style="{ '--footer-bg-width': '1152px' }">
        <div class="max-w-full mx-auto py-16 pb-20 lg:pb-32" :class="{ 'lg:px-0': isWiki }">
            <div
                class="flex flex-col-reverse lg: sm:flex-row sm:justify-between gap-16 md:gap-8 mx-auto max-w-7xl"
                :class="[isWiki ? 'pl-8 pr-12 lg:pl-72' : 'px-8 lg:px-16']"
            >
                <div class="lg:max-w-md flex flex-col justify-start z-50">
                    <div class="flex flex-col pl-3.5 -ml-3.5 group/logo pt-3.5 -mt-3.5">
                        <div class="flex flex-row items-center gap-3 pb-3.5">
                            <a
                                href="/"
                                class="footer-logo inline-block transition-transform hover:scale-105 w-8 h-8 object-contain object-center"
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

                        <p class="text-sm text-vp-2 max-w-72">
                            {{ siteDescription }}
                        </p>
                    </div>

                    <div
                        class="flex flex-row gap-1.5 mt-3 lg:mt-2 justify-start items-center leading-none"
                    >
                        <p class="text-xs text-vp-3">
                            <a
                                href="https://github.com/Next-Flip/Momentum-Firmware/blob/dev/LICENSE"
                                target="_blank"
                                rel="noopener noreferrer"
                                class="hover:text-vp-brand-1 transition-colors duration-100 hover:underline"
                            >
                                GPL-3.0 © 2025 Next-Flip
                            </a>
                        </p>
                        <img
                            src="/svg/yapluv.png"
                            alt="Yap"
                            class="w-5 h-5 object-contain object-center cursor-pointer hover:scale-105 transition-transform duration-100"
                        />
                    </div>

                    <div
                        class="flex flex-row gap-1.5 sm:mt-auto mt-3 justify-start items-center leading-none"
                    >
                        <p class="text-xs text-vp-3/50">
                            {{ tr("footer_last_update") }}: {{ formattedLastUpdate }}
                        </p>
                        <template v-if="buildInfo.commitHash">
                            <span class="text-vp-3/40">·</span>
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
                    class="grid grid-cols-2 grid-rows-[auto_auto] justify-between gap-y-10 md:flex md:flex-row gap-8"
                    :class="isWiki ? 'lg:gap-12' : 'lg:gap-20'"
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

footer:before {
    content: "";
    position: absolute;
    left: 50%;
    transform: translateX(-50%) scaleX(-1);
    bottom: 0;
    width: 100%;
    height: 50vw;
    min-height: 400px;
    max-height: 800px;
    max-width: 1536px;
    background-image: url("/bg/006-line.png");
    background-size: cover;
    background-position: bottom center;
    background-repeat: no-repeat;
    opacity: 0.4;
    filter: saturate(0);
    mix-blend-mode: multiply;
    z-index: -1;
    pointer-events: none;
}

.dark footer:before {
    mix-blend-mode: screen;
    opacity: 0.3;
    filter: saturate(0) invert(1);
}

.theme-skyline.dark footer:before {
    opacity: 0.35;
    filter: saturate(0) invert(1);
}
</style>
