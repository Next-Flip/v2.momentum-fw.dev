<script setup lang="ts">
import { useClipboard, useMagicKeys, useObjectUrl, useWindowSize, whenever } from "@vueuse/core";
import { computed, inject, onMounted, ref, shallowRef, watch } from "vue";
import { getReleaseByCommit } from "../../../_data/releases";
import { useDots } from "../composables/useDots";
import { useI18n } from "../composables/useI18n";
import type { useSerialConnection } from "../composables/useSerialConnection";
import { useTempState } from "../composables/useTempState";
import { ConnectionState } from "../types";
import { bytesToSize, getRadioStackType } from "../util";

import { MessageSchema } from ".vitepress/i18n";
import Tooltip from "./Tooltip.vue";

const { tr, getLocalizedPath } = useI18n();
const width = ref(1024);

onMounted(() => {
    if (typeof window !== "undefined") {
        const { width: windowWidth } = useWindowSize();
        width.value = windowWidth.value;

        watch(
            () => windowWidth.value,
            (newWidth) => {
                width.value = newWidth;
            },
        );
    }
});

const serialConnection = inject<ReturnType<typeof useSerialConnection> | null>("serialConnection");
const connectionData = computed(
    () =>
        serialConnection?.connectionData || {
            state: ConnectionState.DISCONNECTED,
            error: undefined,
            deviceInfo: undefined,
        },
);
const flags = computed(
    () =>
        serialConnection?.flags || {
            connected: false,
        },
);

const connectionState = computed(() => connectionData.value.state);
const deviceInfo = computed(() => connectionData.value.deviceInfo);
const isConnected = computed(() => connectionState.value === "connected");
const commitInReleases = computed(() =>
    getReleaseByCommit(deviceInfo.value?.firmware_commit || ""),
);

const flyoutOpen = ref(false);
const autoOpenTimeout = ref<NodeJS.Timeout | null>(null);
const isAutoOpen = ref(false);
const { dots: connectingDots } = useDots();
const { dots: hardwareNameDots } = useDots();

watch(connectionState, (newState, oldState) => {
    if (newState === "connected" && oldState !== "connected") {
        if (autoOpenTimeout.value) {
            clearTimeout(autoOpenTimeout.value);
        }

        isAutoOpen.value = true;
        flyoutOpen.value = true;
        autoOpenTimeout.value = setTimeout(() => {
            flyoutOpen.value = false;
            isAutoOpen.value = false;
            autoOpenTimeout.value = null;
        }, 2000);
    }
});

const copyState = useTempState({
    beforeIcon: "oi-copy",
    afterIcon: "oi-check",
    beforeText: () => tr("copy_device_info"),
    afterText: () => tr("copied"),
});

const saveState = useTempState({
    beforeIcon: "ri-save-line",
    afterIcon: "oi-check",
    beforeText: () => tr("save_device_info"),
    afterText: () => tr("saved"),
});

const sdCardUsage = computed(() => {
    const device = deviceInfo.value;
    const totalSpace = device?.storage_sdcard_totalSpace;
    const freeSpace = device?.storage_sdcard_freeSpace;
    const present = device?.storage_sdcard_present;

    if (present === "loading") return "...";
    if (!totalSpace || freeSpace === undefined) return null;

    const usedSpace = totalSpace - freeSpace;
    return `${bytesToSize(usedSpace)} / ${bytesToSize(totalSpace)}`;
});

const radioFwVersion = computed(() => {
    const device = deviceInfo.value;
    return device?.radio_alive !== false
        ? device?.radio_stack_major +
              "." +
              device?.radio_stack_minor +
              "." +
              device?.radio_stack_sub
        : tr("corrupt");
});

const radioStackType = computed(() => {
    return getRadioStackType(deviceInfo.value?.radio_stack_type);
});

const getRadioVersion = computed(() => {
    const version = radioFwVersion.value;
    const type = radioStackType.value;
    return version == undefined || type == undefined ? "" : version + " " + type;
});

