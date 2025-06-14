<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { devbuildReleases, mainlineReleases, type ReleaseItem } from "../../../_data/releases";
import { useI18n } from "../composables/useI18n";

const { getLocalizedPath, tr } = useI18n();

const props = defineProps<{
    selectedRelease: ReleaseItem | null;
}>();

const imageLoaded = ref(false);
const imageExists = ref(false);
const imageSrc = ref<string>("");

const isDevBuild = computed(() => {
    return props.selectedRelease?.branch.includes("dev");
});

const loadImageAsync = async (commit: string) => {
    try {
        const imageUrl = `/og/${commit}.png`;
        const img = new Image();

        return new Promise<boolean>((resolve) => {
            img.onload = () => {
                imageSrc.value = imageUrl;
                resolve(true);
            };
            img.onerror = () => {
                resolve(false);
            };
            img.src = imageUrl;
        });
    } catch {
        return false;
    }
};

const shouldShowImage = computed(() => {
    return props.selectedRelease && !isDevBuild.value && imageExists.value && imageLoaded.value;
});

const infoItems = computed(() => [
    {
        href: getLocalizedPath(`/releases/${mainlineReleases[0]?.commit}`),
        link: `https://github.com/Next-Flip/Momentum-Firmware/releases/tag/${mainlineReleases[0]?.branch}`,
        key: "aside_latest_release" as const,
        value: mainlineReleases[0]?.version,
        condition: mainlineReleases[0]?.version,
    },
    {
        href: getLocalizedPath(`/releases/${devbuildReleases[0]?.commit}`),
        link: `https://github.com/Next-Flip/Momentum-Firmware/tree/${devbuildReleases[0]?.commit}`,
        key: "aside_latest_devbuild" as const,
        value: devbuildReleases[0]?.commit?.substring(0, 8),
        condition: devbuildReleases[0]?.commit,
    },
    {
        key: "aside_last_build_date" as const,
        value: devbuildReleases[0]?.timestamp
            ? new Date(devbuildReleases[0].timestamp * 1000).toLocaleString()
            : null,
        condition: devbuildReleases[0]?.timestamp,
    },
]);

const supportLinks = [
    {
        key: "aside_documentation" as const,
        href: getLocalizedPath("/wiki/"),
        external: false,
    },
    {
        key: "aside_issues_feature_requests" as const,
        href: "https://github.com/Next-Flip/Momentum-Firmware/issues",
        external: true,
    },
    {
        key: "aside_discord_alerts" as const,
        href: "https://discord.com/channels/1211622338198765599/1245274311498141806",
        external: true,
    },
];

const openImageInNewTab = (commit: string) => {
    window.open(`/og/${commit}.png`, "_blank");
};

watch(
    () => props.selectedRelease?.commit,
    async (newCommit) => {
        imageExists.value = false;
        imageLoaded.value = false;
        imageSrc.value = "";

        if (newCommit && !isDevBuild.value) {
            const exists = await loadImageAsync(newCommit);
            if (exists) {
                imageExists.value = true;
                imageLoaded.value = true;
            }
        }
    },
    { immediate: true },
);
</script>

<template>
    <aside class="hidden lg:block flex-shrink flex-grow-0 w-52 xl:w-60 pl-8 pt-8 pb-8">
        <div class="sticky top-20 lg:top-24 flex flex-col">
            <span class="text-vp-2 text-sm font-medium mb-0.5" v-html="tr('aside_desc')"></span>

            <div class="border-t border-[var(--vp-c-divider)] my-4"></div>

            <div class="flex flex-col gap-2.5 my-0.5">
                <div
                    v-for="item in infoItems"
                    :key="item.key"
                    v-show="item.condition"
                    class="flex flex-col items-start gap-y-0.5"
                >
                    <span class="text-vp-3 text-xs font-medium">
                        {{ tr(item.key) }}
                    </span>
                    <div class="flex flex-row gap-x-1 items-center">
                        <a
                            v-if="item.href"
                            :href="item.href"
                            class="text-vp-1 font-medium text-sm transition-colors duration-200 hover:text-vp-brand-1 cursor-pointer"
                        >
                            {{ item.value }}
                        </a>
                        <span v-else class="text-vp-1 font-medium text-sm">
                            {{ item.value }}
                        </span>
                        <a
                            v-if="item.link"
                            class="inline-flex items-center justify-center w-4 h-4 ml-1 text-vp-2 hover:text-vp-1 transition-colors duration-200 mb-px github-icon-link"
                            :href="item.link"
                            aria-label="github"
                            target="_blank"
                            rel="noopener"
                        >
                            <v-icon
                                name="bi-github"
                                scale="1.0"
                                class="github-icon"
                                style="min-width: 18px; min-height: 18px; display: inline-block"
                            />
                        </a>
                    </div>
                </div>
            </div>

            <div class="border-t border-[var(--vp-c-divider)] my-4"></div>

            <div class="space-y-2">
                <h3
                    class="text-[13px] font-semibold text-vp-1 pb-3 leading-6 uppercase tracking-wide"
                >
                    {{ tr("aside_support") }}
                </h3>
                <div class="flex flex-col gap-2.5 text-sm !m-0">
                    <a
                        v-for="link in supportLinks"
                        :key="link.key"
                        :href="link.href"
                        :target="link.external ? '_blank' : undefined"
                        :rel="link.external ? 'noopener noreferrer' : undefined"
                        class="block text-vp-2 hover:text-vp-brand-1 transition-colors duration-200 font-medium vp-external-link-icon"
                    >
                        {{ tr(link.key) }}
                    </a>
                </div>
            </div>

            <div v-if="shouldShowImage" class="mt-8">
                <img
                    :src="imageSrc"
                    :alt="`mntm-${selectedRelease?.commit}`"
                    @click="openImageInNewTab(selectedRelease?.commit || '')"
                    class="w-full h-auto rounded-lg border !my-0 border-vp-divider/30 cursor-pointer"
                />
            </div>
        </div>
    </aside>
</template>

<style scoped>
.github-icon-link {
    flex-shrink: 0;
}

.github-icon :deep(svg) {
    width: 16px !important;
    height: 16px !important;
    min-width: 16px !important;
    min-height: 16px !important;
    display: block !important;
}
</style>
