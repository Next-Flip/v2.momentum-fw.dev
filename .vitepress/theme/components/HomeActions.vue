<script setup lang="ts">
import { computed } from "vue";
import { devbuildReleases, mainlineReleases } from "../../../_data/releases";
import { useConnectionInfo } from "../composables/useConnectionInfo";
import { useDots } from "../composables/useDots";
import { useThemeSwitcher } from "../composables/useThemeSwitcher";

const { dots } = useDots();
const { ifCurrentTheme } = useThemeSwitcher();

const { deviceInfo, isConnected, isConnecting, versionInReleases, tr, getLocalizedPath } =
    useConnectionInfo();

interface ActionButton {
    theme: "brand" | "alt";
    text: string;
    href: string;
    isLatest?: boolean;
}

const dynamicButtons = computed((): ActionButton[] => {
    const defaultButtons: ActionButton[] = [
        {
            theme: "brand",
            text: isConnecting.value ? dots.value : tr("install"),
            href: getLocalizedPath("/update"),
        },
        {
            theme: "alt",
            text: isConnecting.value ? dots.value : tr("nav_releases"),
            href: getLocalizedPath("/releases"),
        },
    ];

    if (!isConnected.value || !deviceInfo) {
        return defaultButtons;
    }

    const currentVersion = deviceInfo.value?.firmware_version || "";
    const currentCommit = deviceInfo.value?.firmware_commit || "";
    const latestMainline = mainlineReleases.length > 0 ? mainlineReleases[0] : null;
    const latestDevbuild = devbuildReleases.length > 0 ? devbuildReleases[0] : null;
    const isMainlineVersion = currentVersion.match(/mntm-\d{3}/);
    const isDevbuildVersion = currentVersion === "mntm-dev";
    const isLatestMainline = latestMainline && currentVersion === latestMainline.version;
    const isLatestDevbuild = latestDevbuild && currentCommit === latestDevbuild.version;
    let updateText: string;
    let updateHref: string;
    let isLatest = false;

    if (isMainlineVersion) {
        if (isLatestMainline) {
            updateText = tr("home_up_to_date");
            updateHref = getLocalizedPath("/update");
            isLatest = true;
        } else {
            updateText = `${tr("home_update_to")} ${latestMainline?.version}`;
            updateHref = `${getLocalizedPath("/update")}?version=${latestMainline?.version || ""}`;
        }
    } else if (isDevbuildVersion) {
        if (isLatestDevbuild) {
            updateText = tr("home_latest_devbuild");
            updateHref = getLocalizedPath("/update");
            isLatest = true;
        } else {
            updateText = `${tr("home_update_to")} ${latestDevbuild?.version} (${tr("home_dev")})`;
            updateHref = `${getLocalizedPath("/update")}?version=${latestDevbuild?.version || ""}`;
        }
    } else {
        return defaultButtons;
    }

    const connectedButtons: ActionButton[] = [
        {
            theme: "brand",
            text: updateText,
            href: updateHref,
            isLatest,
        },
        {
            theme: "alt",
            text: versionInReleases ? tr("home_changelog") : tr("nav_releases"),
            href: `${getLocalizedPath("/releases")}/${versionInReleases.value?.version || ""}`,
        },
    ];

    return connectedButtons;
});
</script>

<template>
    <div class="flex flex-wrap items-center justify-center pt-6 sm:pt-8">
        <div class="flex flex-row gap-4 flex-shrink-0 py-1.5">
            <a
                v-for="button in dynamicButtons"
                :key="button.href"
                :href="button.isLatest ? '#' : button.href"
                :class="[
                    'px-7 text-sm leading-9 font-semibold rounded-full border transition-all duration-100 bg-vp-dark/75 backdrop-blur-[1px]',
                    isConnecting ? 'w-[100px]' : '',
                    button.theme === 'brand'
                        ? button.isLatest
                            ? `border-vp-brand-2 dark:border-vp-brand-1 dark:hover:border-vp-brand-2 bg-vp-brand-2 hover:bg-vp-brand-3 text-vp-neutral ${ifCurrentTheme(['orange']) ? 'hover:text-black' : ifCurrentTheme(['white']) ? 'hover:text-vp-neutral-inverse dark:hover:text-vp-neutral-inverse' : 'hover:text-white'}`
                            : `border-vp-brand-1 hover:bg-vp-brand-3 hover:border-vp-brand-2/10 ${ifCurrentTheme(['orange']) ? 'hover:text-black' : ifCurrentTheme(['white']) ? 'hover:text-vp-neutral-inverse dark:hover:text-vp-neutral-inverse' : 'hover:text-white'}`
                        : 'border-vp-border hover:bg-vp-1 dark:hover:bg-vp-border hover:border-vp-3/10 text-vp-1 hover:text-white',
                ]"
                >{{ button.text }}</a
            >
        </div>
    </div>
</template>
