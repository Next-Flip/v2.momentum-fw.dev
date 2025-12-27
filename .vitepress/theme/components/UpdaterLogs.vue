<script setup lang="ts">
import { useScroll, useWindowSize } from "@vueuse/core";
import { computed, inject, nextTick, onMounted, ref, useTemplateRef, watch, type Ref } from "vue";
import { formatDate } from "../date";
import { stripHtmlFromLogs } from "../util";

import {
    useConnectionInfo,
    useI18n,
    useSerialConnection,
    useSettings,
    useThemeSwitcher,
} from "../composables";
import type { LogEntry, LogGroup } from "../types";
import ScrollFade from "./ScrollFade.vue";
import Tooltip from "./Tooltip.vue";

interface Props {
    isOpen: boolean;
    isChangelogOpen: boolean;
    isChangelogExpanded: boolean;
    isChangelogClosed: boolean;
    isNarrowViewport?: boolean;
    isSelectedOrUploadedFile: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
    toggle: [];
    clearlogs: [];
}>();

const { tr, translateLog } = useI18n();
const { copyState } = useConnectionInfo();
const serialConnection = inject<ReturnType<typeof useSerialConnection> | null>("serialConnection");
const logsScrollTrigger = inject<Ref<number>>("logsScrollTrigger", ref(0));
const { width: windowWidth } = useWindowSize();
const { isSettingEnabled } = useSettings();
const { ifCurrentTheme } = useThemeSwitcher();
const showVerboseLogs = computed(() => isSettingEnabled("verboseLogs"));

const logs = computed(() => {
    if (!serialConnection?.logs) return [];
    const logsArray =
        "value" in serialConnection.logs ? serialConnection.logs.value : serialConnection.logs;
    if (showVerboseLogs.value) {
        return logsArray;
    }
    return logsArray.filter((log: LogEntry) => log.level !== "verbose");
});

const groupedLogs = computed(() => {
    if (!logs.value.length) return [];
    const result: LogGroup[] = [];

    for (let i = 0; i < logs.value.length; i++) {
        const currentLog = logs.value[i];

        if (i > 0) {
            const previousLog = logs.value[i - 1];
            const previousGroup = result[result.length - 1];

            if (
                currentLog.message === previousLog.message &&
                currentLog.level === previousLog.level
            ) {
                previousGroup.count++;
                continue;
            }
        }

        result.push({
            log: currentLog,
            count: 1,
            id: `${currentLog.timestamp.getTime()}-${i}`,
        });
    }

    return result;
});

const logContainer = useTemplateRef<HTMLElement>("logContainer");
const { arrivedState } = useScroll(logContainer);
const autoScroll = ref(true);
const showLogs = computed(() => props.isOpen && logs.value.length > 0);
const showButtons = computed(
    () => logs.value.length > 0 && (props.isOpen || windowWidth.value <= 1024),
);

const scrollToBottom = () => {
    if (logContainer.value) {
        logContainer.value.scrollTop = logContainer.value.scrollHeight;
    }
};

const handleToggle = () => {
    emit("toggle");
    if (logs.value.length > 0) {
        scrollToBottom();
    }
};

const copyLogs = async () => {
    const logsString = logs.value
        .map(
            (log: LogEntry) =>
                `${formatDate(log.timestamp, "withTime")} ${stripHtmlFromLogs(translateLog(log.message))}`,
        )
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
        () => logs.value.length,
        () => props.isOpen,
        () => logsScrollTrigger.value,
        () => props.isChangelogOpen,
    ],
    ([newLogsLength, isExpanded], [oldLogsLength, wasExpanded]) => {
        if (!isExpanded && newLogsLength > 0) {
            const latestLog = logs.value[logs.value.length - 1];
            if (latestLog.level === "error") {
                emit("toggle");
            }
        }

        const shouldScroll =
            autoScroll.value &&
            (newLogsLength !== oldLogsLength || (isExpanded && !wasExpanded) || isExpanded);

        if (shouldScroll) {
            nextTick(() => {
                scrollToBottom();
            });
        }
    },
);

onMounted(() => {
    if (logs.value.length > 0) {
        nextTick(() => {
            scrollToBottom();
        });
    }
});
</script>

