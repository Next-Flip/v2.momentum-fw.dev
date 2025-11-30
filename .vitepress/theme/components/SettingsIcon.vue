<script setup lang="ts">
import { ref } from "vue";
import { supportsSerialPort } from "../util";
import AutoconnectToggle from "./AutoconnectToggle.vue";
import ScreenColorSelector from "./ScreenColorSelector.vue";

import { useI18n, useSettings } from "../composables";
import Toggle from "./Toggle.vue";

const { tr } = useI18n();
const { isSettingEnabled, toggleSetting } = useSettings();
const flyoutOpen = ref(false);

const handleButtonEnter = () => {
    flyoutOpen.value = true;
};
const handleButtonLeave = () => {
    flyoutOpen.value = false;
};
</script>

<template>
    <div
        v-if="supportsSerialPort()"
        class="settings-container VPFlyout border border-vp-divider rounded-lg w-10 h-10 flex items-center justify-center hover:border-vp-brand-1 transition-colors duration-100 group"
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
            <div class="menu-content">
                <div class="menu-item mt-2 mx-3">
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
                <div class="menu-item mb-2 mx-3">
                    <span class="menu-label">{{ tr("connection_clear_logs") }}:</span>
                    <Toggle
                        :icon-name="isSettingEnabled('clearLogs') ? 'oi-dash' : 'fa-regular-circle'"
                        :scale="0.65"
                        :aria-label="tr(isSettingEnabled('clearLogs') ? 'on' : 'off')"
                        :title="tr(isSettingEnabled('clearLogs') ? 'on' : 'off')"
                        :label="tr('connection_clear_logs')"
                        :checked="isSettingEnabled('clearLogs')"
                        :callback="() => toggleSetting('clearLogs')"
                    />
                </div>
                <div class="h-px bg-vp-divider/70 mx-0"></div>
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
    margin-right: 20px;
}
</style>