const getConnectionDisplay = computed(() => {
    switch (connectionState.value) {
        case "connecting":
            return {
                text: width.value < 1024 ? "" : tr("connection_connecting"),
                indicatorClass: "bg-yellow-500 animate-pulse border border-yellow-600",
            };
        case "connected":
            return {
                text: tr("connection_connected"),
                indicatorClass: "bg-green-500 border border-green-600",
            };
        case "disconnecting":
            return {
                text: width.value < 1024 ? "" : tr("connection_disconnecting"),
                indicatorClass: "bg-red-500 animate-pulse border border-red-600",
            };
        case "error":
            return {
                text: `${tr("connection_error")}: ${tr(connectionData.value.error as keyof MessageSchema)}`,
                indicatorClass: "bg-red-500 animate-pulse border border-red-600",
            };
        default:
            return {
                text: tr("connection_connect"),
                indicatorClass: "bg-vp-3/30 group-hover:bg-vp-3/80",
            };
    }
});

const exportDeviceInfo = async (action: "copy" | "save") => {
    if (!deviceInfo.value) return;
    const jsonString = JSON.stringify(deviceInfo.value, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });

    if (action === "copy") {
        useClipboard().copy(jsonString);
        copyState.trigger();
    } else if (action === "save") {
        const url = useObjectUrl(shallowRef(blob));
        const link = document.createElement("a");
        link.href = url.value || "";
        link.download = `${deviceInfo.value?.hardware_name || "flipper"}-device-info-${new Date().toISOString().split("T")[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url.value || "");
        saveState.trigger();
    }
};

const handleMouse = (v: boolean) => {
    if (!isAutoOpen.value) {
        flyoutOpen.value = v;
    }
};

const handleConnect = async () => {
    if (!flags.value.connected && connectionState.value !== "disconnecting" && serialConnection) {
        await serialConnection.connect();
    }
};

const handleDisconnect = async () => {
    flyoutOpen.value = false;
    if (serialConnection) {
        await serialConnection.disconnect();
    }
};

const { cmd_c } = useMagicKeys({
    passive: false,
    onEventFired(e) {
        if (e.metaKey && e.key === "c" && e.type === "keyup") e.preventDefault();
    },
});
whenever(cmd_c, () => handleConnect());
</script>

<template>
    <div
        :class="['VPFlyout connect-container ml-8']"
        @mouseenter="handleMouse(true)"
        @mouseleave="handleMouse(false)"
    >
        <div :class="['flex items-center justify-center h-[var(--vp-nav-height)]']">
            <button
                @click="handleConnect"
                :class="[
                    `connect-button shadow-sm rounded-lg group flex items-center pl-2.5 pr-2.5 h-[40px] w-auto whitespace-nowrap overflow-hidden min-w-fit transition-all duration-100 ease-in-out ${connectionState === ConnectionState.DISCONNECTED || connectionState === ConnectionState.ERROR ? 'cursor-pointer' : '!cursor-default'}`,
                ]"
                type="button"
                :aria-expanded="flyoutOpen"
            >
                <span class="relative flex size-2 mr-2">
                    <span
                        v-if="isConnected"
                        :class="`absolute inline-flex h-full w-full animate-ping rounded-full ${getConnectionDisplay.indicatorClass} opacity-75`"
                    ></span>
                    <span
                        :class="`relative inline-flex size-2 rounded-full transition-all duration-100 ease-in-out ${getConnectionDisplay.indicatorClass}`"
                    ></span>
                </span>

                <span
                    :class="[
                        `connect-button-text text-sm font-medium min-h-5 ${
                            isConnected ? 'mr-3' : ''
                        }`,
                    ]"
                >
                    {{ getConnectionDisplay.text }}
                </span>
                <span
                    v-if="isConnected"
                    :class="`text-sm font-medium text-vp-2 min-h-[1.25rem] mr-px text-left ${
                        !deviceInfo?.hardware_name ? 'w-3' : ''
                    }`"
                >
                    {{ deviceInfo?.hardware_name || hardwareNameDots }}
                </span>
                <span
                    v-if="connectionState === 'connecting' || connectionState === 'disconnecting'"
                    :class="[
                        'text-sm font-medium w-3 text-left ml-px min-h-[1.25rem] flex items-center',
                        connectionState === 'connecting' || connectionState === 'disconnecting'
                            ? 'mr-2'
                            : '',
                    ]"
                >
                    {{ connectingDots }}
                </span>

                <div class="DocSearch-Button" v-if="connectionState === 'disconnected'">
                    <span class="DocSearch-Button-Keys"
                        ><kbd class="DocSearch-Button-Key"></kbd
                        ><kbd class="DocSearch-Button-Key">C</kbd></span
                    >
                </div>
            </button>

            <div class="menu" v-if="isConnected">
                <div class="menu-content">
                    <div class="menu-item">
                        <span class="menu-label">{{ tr("connection_firmware") }}</span>
                        <a
                            class="menu-value vp-external-link-icon hover:underline"
                            :title="deviceInfo?.firmware_branch || ''"
                            :href="`${getLocalizedPath('/releases/')}/${commitInReleases?.commit || ''}`"
                            >{{
                                deviceInfo?.firmware_version?.includes("dev")
                                    ? `dev (${deviceInfo.firmware_commit})`
                                    : deviceInfo?.firmware_version
                            }}</a
                        >
                    </div>

                    <div class="menu-item">
                        <span class="menu-label">{{ tr("connection_build_date") }}</span>
                        <span class="menu-value">{{ deviceInfo?.firmware_build_date }}</span>
                    </div>

                    <div class="menu-item">
                        <span class="menu-label">{{ tr("connection_sd_card") }}</span>
                        <span class="menu-value">{{ sdCardUsage }}</span>
                    </div>

                    <div class="menu-item">
                        <span class="menu-label">{{ tr("connection_databases") }}</span>
                        <span class="menu-value">{{
                            deviceInfo?.storage_databases_present === "loading"
                                ? "..."
                                : (deviceInfo?.storage_databases_present as string) || tr("missing")
                        }}</span>
                    </div>

                    <div class="menu-item">
                        <span class="menu-label">{{ tr("connection_radio_fw") }}</span>
                        <span class="menu-value">{{ getRadioVersion }}</span>
                    </div>

                    <div class="menu-actions">
                        <div class="action-buttons">
                            <Tooltip v-if="deviceInfo" :delay="0" :zIndex="9999">
                                <button
                                    class="action-button export-button !w-min !text-vp-2 hover:!text-vp-brand-1 transition-transform duration-100 ease-out flex items-center justify-center"
                                    :class="{
                                        'scale-95': copyState.isPressed.value,
                                    }"
                                    :aria-label="copyState.currentText.value"
                                    @click="() => exportDeviceInfo('copy')"
                                    @mousedown="copyState.handleMouseDown"
                                    @mouseup="copyState.handleMouseUp"
                                    @mouseleave="copyState.handleMouseLeave"
                                >
                                    <v-icon :name="copyState.currentIcon.value" scale="0.8" />
                                </button>
                                <template #content>{{ copyState.currentText.value }}</template>
                            </Tooltip>
                            <Tooltip v-if="deviceInfo" :delay="0" :zIndex="9999">
                                <button
                                    class="action-button export-button !w-min !text-vp-2 hover:!text-vp-brand-1 transition-transform duration-100 ease-out flex items-center justify-center"
                                    :class="{
                                        'scale-95': saveState.isPressed.value,
                                    }"
                                    :aria-label="saveState.currentText.value"
                                    @click="() => exportDeviceInfo('save')"
                                    @mousedown="saveState.handleMouseDown"
                                    @mouseup="saveState.handleMouseUp"
                                    @mouseleave="saveState.handleMouseLeave"
                                >
                                    <v-icon :name="saveState.currentIcon.value" scale="0.8" />
                                </button>
                                <template #content>{{ saveState.currentText.value }}</template>
                            </Tooltip>
                            <button
                                @click="handleDisconnect"
                                class="action-button !text-red-500 hover:!text-red-600 !bg-red-500/10 hover:!bg-red-500/25 dark:!bg-red-500/10 dark:hover:!bg-red-500/15"
                            >
                                {{ tr("connection_disconnect") }}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
@media (max-width: 956px) {
    .connect-nav-bar {
        display: none !important;
    }
}

.export-button {
    background-color: color-mix(in srgb, var(--vp-c-bg-soft) 60%, transparent) !important;
}

.export-button:hover {
    background-color: color-mix(in srgb, var(--vp-c-default-soft) 100%, transparent) !important;
}

.DocSearch-Button {
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 0;
    margin-left: 16px;
    padding: 0;
    width: min-content;
    height: min-content;
    background: transparent;
    transition: border-color 0.25s;
    pointer-events: none !important;
}

.DocSearch-Button * {
    pointer-events: none;
}

.connect-container {
    margin-right: auto;
}

.connect-button {
    border: 1px solid var(--vp-c-divider);
    width: auto;
    transition:
        border-color 0.1s ease-in-out,
        background-color 0.1s ease-in-out,
        color 0.1s ease-in-out;
}

.connect-button:hover {
    border-color: var(--vp-c-brand-1);
    background-color: color-mix(in srgb, var(--vp-c-bg-soft) 55%, transparent);
    color: var(--vp-c-text-2);
}

.VPFlyout {
    position: relative;
}

body[data-route*="/wiki"] {
    .VPFlyout {
        margin-left: 0;
    }
}

.VPFlyout:hover {
    color: var(--vp-c-brand-1);
    transition: color 0.25s;
}

.connect-button[aria-expanded="false"] + .menu {
    opacity: 0;
    visibility: hidden;
    transform: translateY(0) translateX(calc(-50%));
}

.VPFlyout:hover .menu,
.connect-button[aria-expanded="true"] + .menu {
    opacity: 1;
    visibility: visible;
    transform: translateY(0) translateX(calc(-50%));
}

@media (min-width: 1024px) {
    .connect-button[aria-expanded="false"] + .menu {
        transform: translateY(0) translateX(calc(-50%));
    }

    .VPFlyout:hover .menu,
    .connect-button[aria-expanded="true"] + .menu {
        transform: translateY(0) translateX(calc(-50%));
    }
}

.menu {
    position: absolute;
    top: calc(var(--vp-nav-height) / 2 + 24px);
    opacity: 0;
    visibility: hidden;
    transition:
        opacity 0.25s,
        visibility 0.25s,
        transform 0.25s;
    background: var(--vp-c-bg-elv);
    border: 1px solid var(--vp-c-divider);
    border-radius: 12px;
    box-shadow: var(--vp-shadow-3);
    min-width: 200px;
    max-width: max-content;
    z-index: 10;
}

@media (min-width: 1024px) {
    .menu {
        left: 50%;
        transform: translateX(calc(-50%));
        right: auto;
    }
}

.menu-content {
    display: flex;
    flex-direction: column;
    padding: 12px;
}

.menu-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 12px;
    border-radius: 4px;
    font-size: 13px;
    gap: 24px;
}

.menu-title {
    font-weight: 600;
    color: var(--vp-c-text-1);
}

.menu-status {
    color: var(--vp-c-text-2);
    font-size: 12px;
}

.menu-label {
    color: var(--vp-c-text-2);
    text-align: left;
    min-width: 65px;
}

.menu-value {
    color: var(--vp-c-text-1);
    font-weight: 500;
    text-align: right;
}

.menu-error {
    color: var(--vp-c-danger-1);
    font-size: 12px;
}

.menu-actions {
    margin: 12px -12px 0;
    border-top: 1px solid var(--vp-c-divider);
    padding: 12px 12px 0;
}

.action-buttons {
    display: flex;
    gap: 8px;
    flex-wrap: nowrap;
}

.action-button {
    display: inline-block;
    border-radius: 6px;
    padding: 0 12px;
    line-height: 32px;
    font-size: 14px;
    font-weight: 500;
    color: var(--vp-c-text-1);
    white-space: nowrap;
    background: none;
    border: none;
    cursor: pointer;
    transition:
        background-color 0.25s,
        color 0.25s;
    width: 100%;
}

.action-button:hover {
    color: var(--vp-c-brand-1);
    background-color: var(--vp-c-default-soft);
}

.action-button:active {
    color: var(--vp-c-brand-1);
}
</style>
