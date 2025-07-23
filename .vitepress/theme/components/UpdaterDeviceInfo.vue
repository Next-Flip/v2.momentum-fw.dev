<script setup lang="ts">
import { useScroll } from "@vueuse/core";
import { computed, useTemplateRef } from "vue";
import { useConnectionInfo } from "../composables/useConnectionInfo";
import { useI18n } from "../composables/useI18n";
import { useSharedHover } from "../composables/useSharedHover";
import type { DeviceInfo } from "../types";
import { bytesToSize, supportsSerialPort } from "../util";

import ScreenDisplay from "./ScreenDisplay.vue";
import Tooltip from "./Tooltip.vue";

const el = useTemplateRef<HTMLElement>("el");
const { arrivedState } = useScroll(el);
const { tr } = useI18n();

const { isHovered: isInstallButtonHovered } = useSharedHover("disabled-install-button");

const {
    flags,
    deviceInfo,
    isConnected: connectionIsConnected,
    connectionState,
    commitInReleases,
    getRadioVersion,
    copyState,
    saveState,
    exportDeviceInfo,
    handleConnect,
    handleDisconnect,
    tr: connectionTr,
    getLocalizedPath,
} = useConnectionInfo();

const isConnected = computed(() => connectionIsConnected.value);
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

const formatHardwareTimestamp = (timestamp: string) => {
    if (!timestamp) return tr("updater_na");
    const date = new Date(parseInt(timestamp) * 1000);
    return date.toLocaleDateString();
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

    return [
        {
            title: tr("updater_firmware_section"),
            items: [
                {
                    label: tr("updater_version_label"),
                    value: device.firmware_version?.includes("dev")
                        ? `${tr("updater_dev_prefix")} (${device.firmware_commit})`
                        : device.firmware_version,
                    href: `${getLocalizedPath("/releases")}/${commitInReleases.value?.commit || ""}`,
                    isLink: true,
                },
                {
                    label: tr("updater_branch_label"),
                    value: device.firmware_branch || tr("updater_na"),
                },
                { label: tr("updater_build_date_label"), value: device.firmware_build_date },
                {
                    label: tr("updater_origin_label"),
                    value: device.firmware_origin_fork || tr("updater_na"),
                },
                {
                    label: tr("updater_api_version_label"),
                    value: `${device.firmware_api_major}.${device.firmware_api_minor}`,
                },
            ],
        },
        {
            title: tr("updater_storage_section"),
            items: [
                { label: tr("updater_sd_card_label"), value: getStorageInfo.value.sdCard },
                {
                    label: tr("updater_databases_label"),
                    value:
                        device.storage_databases_present === "loading"
                            ? "..."
                            : (device.storage_databases_present as string) ||
                              connectionTr("missing"),
                },
            ],
        },
        {
            title: tr("updater_power_section"),
            items: [
                {
                    label: tr("updater_charge_level_label"),
                    value: formatPercentage(device.charge_level as string),
                },
                {
                    label: tr("updater_charge_state_label"),
                    value: formatChargeState(device.charge_state as string),
                },
                {
                    label: tr("updater_voltage_label"),
                    value: formatBatteryVoltage(device.battery_voltage as string),
                },
                {
                    label: tr("updater_temperature_label"),
                    value: formatTemperature(device.battery_temp as string),
                },
                {
                    label: tr("updater_health_label"),
                    value: formatPercentage(device.battery_health as string),
                },
                { label: tr("updater_capacity_label"), value: getBatteryCapacity.value },
            ],
        },
        {
            title: tr("updater_hardware_section"),
            items: [
                {
                    label: tr("updater_model_label"),
                    value: device.hardware_model || tr("updater_na"),
                },
                {
                    label: tr("updater_version_hw_label"),
                    value: device.hardware_ver || tr("updater_na"),
                },
                {
                    label: tr("updater_region_label"),
                    value: device.hardware_region_provisioned || tr("updater_na"),
                },
                {
                    label: tr("updater_color_label"),
                    value: device.hardware_color || tr("updater_na"),
                },
                {
                    label: tr("updater_manufactured_label"),
                    value: formatHardwareTimestamp(device.hardware_timestamp as string),
                },
            ],
        },
        {
            title: tr("updater_radio_section"),
            items: [
                { label: tr("updater_stack_version_label"), value: getRadioVersion.value },
                {
                    label: tr("updater_ble_mac_label"),
                    value: device.radio_ble_mac || tr("updater_na"),
                },
                {
                    label: tr("updater_stack_flash_label"),
                    value: device.radio_stack_flash || tr("updater_na"),
                },
                {
                    label: tr("updater_fus_version_label"),
                    value: `${device.radio_fus_major}.${device.radio_fus_minor}.${device.radio_fus_sub}`,
                },
            ],
        },
        {
            title: tr("updater_system_section"),
            items: [
                {
                    label: tr("updater_protobuf_api_label"),
                    value: `${device.protobuf_version_major}.${device.protobuf_version_minor}`,
                },
                {
                    label: tr("updater_debug_mode_label"),
                    value:
                        device.system_debug === "1"
                            ? tr("updater_enabled")
                            : tr("updater_disabled"),
                },
                {
                    label: tr("updater_stealth_mode_label"),
                    value:
                        device.system_stealth === "1"
                            ? tr("updater_enabled")
                            : tr("updater_disabled"),
                },
                {
                    label: tr("updater_enclave_label"),
                    value: `${device.enclave_valid === "true" ? tr("updater_valid") : tr("updater_invalid")} (${device.enclave_valid_keys || 0} ${tr("updater_keys_suffix")})`,
                },
            ],
        },
    ];
});
</script>

