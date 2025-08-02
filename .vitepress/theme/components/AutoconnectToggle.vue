<script setup lang="ts">
import { inject, onMounted } from "vue";
import type { useSerialConnection } from "../composables/useSerialConnection";
import { useAutoconnectSetting } from "../composables/useAutoconnectSetting";
import { useConnectionInfo } from "../composables/useConnectionInfo";
import { useI18n } from "../composables/useI18n";
import { useSharedHover } from "../composables/useSharedHover";

import Tooltip from "./Tooltip.vue";

const { tr } = useI18n();
const { isAutoconnectEnabled, toggleAutoconnect } = useAutoconnectSetting();
const serialConnection = inject<ReturnType<typeof useSerialConnection> | null>("serialConnection");
const { handleConnect, connectionState } = useConnectionInfo();
const { isHovered: isInstallButtonHovered } = useSharedHover("disabled-install-button");

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
    <Tooltip
        :delay="400"
        :z-index="9999"
        :offset="13"
        position="bottom"
        :force-visible="isInstallButtonHovered && !isAutoconnectEnabled"
    >
        <button
            type="button"
            role="switch"
            :aria-checked="isAutoconnectEnabled"
            :aria-label="
                isAutoconnectEnabled
                    ? tr('connection_autoconnect_enabled')
                    : tr('connection_autoconnect_disabled')
            "
            class="VPSwitch"
            :class="{
                '!border-vp-brand-1': isInstallButtonHovered && !isAutoconnectEnabled,
            }"
            @click="toggleConnect"
        >
            <span
                class="check absolute top-px left-px w-[18px] h-[18px] rounded-full bg-[var(--vp-c-neutral-inverse)] shadow-[var(--vp-shadow-1)] transition-transform duration-[250ms] flex items-center justify-center"
            >
                <span class="icon relative block w-[18px] h-[18px]">
                    <v-icon
                        name="ri-refresh-line"
                        class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-opacity duration-[250ms] text-vp-1"
                        scale="0.65"
                    />
                </span>
            </span>
        </button>
        <template #content>{{
            isAutoconnectEnabled
                ? tr("connection_autoconnect_enabled")
                : tr("connection_autoconnect_disabled")
        }}</template>
    </Tooltip>
</template>

<style scoped>
.VPSwitch {
    position: relative;
    border-radius: 11px;
    display: block;
    width: 40px;
    height: 22px;
    flex-shrink: 0;
    border: 1px solid var(--vp-input-border-color);
    background-color: var(--vp-input-switch-bg-color);
    transition: border-color 0.25s !important;
    cursor: pointer;
}

.VPSwitch:hover {
    border-color: var(--vp-c-brand-1);
}

.VPSwitch[aria-checked="true"] .check {
    transform: translateX(18px);
}
</style>