<template>
    <div
        class="bg-vp-dark/75 dark:bg-neutral-950/80 overflow-hidden group flex flex-col sm:rounded-lg border-y sm:border border-vp-divider h-full min-h-0"
        :class="{
            'border-b border-vp-divider': !props.isChangelogOpen && !showLogs,
            'min-h-[250px]': props.isNarrowViewport && showLogs,
            'bg-vp-dark dark:!bg-black': ifCurrentTheme(['skyline']),
        }"
    >
        <div class="flex flex-col flex-1 min-h-0">
            <div
                class="w-full flex items-center justify-between text-left px-4 pr-2 sm:pl-4 min-h-14 bg-vp-dark dropdown-button relative"
                :class="{
                    'is-active': showLogs,
                }"
            >
                <div class="flex flex-row items-center gap-2">
                    <div
                        class="flex items-center justify-center text-sm text-vp-2/80 rounded-md mt-px mr-0.5 transition-opacity duration-200"
                        :class="{
                            'opacity-50': logs.length === 0 || !showLogs,
                        }"
                        :aria-label="tr('updater_logs')"
                        :title="tr('updater_logs')"
                    >
                        <v-icon name="fa-terminal" scale="0.8" />
                    </div>
                    <h2
                        class="text-[13px] leading-3 font-semibold text-vp-1 uppercase mt-0.5 select-none"
                        :class="{
                            'opacity-50': !showLogs,
                        }"
                    >
                        {{ tr("updater_logs") }}
                    </h2>
                    <span
                        v-if="logs.length > 0"
                        class="text-xs font-medium select-none font-mono py-[3px] text-vp-2 text-start mt-0.5 ml-0.5 rounded-full px-[7px] bg-vp-neutral/[1%] border border-vp-divider/70"
                    >
                        {{ groupedLogs.length }}
                    </span>
                </div>
                <div class="flex items-center gap-1 flex-shrink-0">
                    <Tooltip v-if="logs.length > 0" :delay="0" :z-index="9999">
                        <button
                            class="!text-vp-3 hover:!text-vp-brand-1 transition-all duration-100 ease-out flex items-center justify-center w-8 max-w-8 min-w-8 h-8 rounded-lg cursor-pointer icon-button-opacity group-hover:opacity-100 box-border"
                            :class="{
                                'opacity-0': windowWidth > 1024,
                                'group-hover:opacity-100': showButtons,
                            }"
                            :aria-label="tr('updater_clear_logs')"
                            @click="$emit('clearlogs')"
                        >
                            <v-icon name="pr-refresh" :scale="0.9" />
                        </button>
                        <template #content>{{ tr("updater_clear_logs") }}</template>
                    </Tooltip>
                    <Tooltip v-if="logs.length > 0" :delay="0" :z-index="9999">
                        <button
                            class="!text-vp-3 hover:!text-vp-brand-1 transition-all duration-100 ease-out flex items-center justify-center w-8 max-w-8 min-w-8 h-8 rounded-lg cursor-pointer icon-button-opacity group-hover:opacity-100 box-border"
                            :class="{
                                'opacity-0': windowWidth > 1024,
                                'group-hover:opacity-100': showButtons,
                            }"
                            :aria-label="copyState.currentText.value"
                            @click.stop="copyLogs"
                            @mousedown="copyState.handleMouseDown"
                            @mouseup="copyState.handleMouseUp"
                            @mouseleave="copyState.handleMouseLeave"
                        >
                            <v-icon
                                :class="{
                                    'scale-95': copyState.isPressed.value,
                                }"
                                :name="copyState.currentIcon.value"
                                :scale="copyState.currentIcon.value === 'oi-check' ? 0.95 : 0.85"
                            />
                        </button>
                        <template #content>{{ copyState.currentText.value }}</template>
                    </Tooltip>
                    <button
                        class="rounded-lg transition-all duration-200 text-vp-3 flex items-center justify-center flex-shrink-0 p-1.5"
                        :class="{
                            '!opacity-35 !cursor-default pointer-events-none':
                                logs.length === 0 || isChangelogClosed || !isSelectedOrUploadedFile,
                            'opacity-100 hover:text-vp-brand-1 cursor-pointer': logs.length > 0,
                        }"
                        @click="handleToggle"
                    >
                        <v-icon
                            :name="'oi-chevron-down'"
                            :aria-label="showLogs ? tr('updater_collapse') : tr('updater_expand')"
                            scale="1"
                            class="transition-all duration-200"
                            :class="{
                                'rotate-180': showLogs,
                            }"
                        />
                    </button>
                </div>
            </div>

            <Transition name="logs-expand" mode="in-out">
                <div v-if="showLogs" class="flex-1 flex flex-col min-h-0">
                    <div class="relative border-t border-vp-divider flex-1 flex flex-col min-h-0">
                        <ScrollFade
                            :show="!arrivedState.top"
                            position="top"
                            :opacity="20"
                            class="mr-4"
                        />
                        <div
                            ref="logContainer"
                            class="overflow-y-auto relative items-start justify-start flex"
                            :class="{
                                'flex-1 min-h-0': true,
                            }"
                        >
                            <div
                                v-if="groupedLogs.length === 0"
                                class="text-center py-[var(--vp-nav-height)] pl-8 pr-5 m-auto"
                            >
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

                            <div
                                v-else
                                class="flex flex-col space-y-0 text-sm font-mono w-full prose dark:prose-invert"
                            >
                                <div
                                    v-for="group in groupedLogs"
                                    :key="group.id"
                                    v-memo="[group.count, group.log.level]"
                                    class="flex items-start gap-1 text-xs pl-2 min-h-5 justify-start relative"
                                    :class="{
                                        'bg-[#FEF6D5] dark:bg-orange-400/10':
                                            group.log.level === 'warning',
                                        'bg-[#FCEBEB] dark:bg-red-400/10':
                                            group.log.level === 'error',
                                        'bg-[#d5fedc] dark:bg-green-700/20':
                                            group.log.level === 'success',
                                        'bg-vp-divider/30': group.count > 1,
                                    }"
                                >
                                    <div
                                        class="absolute left-0 top-0 h-full w-0.5"
                                        :class="{
                                            'bg-yellow-300 dark:bg-orange-600/60':
                                                group.log.level === 'warning',
                                            'bg-red-300 dark:bg-red-600/60':
                                                group.log.level === 'error',
                                            'bg-green-300 dark:bg-green-600/60':
                                                group.log.level === 'success',
                                        }"
                                    ></div>
                                    <span
                                        :title="formatDate(group.log.timestamp, 'withTime')"
                                        class="text-vp-3 flex-shrink-0 w-[60px] text-left h-min tracking-tight leading-5"
                                        :class="{
                                            'text-neutral-900 dark:text-orange-400/60':
                                                group.log.level === 'warning',
                                            'text-neutral-900 dark:text-red-500/70':
                                                group.log.level === 'error',
                                            'text-neutral-900 dark:text-green-500/70':
                                                group.log.level === 'success',
                                        }"
                                    >
                                        {{ formatDate(group.log.timestamp, "timeOnly") }}
                                    </span>
                                    <span
                                        class="text-vp-1 flex-1 min-w-0 text-left message-text whitespace-pre-wrap leading-5"
                                        :class="{
                                            'text-neutral-950 dark:text-orange-400/80':
                                                group.log.level === 'warning',
                                            'text-neutral-950 dark:text-red-500/95':
                                                group.log.level === 'error',
                                            'text-neutral-950 dark:text-green-500/95':
                                                group.log.level === 'success',
                                        }"
                                    >
                                        <span v-html="translateLog(group.log.message)"></span>
                                    </span>
                                    <span
                                        v-if="group.count > 1"
                                        class="text-vp-3/35 flex-shrink-0 text-xs font-medium ml-1 px-1.5 leading-5"
                                    >
                                        {{ group.count }}
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

