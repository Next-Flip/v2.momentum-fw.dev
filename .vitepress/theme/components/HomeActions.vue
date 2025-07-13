<script setup lang="ts">
import { computed, inject, onMounted } from "vue";
import { devbuildReleases, getReleaseByCommit, mainlineReleases } from "../../../_data/releases";
import { useDots } from "../composables/useDots";
import { useI18n } from "../composables/useI18n";
import { useAutoconnectSetting } from "../composables/useAutoconnectSetting";

import type { useSerialConnection } from "../composables/useSerialConnection";
import { ConnectionState } from "../types";

const serialConnection = inject<ReturnType<typeof useSerialConnection>>("serialConnection")!;
const { connectionData } = serialConnection;
const { tr, getLocalizedPath } = useI18n();
const { dots } = useDots();
const { isAutoconnectEnabled } = useAutoconnectSetting();

const isConnected = computed(
    () => connectionData.state === ConnectionState.CONNECTED && connectionData.deviceInfo,
);
const isConnecting = computed(
    () => serialConnection.connectionData.state === ConnectionState.CONNECTING,
);

interface ActionButton {
    theme: "brand" | "alt";
    text: string;
    href: string;
    isLatest?: boolean;
}

const dynamicButtons = computed((): ActionButton[] => {
    const isConnecting = serialConnection.connectionData.state === ConnectionState.CONNECTING;
    const defaultButtons: ActionButton[] = [
        {
            theme: "brand",
            text: isConnecting ? dots.value : tr("install"),
            href: getLocalizedPath("/update"),
        },
        {
            theme: "alt",
            text: isConnecting ? dots.value : tr("nav_releases"),
            href: getLocalizedPath("/releases"),
        },
    ];

    const deviceInfo = connectionData.deviceInfo;
    if (!isConnected.value || !deviceInfo) {
        return defaultButtons;
    }

    const currentVersion = deviceInfo.firmware_version || "Unknown";
    const currentCommit = deviceInfo.firmware_commit || "";
    const versionMatch = currentVersion.match(/mntm-(\d+(?:\.\d+)*)/);
    const commitInReleases = getReleaseByCommit(currentCommit);
    const latestMainline = mainlineReleases.length > 0 ? mainlineReleases[0] : null;
    const latestDevbuild = devbuildReleases.length > 0 ? devbuildReleases[0] : null;
    const isMainlineVersion = versionMatch && currentVersion.includes("mntm-");
    const isLatestMainline =
        latestMainline &&
        (currentCommit === latestMainline.commit ||
            currentVersion.includes(latestMainline.version || ""));
    const isLatestDevbuild = latestDevbuild && currentCommit === latestDevbuild.commit;
    let updateText: string;
    let updateHref: string;
    let isLatest = false;

    if (isMainlineVersion) {
        if (isLatestMainline) {
            updateText = tr("home_up_to_date");
            updateHref = getLocalizedPath("/update");
            isLatest = true;
        } else {
            const latestMainlineVersion = `${latestMainline?.version?.replace("mntm-", "").toUpperCase() || tr("home_latest_mainline")}`;
            updateText = `${tr("home_update_to")} ${latestMainlineVersion}`;
            updateHref = `${getLocalizedPath("/update")}/${latestMainline?.commit || latestMainlineVersion}`;
        }
    } else {
        if (isLatestDevbuild) {
            updateText = tr("home_latest_devbuild");
            updateHref = getLocalizedPath("/update");
            isLatest = true;
        } else {
            const latestDevCommit = latestDevbuild?.commit?.substring(0, 8) || "latest";
            updateText = `${tr("home_update_to")} ${latestDevCommit} (${tr("home_dev")})`;
            updateHref = `${getLocalizedPath("/update")}/${latestDevbuild?.commit || ""}`;
        }
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
            text: commitInReleases ? tr("home_changelog") : tr("nav_releases"),
            href: `${getLocalizedPath("/releases")}/${commitInReleases?.commit || ""}`,
        },
    ];

    return connectedButtons;
});

onMounted(async () => {
    if (serialConnection && serialConnection.autoConnect && isAutoconnectEnabled.value) {
        await serialConnection.autoConnect();
    }
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
                    'px-7 text-sm leading-9 font-semibold rounded-full border transition-all duration-100',
                    isConnecting ? 'w-[100px]' : '',
                    button.theme === 'brand'
                        ? button.isLatest
                            ? 'border-vp-brand-2 bg-vp-brand-2 hover:bg-vp-brand-3 text-neutral-50 hover:text-white'
                            : 'border-vp-brand-1 hover:bg-vp-brand-3 hover:border-vp-brand-2/50 hover:text-white'
                        : 'border-vp-border hover:bg-vp-1 dark:hover:bg-vp-border hover:border-vp-3/20 text-vp-1 hover:text-white',
                ]"
                >{{ button.text }}</a
            >
        </div>
    </div>
</template>
