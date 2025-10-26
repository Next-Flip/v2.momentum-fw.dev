<script setup lang="ts">
import { useScroll, useStorage, useWindowSize } from "@vueuse/core";
import { computed, ref, useTemplateRef } from "vue";
import { formatDate } from "../date";
import type { DeviceInfo } from "../types";
import { STORAGE_KEYS } from "../types";
import { bytesToSize, supportsSerialPort } from "../util";

import {
    useConnectionInfo,
    useI18n,
    useSharedHover,
    useTempState,
    useThemeSwitcher,
} from "../composables";
import ScreenDisplay from "./ScreenDisplay.vue";
import ScrollFade from "./ScrollFade.vue";
import Tooltip from "./Tooltip.vue";

const el = useTemplateRef<HTMLElement>("el");
const { arrivedState } = useScroll(el);
const { tr } = useI18n();
const { ifCurrentTheme } = useThemeSwitcher();
const { isHovered: isInstallButtonHovered } = useSharedHover("disabled-install-button");
const { height: windowHeight } = useWindowSize();
const isNarrowViewport = computed(() => windowHeight.value < 1024);

const {
    flags,
    deviceInfo,
    isConnected: connectionIsConnected,
    connectionState,
    versionInReleases,
    getRadioVersion,
    copyState,
    saveState,
    exportDeviceInfo,
    handleConnect,
    handleDisconnect,
    tr: connectionTr,
    getLocalizedPath,
} = useConnectionInfo();

const screenDisplayRef = ref<InstanceType<typeof ScreenDisplay> | null>(null);
const screenShotState = useTempState({
    beforeIcon: "md-photocameraback-outlined",
    afterIcon: "oi-check",
    beforeText: () => tr("updater_screenshot"),
    afterText: () => tr("updater_screenshoted"),
});

const handleScreenshot = async () => {
    if (screenDisplayRef.value) {
        const success = await screenDisplayRef.value.downloadScreenshot();
        if (success) {
            screenShotState.trigger();
        }
    }
};

const getActionButtons = computed(() => {
    return [
        {
            state: copyState,
            action: () => exportDeviceInfo("copy"),
        },
        {
            state: saveState,
            action: () => exportDeviceInfo("save"),
        },
        {
            state: screenShotState,
            action: handleScreenshot,
        },
    ];
});

const isConnected = computed(() => connectionIsConnected.value);

const activeTab = useStorage<"info" | "raw">(
    STORAGE_KEYS.UPDATER_DEVICE_INFO_TAB,
    "info",
    undefined,
    { initOnMounted: true },
);
const previousTab = ref<"info" | "raw">("info");

const tabTransitionName = computed(() => {
    if (previousTab.value === "info" && activeTab.value === "raw") {
        return "tab-slide-right";
    } else if (previousTab.value === "raw" && activeTab.value === "info") {
        return "tab-slide-left";
    }
    return "tab-fade";
});

const handleTabChange = (newTab: "info" | "raw") => {
    previousTab.value = activeTab.value;
    activeTab.value = newTab;
};

const formatJsonDisplay = computed(() => {
    if (!deviceInfo.value) return "{}";
    return JSON.stringify(deviceInfo.value, null, 2);
});

const getConnectionDisplay = computed(() => {
    if (!supportsSerialPort()) {
        return {
            title: tr("updater_serial_unsupported"),
            subtitle: tr("updater_serial_unsupported_subtitle"),
            showConnectButton: false,
            showProgress: false,
        };
    }
    switch (connectionState.value) {
        case "connecting":
            return {
                title: connectionTr("connection_connecting"),
                subtitle: tr("updater_connection_subtitle"),
                showConnectButton: false,
                showProgress: true,
            };
        case "connected":
            return {
                title: tr("updater_connected"),
                subtitle: "",
                showConnectButton: false,
                showProgress: false,
            };
        case "disconnecting":
            return {
                title: connectionTr("connection_disconnecting"),
                subtitle: tr("updater_disconnect_subtitle"),
                showConnectButton: false,
                showProgress: true,
            };
        case "error":
            return {
                title: tr("updater_connection_error"),
                subtitle: tr("updater_connection_error_subtitle"),
                showConnectButton: true,
                showProgress: false,
            };
        case "locked":
            return {
                title: tr("updater_connection_locked"),
                subtitle: tr("updater_connection_locked_subtitle"),
                showConnectButton: true,
                showProgress: false,
            };
        default:
            return {
                title: tr("updater_flipper_not_connected"),
                subtitle: tr("updater_flipper_not_connected_subtitle"),
                showConnectButton: true,
                showProgress: false,
            };
    }
});

