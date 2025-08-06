<script setup lang="ts">
import { computed, inject, onMounted } from "vue";
import { useConnectionInfo } from "../composables/useConnectionInfo";
import { useI18n } from "../composables/useI18n";
import type { useSerialConnection } from "../composables/useSerialConnection";
import { useSettings } from "../composables/useSettings";
import Toggle from "./Toggle.vue";

const { tr } = useI18n();
const { isAutoconnectEnabled, toggleAutoconnect } = useSettings();
const serialConnection = inject<ReturnType<typeof useSerialConnection> | null>("serialConnection");
const { handleConnect, connectionState } = useConnectionInfo();

const toggleLabel = computed(() => {
    return isAutoconnectEnabled.value
        ? tr("connection_autoconnect_enabled")
        : tr("connection_autoconnect_disabled");
});

const toggleConnect = async () => {
    toggleAutoconnect();
    if (isAutoconnectEnabled.value && connectionState.value === "disconnected") {
        await handleConnect();
    }
};

onMounted(async () => {
    if (serialConnection && serialConnection.autoConnect && isAutoconnectEnabled.value) {
        await serialConnection.autoConnect();
    }
});
</script>

<template>
    <Toggle
        icon-name="ri-refresh-line"
        :scale="0.65"
        :label="toggleLabel"
        :checked="isAutoconnectEnabled"
        @toggle="toggleConnect"
    />
</template>
