<script setup lang="ts">
import { useMagicKeys, useWindowSize, whenever } from "@vueuse/core";
import { useRoute } from "vitepress";
import { computed, inject, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from "vue";
import { formatDate } from "../date";
import { ConnectionState } from "../types";
import { supportsBluetooth, supportsSerialPort } from "../util";

import { MessageSchema } from ".vitepress/i18n";
import {
    useConnectionInfo,
    useDots,
    useSettings,
    useSharedHover,
    useThemeSwitcher,
    useUpdateTimer,
} from "../composables";
import type { useSerialConnection } from "../composables/useSerialConnection";
import SettingsIcon from "./SettingsIcon.vue";
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
    handleConnectBluetooth,
    handleDisconnect,
    tr,
    getLocalizedPath,
} = useConnectionInfo();
const { isSettingEnabled, preferredConnection } = useSettings();
const { ifCurrentTheme } = useThemeSwitcher();

const serialConnection = inject<ReturnType<typeof useSerialConnection> | null>("serialConnection");
const { timerDisplayCompact } = useUpdateTimer(
    serialConnection?.firmwareState || { updateTimerElapsed: null },
);

const flyoutOpen = ref(false);
const pickMode = ref(false);
const metaHeld = ref(false);
const autoOpenTimeout = ref<NodeJS.Timeout | null>(null);
const isAutoOpen = ref(false);
const { dots: connectingDots } = useDots();
const { dots: hardwareNameDots } = useDots();
const dotsState = computed(() => {
    return connectionState.value === "connecting" || connectionState.value === "disconnecting";
});
const isUpdatePage = computed(() => route.path.includes("/update"));
const updateStage = computed(() => firmwareState.value.updateStage || "");
const updateStageContext = computed(() => firmwareState.value.updateStageContext || {});
const { isHovered: isInstallButtonHovered } = useSharedHover("disabled-install-button");

const flyoutRef = useTemplateRef<HTMLElement>("flyoutRef");

const canConnect = computed(() => supportsSerialPort() || supportsBluetooth());

const showUSBButton = computed(() => {
    if (!supportsSerialPort()) return false;
    if (preferredConnection.value === "bt") return false;
    return true;
});

const showBTButton = computed(() => {
    if (!supportsBluetooth()) return false;
    if (preferredConnection.value === "usb") return false;
    return true;
});

const showSingleConnectButton = computed(() => {
    return (
        (showUSBButton.value && !showBTButton.value) || (showBTButton.value && !showUSBButton.value)
    );
});