const formatBatteryVoltage = (voltage: string) => {
    if (!voltage) return tr("updater_na");
    const volts = parseInt(voltage) / 1000;
    return `${volts.toFixed(2)}V`;
};

const formatTemperature = (temp: string) => {
    if (!temp) return tr("updater_na");
    return `${temp}°C`;
};

const formatPercentage = (value: string) => {
    if (!value) return tr("updater_na");
    return `${value}%`;
};

const formatBuildDate = (date: string) => {
    const isoDate = date.split("-").reverse().join("-");
    return formatDate(isoDate, "fullYear");
};

const formatHardwareTimestamp = (timestamp: string) => {
    if (!timestamp) return tr("updater_na");
    return formatDate(parseInt(timestamp), "fullYear");
};

const formatChargeState = (state: string) => {
    if (!state) return tr("updater_na");
    return state.charAt(0).toUpperCase() + state.slice(1);
};

const getBatteryCapacity = computed(() => {
    const remain = deviceInfo.value?.capacity_remain;
    const full = deviceInfo.value?.capacity_full;
    const design = deviceInfo.value?.capacity_design;

    if (!remain || !full || !design) return tr("updater_na");
    return `${remain}/${full}mAh (${design}mAh ${tr("updater_design_suffix")})`;
});

const getStorageInfo = computed(() => {
    const device = deviceInfo.value;
    const sdTotal = device?.storage_sdcard_totalSpace;
    const sdFree = device?.storage_sdcard_freeSpace;
    const intTotal = device?.storage_internal_totalSpace;
    const intFree = device?.storage_internal_freeSpace;

    return {
        sdCard:
            sdTotal && sdFree
                ? `${bytesToSize(sdTotal - sdFree)} / ${bytesToSize(sdTotal)}`
                : tr("updater_na"),
        internal:
            intTotal && intFree
                ? `${bytesToSize(intTotal - intFree)} / ${bytesToSize(intTotal)}`
                : tr("updater_na"),
    };
});

