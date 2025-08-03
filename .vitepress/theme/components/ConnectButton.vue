<script setup lang="ts">
import { useMagicKeys, useWindowSize, whenever } from "@vueuse/core";
import { useRoute } from "vitepress";
import { computed, onMounted, ref, watch } from "vue";
import { useConnectionInfo } from "../composables/useConnectionInfo";
import { useDots } from "../composables/useDots";
import { formatDate } from "../date";
import { ConnectionState } from "../types";
import { supportsSerialPort } from "../util";

import { MessageSchema } from ".vitepress/i18n";
import AutoconnectToggle from "./AutoconnectToggle.vue";
import Tooltip from "./Tooltip.vue";

const width = ref(1024);
const route = useRoute();

const {
    connectionData,
    flags,
    firmwareState,
    connectionState,
    deviceInfo,
    isConnected,
    versionInReleases,
    sdCardUsage,
    getRadioVersion,
    copyState,
    saveState,
    exportDeviceInfo,
    handleConnect,
    handleDisconnect,
    tr,
    getLocalizedPath,
} = useConnectionInfo();

const flyoutOpen = ref(false);
const autoOpenTimeout = ref<NodeJS.Timeout | null>(null);
const isAutoOpen = ref(false);
const { dots: connectingDots } = useDots();
const { dots: hardwareNameDots } = useDots();
const dotsState = computed(() => {
    return connectionState.value === "connecting" || connectionState.value === "disconnecting";
});
const isUpdatePage = computed(() => route.path.includes("/update"));
const updateStage = computed(() => firmwareState.value.updateStage || "");