const getConnectionDisplay = computed(() => {
    if (!canConnect.value) {
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

const showTransportPicker = computed(
    () =>
        supportsSerialPort() &&
        supportsBluetooth() &&
        preferredConnection.value === "both" &&
        !isConnected.value &&
        connectionState.value === "disconnected",
);

const singleTransportIcon = computed(() => {
    if (preferredConnection.value === "bt") return "md-bluetooth";
    return "md-usb";
});

const connectionIcon = computed(() => {
    if (!isConnected.value) return null;
    return flags.value.connectionTransport === "bt" ? "md-bluetooth" : "md-usb";
});

const checkConnect = () => {
    if (isConnected.value) return;
    if (showTransportPicker.value) {
        pickMode.value = true;
        return;
    }
    const pref = preferredConnection.value;
    if (pref === "bt" || (!supportsSerialPort() && supportsBluetooth())) {
        handleConnectBluetooth();
    } else {
        handleConnect();
    }
};

const connectUSB = () => {
    pickMode.value = false;
    metaHeld.value = false;
    handleConnect();
};
const connectBT = (showAll = false) => {
    pickMode.value = false;
    metaHeld.value = false;
    handleConnectBluetooth(showAll);
};

const handleMouseDownOutside = (e: MouseEvent) => {
    if (!pickMode.value) return;
    if (flyoutRef.value && !flyoutRef.value.contains(e.target as Node)) {
        pickMode.value = false;
    }
};

onMounted(() => {
    document.addEventListener("mousedown", handleMouseDownOutside);
});

onBeforeUnmount(() => {
    document.removeEventListener("mousedown", handleMouseDownOutside);
});

const handleMouse = (v: boolean) => {
    if (!isAutoOpen.value && !isUpdatePage.value) {
        flyoutOpen.value = v;
    }
};

const { cmd_enter, cmd_u, cmd_b } = useMagicKeys({
    passive: false,
    onEventFired(e) {
        if (e.metaKey && e.key === "enter" && e.type === "keyup") e.preventDefault();
        if ((e.key === "Meta" || e.key === "Control") && showTransportPicker.value) {
            metaHeld.value = e.type === "keydown";
        }
        if (pickMode.value && e.type === "keydown" && !e.metaKey && !e.ctrlKey) {
            if (e.key === "u" || e.key === "U") {
                e.preventDefault();
                connectUSB();
            }
            if (e.key === "b" || e.key === "B") {
                e.preventDefault();
                connectBT();
            }
            if (e.key === "Escape") {
                e.preventDefault();
                pickMode.value = false;
            }
        }
    },
});
whenever(cmd_enter, () => checkConnect());
whenever(cmd_u, () => {
    if (showTransportPicker.value) connectUSB();
});
whenever(cmd_b, () => {
    if (showTransportPicker.value) connectBT();
});

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

watch(pickMode, (val) => {
    if (val) {
        flyoutOpen.value = false;
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
    <Tooltip
        :delay="400"
        :z-index="9999"
        :offset="13"
        position="right"
        :accept-hover="false"
        :force-visible="isInstallButtonHovered && !isSettingEnabled('autoConnect')"
        class="mr-auto"
    >
        <div ref="flyoutRef" class="flex items-center ml-8 gap-x-3">
            <SettingsIcon />

            <div
                :class="['VPFlyout', canConnect]"
                @mouseenter="handleMouse(true)"
                @mouseleave="handleMouse(false)"
            >
                <div :class="['flex items-center justify-center h-[var(--vp-nav-height)]']">
                    <!-- Pick mode: show USB + BT side by side -->
                    <div
                        v-if="(pickMode || metaHeld) && showTransportPicker"
                        class="flex flex-col items-center gap-2"
                    >
                        <div class="flex items-center gap-2">
                            <button
                                class="connect-button-action bg-vp-dark shadow-sm rounded-lg group flex items-center h-[40px] whitespace-nowrap transition-all select-none duration-100 ease-in-out cursor-pointer"
                                type="button"
                                @click="connectUSB"
                            >
                                <v-icon
                                    name="md-usb"
                                    scale="0.85"
                                    class="flex-shrink-0 ml-2.5 mr-2 opacity-65"
                                />
                                <span class="text-sm font-medium">Web Serial</span>
                                <kbd
                                    class="bg-vp-soft-mute border border-vp-divider rounded px-1.5 py-1 text-[11px] leading-none text-vp-2 font-mono font-medium ml-3 mr-[9px]"
                                    >U</kbd
                                >
                            </button>
                            <Tooltip :delay="0" :z-index="9999" :offset="4" position="bottom">
                                <button
                                    class="connect-button-action bg-vp-dark shadow-sm rounded-lg group flex items-center h-[40px] whitespace-nowrap transition-all select-none duration-100 ease-in-out cursor-pointer"
                                    type="button"
                                    @click="connectBT(false)"
                                >
                                    <v-icon
                                        name="md-bluetooth"
                                        scale="0.85"
                                        class="flex-shrink-0 ml-2.5 mr-2 opacity-65"
                                    />
                                    <span class="text-sm font-medium">Bluetooth</span>
                                    <kbd
                                        class="bg-vp-soft-mute border border-vp-divider rounded px-1.5 py-1 text-[11px] leading-none text-vp-2 font-mono font-medium ml-3 mr-[9px]"
                                        >B</kbd
                                    >
                                </button>
                                <template #content>{{
                                    tr("connection_bt_recommended_usb")
                                }}</template>
                            </Tooltip>
                        </div>
                    </div>

                    <!-- Normal connect button -->
                    <Tooltip
                        v-else
                        :disabled="canConnect"
                        :delay="0"
                        :hide-delay="100"
                        :z-index="9999"
                        :offset="4"
                        position="bottom"
                    >
                        <button
                            :class="[
                                `connect-button bg-vp-dark shadow-sm rounded-lg group flex items-center pl-[11px] pr-3 h-[40px] min-w-10 w-auto whitespace-nowrap overflow-hidden transition-all select-none duration-100 ease-in-out ${(connectionState === ConnectionState.DISCONNECTED || connectionState === ConnectionState.ERROR) && canConnect ? 'cursor-pointer' : '!cursor-default'}`,
                                canConnect &&
                                    connectionState === 'disconnected' &&
                                    showTransportPicker &&
                                    '!pr-[7px]',
                            ]"
                            type="button"
                            :aria-expanded="flyoutOpen"
                            @click="checkConnect"
                        >
                            <div
                                v-if="flags.updateInProgress"
                                class="relative w-4 h-4 rounded-full flex items-center justify-center"
                            >
                                <div
                                    class="absolute inset-0 rounded-full border-2 border-transparent animate-spin"
                                    :class="
                                        ifCurrentTheme(['white'])
                                            ? 'border-t-vp-brand-1'
                                            : 'border-t-vp-alternate-1'
                                    "
                                ></div>
                            </div>
                            <span
                                v-if="flags.updateInProgress && timerDisplayCompact"
                                class="text-xs ml-2.5 font-mono text-vp-2 tabular-nums"
                                >{{ timerDisplayCompact }}</span
                            >
                            <span
                                v-if="
                                    (!flags.updateInProgress || !timerDisplayCompact) &&
                                    (connectionIcon ||
                                        (!showTransportPicker &&
                                            !singleTransportIcon &&
                                            connectionState === 'disconnected'))
                                "
                                class="flex items-center"
                                :class="flags.updateInProgress ? 'ml-2 mr-2 hidden' : 'mr-2'"
                                :style="isConnected ? 'color: rgb(34 197 94)' : ''"
                            >
                                <v-icon
                                    :name="connectionIcon || singleTransportIcon"
                                    scale="0.9"
                                    :class="
                                        isConnected && !flags.updateInProgress
                                            ? 'animate-pulse'
                                            : ''
                                    "
                                />
                            </span>
                            <span
                                v-else-if="!flags.updateInProgress"
                                class="relative flex size-2 mr-2"
                            >
                                <span
                                    v-if="isConnected"
                                    :class="`absolute inline-flex h-full w-full animate-ping rounded-full ${getConnectionDisplay.indicatorClass} opacity-75`"
                                ></span>
                                <span
                                    :class="`relative inline-flex size-2 rounded-full transition-all duration-100 ease-in-out ${getConnectionDisplay.indicatorClass}`"
                                ></span>
                            </span>

                            <span :class="[`connect-button-text text-sm font-medium min-h-5`]">
                                {{
                                    isUpdatePage && !flags.updateInProgress
                                        ? getConnectionDisplay.text
                                        : !isUpdatePage
                                          ? flags.updateInProgress
                                              ? tr(
                                                    updateStage as keyof MessageSchema,
                                                    updateStageContext,
                                                ) || tr("update_stage_updating_short")
                                              : getConnectionDisplay.text
                                          : ""
                                }}
                            </span>

                            <span
                                v-if="isConnected && !flags.updateInProgress"
                                :class="`text-sm font-medium text-vp-2 min-h-[1.25rem] ml-[7px] text-left ${
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
                                v-if="
                                    canConnect &&
                                    connectionState === 'disconnected' &&
                                    showTransportPicker
                                "
                                class="DocSearch-Button"
                            >
                                <span class="DocSearch-Button-Keys"
                                    ><kbd class="DocSearch-Button-Key"></kbd
                                    ><kbd
                                        class="DocSearch-Button-Key"
                                        :class="!showSingleConnectButton && '!pl-0'"
                                        >{{ showSingleConnectButton ? "↵" : "" }}</kbd
                                    ></span
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

                    <div v-if="isConnected && !isUpdatePage" class="menu">
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
                                            class="action-button export-button !text-vp-2 hover:!text-vp-brand-1 transition-transform duration-100 ease-out flex items-center justify-center"
                                            :aria-label="copyState.currentText.value"
                                            @click="() => exportDeviceInfo('copy')"
                                            @mousedown="copyState.handleMouseDown"
                                            @mouseup="copyState.handleMouseUp"
                                            @mouseleave="copyState.handleMouseLeave"
                                        >
                                            <v-icon
                                                :class="{
                                                    'scale-95': copyState.isPressed.value,
                                                }"
                                                :name="copyState.currentIcon.value"
                                                :scale="
                                                    copyState.currentIcon.value === 'oi-check'
                                                        ? 0.95
                                                        : 0.8
                                                "
                                            />
                                        </button>
                                        <template #content>{{
                                            copyState.currentText.value
                                        }}</template>
                                    </Tooltip>
                                    <Tooltip v-if="deviceInfo" :delay="0" :z-index="9999">
                                        <button
                                            class="action-button export-button !text-vp-2 hover:!text-vp-brand-1 transition-transform duration-100 ease-out flex items-center justify-center"
                                            :aria-label="saveState.currentText.value"
                                            @click="() => exportDeviceInfo('save')"
                                            @mousedown="saveState.handleMouseDown"
                                            @mouseup="saveState.handleMouseUp"
                                            @mouseleave="saveState.handleMouseLeave"
                                        >
                                            <v-icon
                                                :class="{
                                                    'scale-95': saveState.isPressed.value,
                                                }"
                                                :name="saveState.currentIcon.value"
                                                :scale="
                                                    saveState.currentIcon.value === 'oi-check'
                                                        ? 0.95
                                                        : 0.8
                                                "
                                            />
                                        </button>
                                        <template #content>{{
                                            saveState.currentText.value
                                        }}</template>
                                    </Tooltip>
                                    <button
                                        :disabled="flags.updateInProgress"
                                        :class="[
                                            'action-button !text-red-500 !bg-red-500/10 dark:!bg-red-950/30 select-none',
                                            flags.updateInProgress &&
                                                'opacity-50 !cursor-not-allowed',
                                            !flags.updateInProgress &&
                                                'dark:hover:!bg-red-900/25 hover:!bg-red-500/25 hover:!text-red-600',
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
        </div>
        <template #content>{{
            isSettingEnabled("autoConnect")
                ? tr("connection_autoconnect_enabled")
                : tr("connection_autoconnect_disabled")
        }}</template>
    </Tooltip>
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