const deviceSections = computed(() => {
    const device = deviceInfo.value as DeviceInfo;
    if (!device) return [];

    const sections = [
        {
            title: tr("updater_firmware_section"),
            items: [
                [
                    "updater_version_label",
                    device.firmware_version === "mntm-dev"
                        ? `${tr("updater_dev_prefix")} (${device.firmware_commit})`
                        : device.firmware_version,
                    `${getLocalizedPath("/releases")}/${versionInReleases.value?.version || ""}`,
                    true,
                ],
                ["updater_firmware_branch_label", device.firmware_branch],
                ["updater_build_date_label", formatBuildDate(device.firmware_build_date as string)],
                ["updater_origin_label", device.firmware_origin_fork],
                [
                    "updater_api_version_label",
                    `${device.firmware_api_major}.${device.firmware_api_minor}`,
                ],
            ],
        },
        {
            title: tr("updater_storage_section"),
            items: [
                ["updater_sd_card_label", getStorageInfo.value.sdCard],
                [
                    "updater_databases_label",
                    device.storage_databases_present === "loading"
                        ? "..."
                        : tr(device.storage_databases_present as keyof typeof tr) ||
                          connectionTr("missing"),
                ],
            ],
        },
        {
            title: tr("updater_power_section"),
            items: [
                ["updater_charge_level_label", formatPercentage(device.charge_level as string)],
                [
                    "updater_charge_state_label",
                    tr(formatChargeState(device.charge_state as string) as keyof typeof tr),
                ],
                ["updater_voltage_label", formatBatteryVoltage(device.battery_voltage as string)],
                ["updater_temperature_label", formatTemperature(device.battery_temp as string)],
                ["updater_health_label", formatPercentage(device.battery_health as string)],
                ["updater_capacity_label", getBatteryCapacity.value],
            ],
        },
        {
            title: tr("updater_hardware_section"),
            items: [
                ["updater_model_label", device.hardware_model],
                ["updater_version_hw_label", device.hardware_ver],
                ["updater_region_label", device.hardware_region_provisioned],
                ["updater_color_label", device.hardware_color],
                [
                    "updater_manufactured_label",
                    formatHardwareTimestamp(device.hardware_timestamp as string),
                ],
            ],
        },
        {
            title: tr("updater_radio_section"),
            items: [
                ["updater_stack_version_label", getRadioVersion.value],
                ["updater_ble_mac_label", device.radio_ble_mac],
                ["updater_stack_flash_label", device.radio_stack_flash],
                [
                    "updater_fus_version_label",
                    `${device.radio_fus_major}.${device.radio_fus_minor}.${device.radio_fus_sub}`,
                ],
            ],
        },
        {
            title: tr("updater_system_section"),
            items: [
                [
                    "updater_protobuf_api_label",
                    `${device.protobuf_version_major}.${device.protobuf_version_minor}`,
                ],
                [
                    "updater_debug_mode_label",
                    device.system_debug === "1" ? tr("updater_enabled") : tr("updater_disabled"),
                ],
                [
                    "updater_stealth_mode_label",
                    device.system_stealth === "1" ? tr("updater_enabled") : tr("updater_disabled"),
                ],
                [
                    "updater_enclave_label",
                    `${device.enclave_valid === "true" ? tr("updater_valid") : tr("updater_invalid")} (${device.enclave_valid_keys || 0} ${tr("updater_keys_suffix")})`,
                ],
            ],
        },
    ];

    return sections.map((section) => ({
        title: section.title,
        items: section.items.map(([labelKey, value, href, isLink]) => ({
            label: tr(labelKey as keyof typeof tr),
            value: value || tr("updater_na"),
            href: href || undefined,
            isLink: isLink || false,
        })),
    }));
});
</script>

