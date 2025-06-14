<script setup lang="ts">
import { computed, inject } from "vue";
import { useI18n } from "../composables/useI18n";
import type { useSerialConnection } from "../composables/useSerialConnection";
import { ConnectionState } from "../types";

const { tr } = useI18n();

const serialConnection = inject<ReturnType<typeof useSerialConnection> | null>("serialConnection");
const connectionData = computed(
    () =>
        serialConnection?.connectionData || {
            state: ConnectionState.DISCONNECTED,
            deviceInfo: {
                firmware_version: "",
                firmware_commit: "",
            },
        },
);
const flags = computed(
    () =>
        serialConnection?.flags || {
            ableToExtract: false,
        },
);

const shouldShow = computed(() => {
    return (
        connectionData.value.state === ConnectionState.CONNECTED &&
        flags.value.ableToExtract === false
    );
});
</script>

<template>
    <div
        v-if="shouldShow"
        class="extract-notice-container flex justify-center items-center max-w-[1200px] my-0 mx-auto pt-5 px-6 pointer-events-none"
    >
        <div
            class="extract-notice backdrop-blur-sm rounded-full overflow-visible w-min transition-all duration-200 pointer-events-auto"
        >
            <div class="flex items-center justify-center gap-2 pl-2 pr-2.5 py-2">
                <v-icon
                    name="ri-error-warning-line"
                    class="text-[var(--vp-c-warning-2)] shrink-0"
                />
                <div class="notice-details text-left cursor-default">
                    <p
                        v-html="
                            tr('connection_unable_to_extract_desc', {
                                version: `${connectionData.deviceInfo?.firmware_version} (${connectionData.deviceInfo?.firmware_commit})`,
                            })
                        "
                        class="text-left text-[13px] text-vp-2 leading-6 m-0 overflow-hidden w-max box-content"
                    ></p>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.extract-notice {
    background-color: color-mix(in srgb, var(--vp-c-warning-1) 5%, transparent);
    border: 1px solid color-mix(in srgb, var(--vp-c-warning-1) 10%, transparent);
    box-shadow: var(--vp-shadow-2);
}

.notice-details :deep(a) {
    color: var(--vp-c-brand-1) !important;
}
.notice-details :deep(a:hover) {
    text-decoration: underline !important;
}

.notice-details p:not(:last-child) {
    margin-bottom: 8px;
}

@media (max-width: 768px) {
    .extract-notice-container {
        left: 16px;
        right: 16px;
    }

    .extract-notice {
        min-width: auto;
        max-width: none;
    }
}
</style>
