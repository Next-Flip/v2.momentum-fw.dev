<script setup lang="ts">
import { useWindowSize } from "@vueuse/core";
import { computed, inject, nextTick, ref, watch, type Ref } from "vue";
import { useConnectionInfo } from "../composables/useConnectionInfo";
import { useI18n } from "../composables/useI18n";
import type { useSerialConnection } from "../composables/useSerialConnection";

import Tooltip from "./Tooltip.vue";

const { tr } = useI18n();

interface Props {
    isExpanded: boolean;
    changelogIsOpen: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
    toggle: [];
}>();

const { copyState } = useConnectionInfo();
const serialConnection = inject<ReturnType<typeof useSerialConnection> | null>("serialConnection");
const logsScrollTrigger = inject<Ref<number>>("logsScrollTrigger", ref(0));
const { width: windowWidth } = useWindowSize();

const logs = computed(() => serialConnection?.logs || []);
const lastStatusLog = computed(() => {
    for (let i = logs.value.length - 1; i >= 0; i--) {
        const log = logs.value[i];
        if (log.level === "success") return null;
        if (log.level === "error" || log.level === "warning") return log;
    }
    return null;
});
const hasStatus = computed(() => lastStatusLog.value !== null);
const logContainer = ref<HTMLElement | null>(null);
const autoScroll = ref(true);
const showButtons = computed(
    () => logs.value.length > 0 && (props.isExpanded || windowWidth.value <= 1024),
);

const scrollToBottom = () => {
    if (logContainer.value) {
        logContainer.value.scrollTop = logContainer.value.scrollHeight;
    }
};

const clearLogs = () => {
    if (serialConnection && serialConnection.clearLogs) {
        serialConnection.clearLogs();
    }
};

const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });
};

const handleToggle = () => {
    emit("toggle");
};

const copyLogs = async () => {
    const logsString = logs.value
        .map((log) => `${log.timestamp.toLocaleString()} ${log.message}`)
        .join("\n");
    try {
        if (navigator.clipboard) {
            await navigator.clipboard.writeText(logsString);
            copyState.trigger();
        }
    } catch (error) {
        console.error("Failed to copy logs:", error);
    }
};

watch(
    [
        () => logs.value,
        () => props.isExpanded,
        () => logsScrollTrigger.value,
        () => props.changelogIsOpen,
    ],
    ([newLogs, isExpanded], [oldLogs, wasExpanded]) => {
        if (!isExpanded && newLogs.length > 0) {
            const latestLog = newLogs[newLogs.length - 1];
            if (latestLog.level === "error") {
                emit("toggle");
            }
        }

        const shouldScroll =
            autoScroll.value && (newLogs !== oldLogs || (isExpanded && !wasExpanded) || isExpanded);

        if (shouldScroll) {
            nextTick(() => {
                scrollToBottom();
            });
        }
    },
    { deep: true },
);
</script>