<template>
    <div
        class="device-info-container lg:rounded-tl-xl lg:rounded-bl-xl max-h-[calc(49vh-var(--vp-nav-height))] lg:max-h-full h-full flex flex-col w-full min-w-0 max-w-full transition-all duration-100 ease-in-out lg:py-0 bg-vp-dark/85"
        :class="{
            'pt-14 lg:pt-8 lg:py-8 pb-12': !isConnected,
        }"
        :data-connected="isConnected"
        :data-hovered="isInstallButtonHovered"
    >
        <div
            v-if="!isConnected"
            class="absolute inset-0 w-full h-full box-border border border-transparent transition-all duration-100 ease-in-out lg:rounded-tl-xl lg:rounded-bl-xl"
            :class="{
                'border-vp-brand-1': isInstallButtonHovered,
            }"
        ></div>
        <Transition name="slide-down">
            <div
                v-if="isConnected"
                key="connected-controls"
                class="flex-shrink-0 hidden lg:block relative z-0"
            >
                <ScreenDisplay ref="screenDisplayRef" />

                <div
                    class="py-3 flex-shrink-0 bg-vp-dark dark:bg-vp-dark z-10"
                    :class="{
                        'sticky bottom-0': isNarrowViewport,
                    }"
                >
                    <div class="action-buttons px-5 lg:px-3">
                        <template
                            v-for="button in getActionButtons"
                            :key="button.state.currentText.value"
                        >
                            <Tooltip v-if="deviceInfo" :delay="0" :z-index="9999" :offset="6">
                                <button
                                    class="action-button export-button !text-vp-2 hover:!text-vp-brand-1 transition-transform duration-100 ease-out flex items-center justify-center"
                                    :aria-label="button.state.currentText.value"
                                    @click="() => button.action()"
                                    @mousedown="button.state.handleMouseDown"
                                    @mouseup="button.state.handleMouseUp"
                                    @mouseleave="button.state.handleMouseLeave"
                                >
                                    <v-icon
                                        :class="{
                                            'scale-95': button.state.isPressed.value,
                                        }"
                                        :name="button.state.currentIcon.value"
                                        :scale="
                                            button.state.currentIcon.value === 'oi-check'
                                                ? 0.95
                                                : 0.8
                                        "
                                    />
                                </button>
                                <template #content>{{ button.state.currentText.value }}</template>
                            </Tooltip>
                        </template>
                        <button
                            :aria-label="connectionTr('connection_disconnect')"
                            :disabled="flags.updateInProgress"
                            :class="[
                                'action-button !text-red-500 !bg-red-500/10 dark:!bg-red-500/10 select-none',
                                flags.updateInProgress &&
                                    'opacity-40 !cursor-not-allowed !bg-vp-soft !text-vp-3/70 dark:!bg-vp-soft dark:!text-vp-3/70',
                                !flags.updateInProgress &&
                                    'dark:hover:!bg-red-500/15 hover:!bg-red-500/25 hover:!text-red-600',
                            ]"
                            @click="handleDisconnect"
                        >
                            {{ connectionTr("connection_disconnect") }}
                        </button>
                    </div>
                </div>
            </div>
        </Transition>

        <div class="flex-1 flex flex-col min-h-0 transition-all duration-300 relative z-10">
            <Transition name="content-fade" mode="out-in">
                <div
                    v-if="!isConnected"
                    key="disconnected"
                    class="flex-1 flex items-center justify-center lg:py-6 px-6"
                    :class="{
                        'lg:pt-0': isNarrowViewport,
                    }"
                >
                    <div class="text-center">
                        <div class="flex flex-col items-center gap-1">
                            <div
                                class="relative w-14 h-14 rounded-full flex items-center justify-center"
                            >
                                <div
                                    v-if="getConnectionDisplay.showProgress"
                                    class="absolute inset-0 rounded-full border-2 border-transparent border-t-vp-brand-2 dark:border-t-vp-brand-1 animate-spin"
                                ></div>
                                <v-icon name="bi-usb-symbol" scale="1.75" class="text-vp-3" />
                            </div>
                            <div class="flex flex-col items-center gap-2 px-1">
                                <p class="text-lg font-medium text-vp-1">
                                    {{ getConnectionDisplay.title }}
                                </p>
                                <p
                                    v-if="getConnectionDisplay.subtitle"
                                    class="text-sm text-vp-3 mb-5 max-w-lg"
                                >
                                    <span class="subtitle" v-html="getConnectionDisplay.subtitle" />
                                </p>
                                <Transition name="button-height">
                                    <div
                                        v-if="getConnectionDisplay.showConnectButton"
                                        class="button-container mb-3"
                                    >
                                        <a
                                            :class="[
                                                'px-6 text-sm leading-9 font-semibold rounded-full border text-vp-1 transition-all duration-100 cursor-pointer backdrop-blur-md bg-vp-dark/55',
                                                'border-vp-brand-1 hover:bg-vp-brand-3 hover:border-vp-brand-2/50 select-none',
                                                { 'wiggle-loop': isInstallButtonHovered },
                                                ifCurrentTheme(['orange'])
                                                    ? 'hover:text-black'
                                                    : ifCurrentTheme(['white', 'skyline'])
                                                      ? 'hover:text-vp-neutral-inverse dark:hover:text-vp-neutral-inverse'
                                                      : 'hover:text-white',
                                            ]"
                                            @click="handleConnect"
                                            >{{ tr("updater_connect_button") }}</a
                                        >
                                    </div>
                                </Transition>
                            </div>
                        </div>
                    </div>
                </div>

                <div v-else key="connected" class="flex-1 flex flex-col min-h-0 relative">
                    <div class="bg-vp-divider/30">
                        <div class="flex flex-row gap-px">
                            <div
                                class="flex-1 flex items-center justify-center bg-vp-dark border-b border-vp-divider box-border cursor-pointer group h-[38px]"
                                :class="{
                                    'border-vp-brand-1 border-b !border-b-vp-brand-1 bg-gradient-to-t from-vp-soft/60 to-vp-dark':
                                        activeTab === 'info',
                                }"
                                @click="handleTabChange('info')"
                            >
                                <span
                                    class="px-4 text-[12px] font-medium text-vp-2/70 group-hover:text-vp-1 transition-colors duration-100 box-border text-center select-none"
                                    :class="{
                                        '!text-vp-neutral': activeTab === 'info',
                                    }"
                                >
                                    {{ tr("updater_parsed_tab") }}
                                </span>
                            </div>
                            <div
                                class="flex-1 flex items-center justify-center bg-vp-dark border-b border-vp-divider box-border cursor-pointer group h-[38px]"
                                :class="{
                                    'border-vp-brand-1 border-b !border-b-vp-brand-1 bg-gradient-to-t from-vp-soft/60 to-vp-dark':
                                        activeTab === 'raw',
                                }"
                                @click="handleTabChange('raw')"
                            >
                                <span
                                    class="px-4 text-[12px] font-medium text-vp-2/70 group-hover:text-vp-1 transition-colors duration-100 box-border text-center select-none"
                                    :class="{
                                        '!text-vp-neutral': activeTab === 'raw',
                                    }"
                                >
                                    {{ tr("updater_raw_tab") }}
                                </span>
                            </div>
                        </div>
                    </div>
                    <template v-if="!isNarrowViewport">
                        <ScrollFade
                            :show="!arrivedState.top"
                            position="top"
                            class="mr-4 top-[38px]"
                        />
                        <ScrollFade
                            :show="!arrivedState.bottom"
                            position="bottom"
                            class="mr-4 !h-40"
                            :class="{ 'bottom-[18px]': activeTab === 'raw' }"
                        />
                    </template>
                    <Transition :name="tabTransitionName" mode="out-in">
                        <div
                            v-if="activeTab === 'info'"
                            key="info"
                            ref="el"
                            class="pl-5 pr-0.5 pt-2 pb-2 relative z-0 overflow-y-scroll"
                            :class="{
                                'flex-1 min-h-0': !isNarrowViewport,
                            }"
                        >
                            <h2
                                class="text-base leading-3 uppercase font-semibold text-vp-1 mb-5 pt-4"
                            >
                                {{ deviceInfo?.hardware_name || tr("updater_device_info") }}
                            </h2>
                            <div class="flex flex-col space-y-0 pb-[7px]">
                                <template v-for="section in deviceSections" :key="section.title">
                                    <div class="section-header">{{ section.title }}</div>
                                    <div
                                        v-for="item in section.items"
                                        :key="item.label"
                                        class="menu-item"
                                    >
                                        <span class="menu-label">{{ item.label }}</span>
                                        <a
                                            v-if="item.isLink"
                                            class="menu-value vp-external-link-icon hover:underline"
                                            :href="item.href as string"
                                        >
                                            {{ item.value }}
                                        </a>
                                        <span v-else class="menu-value">{{ item.value }}</span>
                                    </div>
                                </template>
                            </div>
                        </div>

                        <div
                            v-else
                            key="raw"
                            ref="el"
                            class="relative z-0 overflow-y-scroll overflow-x-scroll"
                            :class="{
                                'flex-1 min-h-0': !isNarrowViewport,
                            }"
                        >
                            <pre
                                tabindex="0"
                                class="text-xs text-start text-vp-1 font-mono whitespace-pre break-all p-4 m-0 outline-none"
                                >{{ formatJsonDisplay }}</pre
                            >
                        </div>
                    </Transition>
                </div>
            </Transition>
        </div>
    </div>
