<script setup lang="ts">
import { computed, inject, onMounted } from "vue";
import { useConnectionInfo, useI18n, useSerialConnection, useSettings } from "../composables";
import { supportsBluetooth, supportsSerialPort } from "../util";
import Toggle from "./Toggle.vue";

const { tr } = useI18n();
const { isSettingEnabled, toggleSetting, preferredConnection } = useSettings();
const serialConnection = inject<ReturnType<typeof useSerialConnection> | null>("serialConnection");
const { handleConnect, connectionState } = useConnectionInfo();

const isDisabled = computed(() => {
    if (preferredConnection.value === "bt") return true;
    if (!supportsSerialPort() && supportsBluetooth()) return true;
    return false;
});

const toggleLabel = computed(() => {
    return isSettingEnabled("autoConnect") ? tr("on") : tr("off");
});

const toggleConnect = async () => {
    if (isDisabled.value) return;
    toggleSetting("autoConnect");
    if (isSettingEnabled("autoConnect") && connectionState.value === "disconnected") {
        await handleConnect();
    }
};

onMounted(async () => {
    if (serialConnection && serialConnection.autoConnect && isSettingEnabled("autoConnect")) {
        await serialConnection.autoConnect();
    }
});
</script>

<template>
    <Toggle
        :icon-name="isSettingEnabled('autoConnect') ? 'oi-dash' : 'fa-regular-circle'"
        :scale="0.65"
        :label="toggleLabel"
        :aria-label="toggleLabel"
        :title="toggleLabel"
        :checked="isSettingEnabled('autoConnect')"
        :disabled="isDisabled"
        @toggle="toggleConnect"
    />
</template>