<template>
    <div
        class="border border-vp-divider rounded-lg bg-vp-dark dark:bg-neutral-950 overflow-hidden group flex flex-col"
        :class="{
            'h-full': !props.changelogIsOpen && props.isExpanded,
        }"
    >
        <div
            class="flex flex-col"
            :class="{
                'flex-1 min-h-0': !props.changelogIsOpen && props.isExpanded,
            }"
        >
            <div
                class="w-full flex items-center justify-between text-left px-4 sm:pl-5 min-h-14 bg-vp-dark dropdown-button"
                :class="{
                    'is-active': isExpanded,
                }"
            >
                <div class="flex flex-row items-center gap-3">
                    <span v-if="hasStatus" class="relative flex size-1.5">
                        <span
                            class="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
                            :class="{
                                'bg-red-500 border-red-500': lastStatusLog?.level === 'error',
                                'bg-yellow-500 border-yellow-500':
                                    lastStatusLog?.level === 'warning',
                            }"
                        ></span>
                        <span
                            class="relative inline-flex size-1.5 rounded-full transition-all duration-100 ease-in-out"
                            :class="{
                                'bg-red-500/90 border-red-500': lastStatusLog?.level === 'error',
                                'bg-yellow-500/90 border-yellow-500':
                                    lastStatusLog?.level === 'warning',
                            }"
                        ></span>
                    </span>
                    <h2 class="text-[13px] leading-3 uppercase font-semibold text-vp-1">
                        {{ tr("updater_logs") }}
                    </h2>
                    <span
                        v-if="logs.length > 0"
                        class="text-xs font-medium font-mono py-1 rounded-full text-vp-2 text-start"
                    >
                        {{ logs.length }}
                    </span>
                </div>
                <div class="flex items-center gap-2 flex-shrink-0">
                    <Tooltip v-if="showButtons" :delay="0" :z-index="9999">
                        <button
                            class="!text-vp-3 hover:!text-vp-brand-1 transition-all duration-100 ease-out flex items-center justify-center w-8 h-8 rounded-lg cursor-pointer icon-button-opacity group-hover:opacity-100"
                            :class="{
                                'scale-95': copyState.isPressed.value,
                                'opacity-0': windowWidth > 1024,
                            }"
                            :aria-label="tr('updater_clear_logs')"
                            @click="clearLogs"
                        >
                            <v-icon name="pr-refresh" scale="0.9" />
                        </button>
                        <template #content>{{ tr("updater_clear_logs") }}</template>
                    </Tooltip>
                    <Tooltip v-if="showButtons" :delay="0" :z-index="9999">
                        <button
                            class="!text-vp-3 hover:!text-vp-brand-1 transition-all duration-100 ease-out flex items-center justify-center w-8 h-8 rounded-lg cursor-pointer icon-button-opacity group-hover:opacity-100"
                            :class="{
                                'scale-95': copyState.isPressed.value,
                                'opacity-0': windowWidth > 1024,
                            }"
                            :aria-label="copyState.currentText.value"
                            @click.stop="copyLogs"
                            @mousedown="copyState.handleMouseDown"
                            @mouseup="copyState.handleMouseUp"
                            @mouseleave="copyState.handleMouseLeave"
                        >
                            <v-icon :name="copyState.currentIcon.value" scale="0.85" />
                        </button>
                        <template #content>{{ copyState.currentText.value }}</template>
                    </Tooltip>
                    <button
                        class="rounded-lg transition-all duration-200 text-vp-3 hover:text-vp-brand-1 flex items-center justify-center flex-shrink-0 p-1.5"
                        @click="handleToggle"
                    >
                        <v-icon
                            :name="'oi-chevron-down'"
                            scale="1.1"
                            class="transition-all duration-200"
                            :class="{
                                'rotate-180': isExpanded,
                            }"
                        />
                    </button>
                </div>
            </div>

            <Transition name="logs-expand" mode="in-out">
                <div
                    v-if="isExpanded"
                    :class="{
                        'flex-1 flex flex-col min-h-0': !props.changelogIsOpen,
                    }"
                >
                    <div
                        class="relative border-t border-vp-divider/60"
                        :class="{
                            'flex-1 flex flex-col min-h-0': !props.changelogIsOpen,
                        }"
                    >
                        <div
                            ref="logContainer"
                            class="pr-[7px] py-2 my-[7px] mr-[7px] overflow-y-auto overflow-x-auto relative items-start justify-start flex"
                            :class="{
                                'h-64': props.changelogIsOpen,
                                'flex-1 min-h-0': !props.changelogIsOpen,
                            }"
                        >
                            <div v-if="logs.length === 0" class="text-center py-8 m-auto">
                                <div class="flex flex-col items-center gap-3">
                                    <div class="text-gray-500">
                                        <p class="text-vp-2 font-medium">
                                            {{ tr("updater_no_logs_yet") }}
                                        </p>
                                        <p class="text-vp-3 text-sm mt-0.5 max-w-sm mx-auto mb-3">
                                            {{ tr("updater_flash_logs_appear") }}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div v-else class="flex flex-col space-y-px text-sm font-mono w-full">
                                <div
                                    v-for="(log, index) in logs"
                                    :key="index"
                                    class="flex items-center gap-1 text-xs px-2 py-0.5 justify-start relative"
                                    :class="{
                                        'bg-[#FEF6D5] dark:bg-yellow-400/10':
                                            log.level === 'warning',
                                        'bg-[#FCEBEB] dark:bg-red-400/10': log.level === 'error',
                                        'bg-[#d5fedc] dark:bg-green-700/20':
                                            log.level === 'success',
                                    }"
                                >
                                    <div
                                        class="absolute left-0 top-0 h-full w-0.5"
                                        :class="{
                                            'bg-yellow-300 dark:bg-yellow-600/50':
                                                log.level === 'warning',
                                            'bg-red-300 dark:bg-red-600/50': log.level === 'error',
                                            'bg-green-300 dark:bg-green-600/50':
                                                log.level === 'success',
                                        }"
                                    ></div>
                                    <span
                                        class="text-vp-3 flex-shrink-0 w-[62px] text-left h-min mb-auto"
                                        :class="{
                                            'text-neutral-900 dark:text-yellow-400/60':
                                                log.level === 'warning',
                                            'text-neutral-900 dark:text-red-500/70':
                                                log.level === 'error',
                                            'text-neutral-900 dark:text-green-500/70':
                                                log.level === 'success',
                                        }"
                                    >
                                        {{ formatTime(log.timestamp) }}
                                    </span>
                                    <span
                                        class="text-vp-1 flex-1 min-w-0 text-left message-text"
                                        :class="{
                                            'text-neutral-950 dark:text-yellow-400/80':
                                                log.level === 'warning',
                                            'text-neutral-950 dark:text-red-500/95':
                                                log.level === 'error',
                                            'text-neutral-950 dark:text-green-500/95':
                                                log.level === 'success',
                                        }"
                                    >
                                        <span v-html="log.message"></span>
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Transition>
        </div>
    </div>
</template>

<style scoped>
/* .logs-expand-enter-active,
.logs-expand-leave-active {
    transition: all 0.3s ease-in-out;
    overflow: hidden;
} */

.logs-expand-enter-from {
    opacity: 0;
    max-height: 0;
    transform: translateY(-10px);
}

.logs-expand-enter-to {
    opacity: 1;
    max-height: 1000px;
    transform: translateY(0);
}

.logs-expand-leave-from {
    opacity: 1;
    max-height: 1000px;
    transform: translateY(0);
}

.logs-expand-leave-to {
    opacity: 0;
    max-height: 0;
    transform: translateY(-10px);
}

.message-text :deep(a) {
    @apply text-vp-brand-1 hover:text-vp-brand-2 underline transition-colors duration-100;
}

.icon-button-opacity {
    transition:
        opacity 150ms ease-out,
        transform 100ms ease-out,
        background-color 100ms ease-out,
        color 100ms ease-out !important;
}
</style>