</template>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
    transition: all 0.3s ease-out;
}

.slide-down-enter-from {
    opacity: 0;
    transform: translateY(-10px);
}

.slide-down-enter-to {
    opacity: 1;
    transform: translateY(0);
}

.slide-down-leave-from {
    opacity: 1;
    transform: translateY(0);
}

.slide-down-leave-to {
    opacity: 0;
    transform: translateY(-10px);
}

.subtitle :deep(a) {
    @apply text-vp-brand-1 hover:text-vp-brand-2 hover:underline transition-colors duration-100 font-medium;
}

.header-fade-enter-active,
.header-fade-leave-active {
    transition: all 0.1s ease-in-out;
}

.header-fade-enter-from,
.header-fade-leave-to {
    opacity: 0;
    transform: translateY(-10px);
}

.content-fade-enter-active,
.content-fade-leave-active {
    transition: all 0.1s ease-in-out;
}

.content-fade-enter-from,
.content-fade-leave-to {
    opacity: 0;
    transform: translateY(10px);
}

.tab-fade-enter-active,
.tab-fade-leave-active {
    transition: all 0.15s ease-in-out;
}

.tab-fade-enter-from,
.tab-fade-leave-to {
    opacity: 0;
    transform: translateX(10px);
}

.tab-slide-right-enter-active,
.tab-slide-right-leave-active {
    transition: all 0.15s ease-in-out;
}