const getConnectionDisplay = computed(() => {
    if (!supportsSerialPort()) {
        return {
            text: tr("connection_serial_not_supported"),
            indicatorClass: "bg-red-500 animate-pulse border border-red-600",
        };
    }

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
                indicatorClass: "bg-yellow-500 animate-pulse border border-yellow-600",
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

const formatBuildDate = (date: string) => {
    const isoDate = date.split("-").reverse().join("-");
    return formatDate(isoDate, "fullYear");
};

const checkConnect = () => {
    if (supportsSerialPort()) {
        handleConnect();
    }
};

const handleMouse = (v: boolean) => {
    if (!isAutoOpen.value && !isUpdatePage.value) {
        flyoutOpen.value = v;
    }
};

const { cmd_c } = useMagicKeys({
    passive: false,
    onEventFired(e) {
        if (e.metaKey && e.key === "c" && e.type === "keyup") e.preventDefault();
    },
});
whenever(cmd_c, () => checkConnect());

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
</script>

<template>
    <div class="flex items-center mr-auto">
        <div
            :class="['VPFlyout ml-8', supportsSerialPort() && isUpdatePage && '!hidden']"
            @mouseenter="handleMouse(true)"
            @mouseleave="handleMouse(false)"
        >
            <div :class="['flex items-center justify-center h-[var(--vp-nav-height)]']">
                <Tooltip
                    :disabled="supportsSerialPort()"
                    :delay="0"
                    :hide-delay="100"
                    :z-index="9999"
                    :offset="4"
                    position="bottom"
                >
                    <button
                        :class="[
                            `connect-button shadow-sm rounded-lg group flex items-center pl-2.5 pr-2.5 h-[40px] w-auto whitespace-nowrap overflow-hidden min-w-fit transition-all duration-100 ease-in-out ${(connectionState === ConnectionState.DISCONNECTED || connectionState === ConnectionState.ERROR) && supportsSerialPort() ? 'cursor-pointer' : '!cursor-default'}`,
                        ]"
                        type="button"
                        :aria-expanded="flyoutOpen"
                        @click="checkConnect"
                    >
                        <div
                            v-if="flags.updateInProgress"
                            class="relative w-4 h-4 rounded-full flex items-center justify-center mr-2"
                        >
                            <div
                                class="absolute inset-0 rounded-full border-2 border-transparent border-t-vp-alternate-1 animate-spin"
                            ></div>
                        </div>
                        <span v-else class="relative flex size-2 mr-2">
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
                                    isConnected && !flags.updateInProgress ? 'mr-3' : ''
                                }`,
                            ]"
                        >
                            {{
                                flags.updateInProgress
                                    ? tr(updateStage as any) || tr("update_stage_updating_short")
                                    : getConnectionDisplay.text
                            }}
                        </span>
                        <span
                            v-if="isConnected && !flags.updateInProgress"
                            :class="`text-sm font-medium text-vp-2 min-h-[1.25rem] mr-px text-left ${
                                !deviceInfo?.hardware_name ? 'w-3' : ''
                            }`"
                        >
                            {{ deviceInfo?.hardware_name || hardwareNameDots }}
                        </span>
                        <span
                            v-if="dotsState"
                            :class="[
                                'text-sm font-medium w-3 text-left ml-px min-h-[1.25rem] flex items-center',
                                dotsState ? 'mr-2' : '',
                            ]"
                        >
                            {{ connectingDots }}
                        </span>

                        <div
                            v-if="supportsSerialPort() && connectionState === 'disconnected'"
                            class="DocSearch-Button"
                        >
                            <span class="DocSearch-Button-Keys"
                                ><kbd class="DocSearch-Button-Key"></kbd
                                ><kbd class="DocSearch-Button-Key">C</kbd></span
                            >
                        </div>
                    </button>
                    <template #content>
                        <p
                            class="text-xs text-vp-2 subtitle"
                            v-html="tr('updater_serial_unsupported_subtitle')"
                        />
                    </template>
                </Tooltip>

                <div v-if="isConnected" class="menu">
                    <div class="menu-content">
                        <div class="menu-item">
                            <span class="menu-label">{{ tr("connection_firmware") }}</span>
                            <a
                                class="menu-value vp-external-link-icon hover:underline"
                                :title="deviceInfo?.firmware_branch || ''"
                                :href="`${getLocalizedPath('/releases')}/${versionInReleases?.version || ''}`"
                                >{{
                                    deviceInfo?.firmware_version === "mntm-dev"
                                        ? `dev (${deviceInfo.firmware_commit})`
                                        : deviceInfo?.firmware_version
                                }}</a
                            >
                        </div>

                        <div class="menu-item">
                            <span class="menu-label">{{ tr("connection_build_date") }}</span>
                            <span class="menu-value">{{
                                formatBuildDate(deviceInfo?.firmware_build_date as string)
                            }}</span>
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
                                    : (deviceInfo?.storage_databases_present as string) ||
                                      tr("missing")
                            }}</span>
                        </div>

                        <div class="menu-item">
                            <span class="menu-label">{{ tr("connection_radio_fw") }}</span>
                            <span class="menu-value">{{ getRadioVersion }}</span>
                        </div>

                        <div class="menu-actions">
                            <div class="action-buttons">
                                <Tooltip v-if="deviceInfo" :delay="0" :z-index="9999">
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
                                <Tooltip v-if="deviceInfo" :delay="0" :z-index="9999">
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
                                    :disabled="flags.updateInProgress"
                                    :class="[
                                        'action-button !text-red-500 !bg-red-500/10 dark:!bg-red-500/10',
                                        flags.updateInProgress && 'opacity-50 !cursor-not-allowed',
                                        !flags.updateInProgress &&
                                            'dark:hover:!bg-red-500/15 hover:!bg-red-500/25 hover:!text-red-600',
                                    ]"
                                    @click="handleDisconnect"
                                >
                                    {{ tr("connection_disconnect") }}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div v-if="supportsSerialPort()" :class="isUpdatePage ? 'ml-8' : 'ml-3'">
            <AutoconnectToggle />
        </div>
    </div>
</template>

<style scoped>
.subtitle :deep(a) {
    @apply text-vp-brand-1 hover:text-vp-brand-2 hover:underline transition-colors duration-100 font-medium;
}

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