.prose {
    max-width: none;
}
.prose :deep(code) {
    font-size: 11px;
    border-radius: 0.25rem;
    padding: 0.125rem 0.25rem;
    color: var(--vp-c-alternate-1);
    background-color: color-mix(in srgb, var(--vp-c-alternate-1) 10%, transparent);
}
.prose :deep(code.code-url) {
    background-color: color-mix(in srgb, var(--vp-c-brand-1) 10%, transparent);
}
.theme-white .prose :deep(code) {
    color: var(--vp-c-brand-1);
}
.theme-skyline .prose :deep(code.code-primary),
.theme-white .prose :deep(code.code-primary) {
    color: var(--vp-c-white);
    background-color: var(--vp-c-black);
}
.prose :deep(code.code-primary) {
    color: var(--vp-c-black);
    background-color: var(--vp-c-brand-1);
}
.prose :deep(code.code-secondary) {
    color: var(--vp-c-black);
    background-color: var(--vp-c-alternate-1);
}
.prose :deep(code.code-default) {
    color: var(--vp-c-black);
    background-color: var(--vp-c-flipper-fill);
}
.prose :deep(code.code-white) {
    color: var(--vp-c-black);
    background-color: var(--vp-c-white);
}
.prose :deep(code):before,
.prose :deep(code):after {
    content: "";
}
</style>