.tab-slide-right-enter-from {
    opacity: 0;
    transform: translateX(20px);
}

.tab-slide-right-leave-to {
    opacity: 0;
    transform: translateX(-20px);
}

.tab-slide-left-enter-active,
.tab-slide-left-leave-active {
    transition: all 0.15s ease-in-out;
}

.tab-slide-left-enter-from {
    opacity: 0;
    transform: translateX(-20px);
}

.tab-slide-left-leave-to {
    opacity: 0;
    transform: translateX(20px);
}

.tab-fade-enter-active,
.tab-fade-leave-active {
    transition: all 0.1s ease-in-out;
}

.tab-fade-enter-from,
.tab-fade-leave-to {
    opacity: 0;
    transform: translateX(10px);
}

.tab-slide-right-enter-active,
.tab-slide-right-leave-active {
    transition: all 0.1s ease-in-out;
}

.tab-slide-right-enter-from {
    opacity: 0;
    transform: translateX(20px);
}

.tab-slide-right-leave-to {
    opacity: 0;
    transform: translateX(-20px);
}

.tab-slide-left-enter-active,
.tab-slide-left-leave-active {
    transition: all 0.1s ease-in-out;
}

.tab-slide-left-enter-from {
    opacity: 0;
    transform: translateX(-20px);
}

.tab-slide-left-leave-to {
    opacity: 0;
    transform: translateX(20px);
}

.button-height-enter-active,
.button-height-leave-active {
    transition: all 0.1s ease-in-out;
    overflow: hidden;
}

.button-height-enter-from,
.button-height-leave-to {
    opacity: 0;
    max-height: 0;
    transform: translateY(-10px);
}

.button-height-enter-to,
.button-height-leave-from {
    opacity: 1;
    max-height: 100px;
    transform: translateY(0);
}

.button-container {
    display: flex;
    justify-content: center;
    align-items: center;
}

.section-header {
    font-size: 11px;
    font-weight: 600;
    color: var(--vp-c-text-3);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin: 15px 0 3px 0 !important;
    padding-bottom: 4px;
    border-bottom: 1px solid var(--vp-c-divider);
}

.section-header:first-child {
    margin-top: 0 !important;
}

.menu-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 4px 0;
    border-radius: 4px;
    font-size: 12px;
    gap: 16px;
    min-height: 24px;
    min-width: 0;
    width: 100%;
}

.menu-label {
    color: var(--vp-c-text-2);
    text-align: left;
    flex-shrink: 0;
    font-size: 12px;
    max-width: 50%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.menu-value {
    color: var(--vp-c-text-1);
    font-weight: 500;
    text-align: right;
    font-size: 12px;
    word-break: break-word;
    overflow-wrap: break-word;
    min-width: 0;
    flex: 1;
    overflow: hidden;
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

@keyframes wiggle {
    0%,
    7% {
        transform: rotateZ(0);
    }
    15% {
        transform: rotateZ(-8deg);
    }
    20% {
        transform: rotateZ(6deg);
    }
    25% {
        transform: rotateZ(-5deg);
    }
    30% {
        transform: rotateZ(3deg);
    }
    35% {
        transform: rotateZ(-2deg);
    }
    40%,
    100% {
        transform: rotateZ(0);
    }
}

.wiggle-loop {
    animation: wiggle 0.5s ease-in-out infinite;
    animation-delay: 0s;
    animation-iteration-count: infinite;
    animation-duration: 2s;
}
</style>
