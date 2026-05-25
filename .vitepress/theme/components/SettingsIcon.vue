<script setup lang="ts">
import { ref } from "vue";
import { supportsBluetooth, supportsSerialPort } from "../util";
import AutoconnectToggle from "./AutoconnectToggle.vue";
import ScreenColorSelector from "./ScreenColorSelector.vue";

import { useI18n, useSettings } from "../composables";
import Toggle from "./Toggle.vue";

const { tr } = useI18n();
const { isSettingEnabled, toggleSetting, preferredConnection } = useSettings();
const flyoutOpen = ref(false);

const canConnect = supportsSerialPort() || supportsBluetooth();
const showPreferredConnection = supportsSerialPort() && supportsBluetooth();

const preferredOptions = [
    { value: "both", labelKey: "connection_preferred_both" as const },
    { value: "usb", labelKey: "connection_preferred_usb" as const },
    { value: "bt", labelKey: "connection_preferred_bt" as const },
];

const handleButtonEnter = () => {
    flyoutOpen.value = true;
};
const handleButtonLeave = () => {
    flyoutOpen.value = false;
};
</script>

<template>
    <div
        v-if="canConnect"
        class="settings-container VPFlyout border border-vp-divider rounded-lg w-10 h-10 flex items-center justify-center hover:border-vp-brand-1 transition-colors duration-100 group bg-vp-dark"
        @mouseenter="handleButtonEnter"
        @mouseleave="handleButtonLeave"
    >
        <button
            class="transition-all duration-200 w-full h-full rounded text-vp-3/80 hover:!text-vp-2 !cursor-default group"
            :class="{ '!text-vp-2': flyoutOpen }"
            :aria-expanded="flyoutOpen"
        >
            <v-icon
                name="oi-gear"
                scale="1"
                class="group-hover:rotate-90 transition-transform duration-200 ease-in"
            />
        </button>
        <div class="menu">
            <div class="menu-content pt-2">
                <div v-if="showPreferredConnection" class="menu-item mx-3">
                    <span class="menu-label">{{ tr("connection_preferred_connection") }}:</span>
                    <div class="dropdown-button">
                        <select v-model="preferredConnection" class="dropdown-select">
                            <option
                                v-for="opt in preferredOptions"
                                :key="opt.value"
                                :value="opt.value"
                            >
                                {{ tr(opt.labelKey) }}
                            </option>
                        </select>
                        <!-- <div
                            class="absolute right-1.5 flex items-center text-vp-3 pointer-events-none select-none"
                        >
                            <v-icon name="oi-chevron-down" scale="0.85" />
                        </div> -->
                    </div>
                </div>
                <div class="menu-item mx-3">
                    <span class="menu-label">{{ tr("connection_autoconnect") }}:</span>
                    <AutoconnectToggle />
                </div>
                <div class="menu-item mx-3">
                    <span class="menu-label">{{ tr("connection_verbose_logs") }}:</span>
                    <Toggle
                        :icon-name="
                            isSettingEnabled('verboseLogs') ? 'oi-dash' : 'fa-regular-circle'
                        "
                        :scale="0.65"
                        :aria-label="tr(isSettingEnabled('verboseLogs') ? 'on' : 'off')"
                        :title="tr(isSettingEnabled('verboseLogs') ? 'on' : 'off')"
                        :label="tr('connection_verbose_logs')"
                        :checked="isSettingEnabled('verboseLogs')"
                        :callback="() => toggleSetting('verboseLogs')"
                    />
                </div>
                <div class="h-px bg-vp-divider/70 mx-0 mt-2"></div>
                <div class="menu-item my-1.5">
                    <ScreenColorSelector />
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.settings-container {
    position: relative;
}

.hover-area {
    position: relative;
    padding: 7px 0;
    margin: -7px 0;
    transition:
        padding 0.25s ease,
        margin 0.25s ease;
}

.VPFlyout {
    position: relative;
}

.VPFlyout button:hover {
    color: var(--vp-c-brand-1);
    transition: color 0.25s;
}

.VPFlyout:not(:hover) .menu {
    opacity: 0;
    visibility: hidden;
    transform: translateY(0) translateX(0);
}

.VPFlyout:hover .menu {
    opacity: 1;
    visibility: visible;
    transform: translateY(0) translateX(0);
}

.menu {
    position: absolute;
    top: calc(var(--vp-nav-height) / 2 + 15px);
    left: 0;
    transform: translateX(0);
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

.menu-content {
    display: flex;
    flex-direction: column;
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

.menu-label {
    color: var(--vp-c-text-2);
    text-align: left;
    min-width: 65px;
    margin-right: 10px;
    user-select: none;
    white-space: nowrap;
}

.dropdown-button {
    position: relative;
    display: flex;
    align-items: center;
    border: 1px solid var(--vp-c-divider);
    background-color: color-mix(in srgb, var(--vp-c-bg-elv) 95%, transparent);
    border-radius: 6px;
    padding: 0;
    font-size: 12px;
    min-height: 28px;
    /* min-width: 90px; */
    max-width: 120px;
    transition: all 0.1s;
    overflow: hidden;
    cursor: pointer;
}

.dropdown-button:hover {
    border-color: var(--vp-c-brand-1);
}

.dropdown-select {
    user-select: none;
    appearance: none;
    -webkit-appearance: none;
    background: transparent;
    border: none;
    outline: none;
    color: var(--vp-c-text-1);
    font-size: 12px;
    cursor: pointer;
    font-family: inherit;
    padding: 4px 7px 4px 8px;
    line-height: 1.4;
    min-width: 0;
    flex: 1;
}

.dropdown-select:focus {
    outline: none;
}

.select-icon {
    flex-shrink: 0;
    padding-right: 6px;
}
</style>