<template>
    <div
        class="border rounded-xl h-full flex flex-col max-h-[calc(30vh-var(--vp-nav-height)-24px)] lg:max-h-[calc(60vh-var(--vp-nav-height)-24px)] w-full min-h-72 lg:min-h-96 min-w-0 max-w-full overflow-hidden sticky top-[calc(var(--vp-nav-height)+24px)] transition-all duration-300 ease-in-out bg-vp-dark/55 backdrop-blur-md"
        :class="{
            'border-vp-divider': !isInstallButtonHovered,
            'border-vp-brand-1': isInstallButtonHovered,
        }"
    >
        <div class="flex-shrink-0 hidden lg:block relative z-0">
            <ScreenDisplay />
        </div>

        <div class="flex-1 flex flex-col min-h-0 transition-all duration-300 relative z-10">
            <Transition name="content-fade" mode="out-in">
                <div
                    v-if="!isConnected"
                    key="disconnected"
                    class="flex-1 flex items-center justify-center lg:pt-16 lg:pb-20 px-6"
                >
                    <div class="text-center">
                        <div class="flex flex-col items-center gap-2">
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
                                        class="button-container"
                                    >
                                        <a
                                            :class="[
                                                'px-6 text-sm leading-9 font-semibold rounded-full border text-vp-1 hover:text-white transition-all duration-100 cursor-pointer',
                                                'border-vp-brand-1 hover:bg-vp-brand-3 hover:border-vp-brand-2/50',
                                                { 'wiggle-loop': isInstallButtonHovered },
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

                <div v-else key="connected" class="flex-1 flex flex-col min-h-0 relative pt-3">
                    <!-- <div
                        v-if="!arrivedState.top"
                        class="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-vp-dark/70 to-transparent pointer-events-none mr-4"
                    ></div> -->
                    <div
                        v-if="!arrivedState.bottom"
                        class="absolute bottom-[57px] left-0 right-0 h-20 bg-gradient-to-t from-vp-dark/60 to-transparent pointer-events-none z-20 mx-2 mr-4"
                    ></div>
                    <div
                        ref="el"
                        class="flex-1 min-h-0 overflow-y-auto pl-6 pr-[11px] mb-[7px] mr-[7px] pt-[12px] relative z-10"
                    >
                        <h2 class="text-base leading-3 uppercase font-semibold text-vp-1 mb-5">
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
                                        :href="item.href"
                                    >
                                        {{ item.value }}
                                    </a>
                                    <span v-else class="menu-value">{{ item.value }}</span>
                                </div>
                            </template>
                        </div>
                    </div>

                    <div
                        class="py-3 border-t border-vp-divider flex-shrink-0 bg-vp-dark dark:bg-vp-dark"
                    >
                        <div class="action-buttons px-3">
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
                                    flags.updateInProgress &&
                                        'opacity-40 !cursor-not-allowed dark:!bg-vp-soft dark:!text-vp-3/70',
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
        </div>
    </div>
</template>

<style scoped>
.subtitle :deep(a) {
    @apply text-vp-brand-1 hover:text-vp-brand-2 hover:underline transition-colors duration-100 font-medium;
}

.export-button {
    background-color: color-mix(in srgb, var(--vp-c-bg-soft) 60%, transparent) !important;
}

.export-button:hover {
    background-color: color-mix(in srgb, var(--vp-c-default-soft) 100%, transparent) !important;
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
    padding-bottom: 5px;
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