.connect-button-action {
    border: 1px solid var(--vp-c-divider);
    color: var(--vp-c-text-1);
    transition:
        border-color 0.1s ease-in-out,
        background-color 0.1s ease-in-out,
        color 0.1s ease-in-out;
}

.connect-button-action:hover {
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

/* .VPFlyout:hover {
    color: var(--vp-c-brand-1);
    transition: color 0.25s;
} */

.VPFlyout:hover .connect-button-action {
    color: var(--vp-c-text-1);
}

.VPFlyout:hover .connect-button-action:hover {
    color: var(--vp-c-brand-1);
}

.connect-button[aria-expanded="false"] + .menu {
    opacity: 0;
    visibility: hidden;
    transform: translateY(0) translateX(0);
}

.VPFlyout:hover .menu,
.connect-button[aria-expanded="true"] + .menu {
    opacity: 1;
    visibility: visible;
    transform: translateY(0) translateX(0);
}

@media (min-width: 1024px) {
    .connect-button[aria-expanded="false"] + .menu {
        transform: translateY(0) translateX(0);
    }

    .VPFlyout:hover .menu,
    .connect-button[aria-expanded="true"] + .menu {
        transform: translateY(0) translateX(0);
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
        left: 0;
        transform: translateX(0);
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
    user-select: none;
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

.export-button {
    background-color: color-mix(in srgb, var(--vp-c-bg-dark) 60%, transparent) !important;
    border: 1px solid color-mix(in srgb, var(--vp-c-divider) 50%, transparent);
    width: 38px !important;
    padding: 0;
    line-height: 40px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 40px;
    box-sizing: border-box;
}

.export-button:hover {
    background-color: color-mix(in srgb, var(--vp-c-default-soft) 100%, transparent) !important;
}

.action-buttons {
    display: flex;
    gap: 8px;
    flex-wrap: nowrap;
}

.action-button {
    display: inline-block;
    border-radius: 8px;
    line-height: 32px;
    font-size: 14px;
    font-weight: 500;
    color: var(--vp-c-text-1);
    white-space: nowrap;
    background: none;
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
