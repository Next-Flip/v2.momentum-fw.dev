<script setup lang="ts">
import { computed, inject, onMounted } from "vue";
import { useConnectionInfo } from "../composables/useConnectionInfo";
import { useI18n } from "../composables/useI18n";
import type { useSerialConnection } from "../composables/useSerialConnection";
import { useSettings } from "../composables/useSettings";
import Toggle from "./Toggle.vue";

const { tr } = useI18n();
const { isSettingEnabled, toggleSetting } = useSettings();
const serialConnection = inject<ReturnType<typeof useSerialConnection> | null>("serialConnection");
const { handleConnect, connectionState } = useConnectionInfo();

const toggleLabel = computed(() => {
    return isSettingEnabled("autoConnect")
        ? tr("connection_autoconnect_enabled")
        : tr("connection_autoconnect_disabled");
});

const toggleConnect = async () => {
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
        :checked="isSettingEnabled('autoConnect')"
        @toggle="toggleConnect"
    />
</template>
