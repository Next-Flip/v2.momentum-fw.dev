<script setup lang="ts">
import { useData, useRoute } from "vitepress";
import { computed } from "vue";
import { recentReleases } from "../../../_data/releases";
import { useI18n } from "../composables/useI18n";

import { buildInfo } from "../../../_data/buildInfo";
import { useLogoCycle } from "../composables/useLogoCycle";
import FooterSection from "./FooterSection.vue";

const { site } = useData();
const { tr } = useI18n();
const logoColors = ["black", "purp", "orange", "pink"];
const { currentLogo, nextLogo } = useLogoCycle(logoColors);
const route = useRoute();
const isWiki = route.path.includes("/wiki");

const siteDescription = computed(() => {
    return (site.value as any)?.description || tr("site_description");
});

const formattedLastUpdate = computed(() => {
    const date = new Date(buildInfo.date);
    return date.toLocaleString();
});

const socialLinks = computed(() => [
    { name: "Github", url: "https://github.com/Next-Flip/Momentum-Firmware" },
    { name: "Discord", url: "https://discord.com/momentum" },
    { name: "X/Twitter", url: "https://x.com/FlipperMomentum" },
    { name: "Reddit", url: "https://www.reddit.com/r/flippermomentum/" },
]);

const navigationLinks = computed(() => [
    { name: tr("nav_web_flasher"), url: "/update" },
    { name: tr("nav_releases"), url: "/releases" },
    { name: tr("asset_packs"), url: "/asset-packs" },
    { name: tr("nav_wiki"), url: "/wiki" },
    { name: tr("nav_team"), url: "/team" },
    {
        name: tr("nav_contributing"),
        url: "https://github.com/Next-Flip/Momentum-Firmware/blob/dev/CODING_STYLE.md",
    },
    { name: tr("nav_donate"), url: "https://ko-fi.com/willyjl" },
]);
</script>

<template>
    <footer class="overflow-hidden footer" :style="{ '--footer-bg-width': '1152px' }">
        <div
            class="max-w-full mx-auto border-t border-vp-divider"
            :class="`px-6 py-12 ${isWiki ? 'lg:px-0' : 'lg:px-11'}`"
        >
            <div
                class="flex flex-col sm:flex-row sm:justify-between gap-12 md:gap-8 mx-auto"
                :class="`${route.path.includes('/releases') ? 'max-w-7xl lg:px-8' : 'max-w-6xl'}`"
            >
                <div class="lg:max-w-md flex flex-col justify-start">
                    <div class="flex items-center space-x-3">
                        <a
                            href="/"
                            class="footer-logo inline-block transition-transform hover:scale-105 w-8 h-8 object-contain object-center"
                            @mouseenter="nextLogo"
                        >
                            <img
                                :src="currentLogo"
                                alt="Momentum Firmware"
                                class="w-8 h-8 object-contain object-center"
                            />
                        </a>
                    </div>

                    <p class="text-sm text-vp-2 max-w-72 mt-3.5">
                        {{ siteDescription }}
                    </p>

                    <p class="text-xs text-vp-3 mt-2">
                        <a
                            href="https://github.com/Next-Flip/Momentum-Firmware/blob/dev/LICENSE"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="hover:text-vp-brand-1 transition-colors duration-100 hover:underline"
                        >
                            GPL-3.0 © 2025 Next-Flip
                        </a>
                    </p>

                    <p
                        class="text-xs text-[color-mix(in_srgb,var(--vp-c-text-3),transparent_50%)] mt-2 sm:mt-auto"
                    >
                        {{ tr("footer_last_update") }}: {{ formattedLastUpdate }}
                    </p>
                </div>

                <div
                    v-if="recentReleases.mainline.length > 0 || recentReleases.devbuilds.length > 0"
                    :class="`grid grid-cols-2 grid-rows-[auto_auto] justify-between gap-y-10 md:flex md:flex-row gap-10 ${isWiki ? 'lg:gap-12' : 'lg:gap-20'}`"
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

footer {
    position: relative;
}
</style>
