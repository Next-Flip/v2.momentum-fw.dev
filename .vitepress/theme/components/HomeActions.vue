<script setup lang="ts">
import { useData, useRoute } from "vitepress";
import { VPButton } from "vitepress/theme";
import { computed, inject, onMounted } from "vue";
import { useI18n } from "../composables/useI18n";

import type { useSerialConnection } from "../composables/useSerialConnection";
import { ConnectionState } from "../types";

const serialConnection = inject<ReturnType<typeof useSerialConnection>>("serialConnection")!;
const { connectionData } = serialConnection;
const { tr } = useI18n();

interface ActionButton {
    theme: "brand" | "alt";
    text: string;
    href: string;
}

const dynamicButtons = computed((): ActionButton[] => {
    const defaultButtons: ActionButton[] = [
        {
            theme: "brand",
            text: tr("install"),
            href: "/update",
        },
        {
            theme: "alt",
            text: tr("nav_releases"),
            href: "/releases",
        },
    ];

    if (connectionData.state !== ConnectionState.CONNECTED || !connectionData.deviceInfo) {
        return defaultButtons;
    }

    const deviceInfo = connectionData.deviceInfo;
    const currentVersion = deviceInfo.firmware_version || "Unknown";
    const versionMatch = currentVersion.match(/mntm-(\d+(?:\.\d+)*)/);
    const shortVersion = versionMatch ? versionMatch[1] : currentVersion;

    const connectedButtons: ActionButton[] = [
        {
            theme: "brand",
            text: `Update from ${shortVersion}`,
            href: "/update",
        },
        {
            theme: "alt",
            text: "Device Info",
            href: "#device-info",
        },
    ];

    return connectedButtons;
});

onMounted(() => {
    console.log(useData());
    console.log(useRoute());
});
</script>

<template>
    <div
        class="flex flex-wrap items-center justify-center pt-6 transition-all duration-200 sm:pt-8"
    >
        <div
            v-for="button in dynamicButtons"
            :key="button.href"
            class="flex-shrink-0 p-1.5 transition-all duration-200"
        >
            <VPButton
                tag="a"
                size="medium"
                :theme="button.theme"
                :text="button.text"
                :href="button.href"
            />
        </div>
    </div>
</template>
