<script setup lang="ts">
import { MessageSchema } from ".vitepress/i18n";
import { computed, inject } from "vue";
import { useI18n, useSerialConnection, useThemeSwitcher } from "../composables";

const { ifCurrentTheme } = useThemeSwitcher();
const { tr } = useI18n();

const props = defineProps<{
    showUpdateOverlay: boolean;
    isChangelogExpanded: boolean;
}>();

const serialConnection = inject<ReturnType<typeof useSerialConnection> | null>("serialConnection");
const updateStage = computed(() => serialConnection?.firmwareState.updateStage || "");
const updateStageContext = computed(() => serialConnection?.firmwareState.updateStageContext || {});
const updateProgress = computed(() => serialConnection?.flags.progress || 0);
const connectionTransport = computed(() => serialConnection?.flags.connectionTransport || null);

const showWarning = computed(() => {
    const stage = updateStage.value;
    const warningStages = [
        "update_stage_extracted_files",
        "update_stage_creating_directory",
        "update_stage_uploading_file",
        "update_stage_loading_manifest",
        "update_stage_rebooting",
    ];
    return warningStages.includes(stage);
});

const warningText = computed(() => {
    if (connectionTransport.value === "bt") {
        return tr("connection_disconnect_warning");
    }
    return tr("connection_unplug_warning");
});
</script>

<template>
    <div class="absolute inset-0 rounded-xl flex items-center justify-center z-[60] select-none">
        <div
            v-if="
                updateStage !== 'update_stage_done' &&
                updateStage !== 'update_stage_flipper_updating'
            "
            class="w-full pointer-events-none"
            :class="
                props.isChangelogExpanded
                    ? 'py-6 px-28 min-h-[100px] flex items-center justify-center'
                    : 'px-11 pt-5'
            "
        >
            <div class="flex flex-row items-center gap-5 w-full rounded-lg">
                <div class="flex flex-col gap-3.5 flex-1 min-w-0 relative">
                    <Transition name="warning-fade">
                        <div v-if="showWarning" class="absolute -top-6 mt-px left-0 z-60">
                            <div class="text-vp-3 dark:text-vp-3/85 text-[11px] font-normal">
                                {{ warningText }}
                            </div>
                        </div>
                    </Transition>
                    <p
                        class="text-lg font-medium text-vp-1 whitespace-nowrap overflow-hidden text-ellipsis"
                    >
                        {{
                            tr(updateStage as keyof MessageSchema, updateStageContext) ||
                            tr("update_stage_updating")
                        }}
                    </p>
                    <div class="w-full bg-vp-1/5 rounded-full h-1">
                        <div
                            class="h-1 rounded-full transition-all duration-100"
                            :class="
                                ifCurrentTheme(['orange'])
                                    ? 'bg-vp-alternate-2 dark:bg-vp-brand-1'
                                    : 'bg-vp-brand-2'
                            "
                            :style="{
                                width: `${updateProgress * 100}%`,
                                boxShadow:
                                    updateProgress > 0
                                        ? '0 0 8px 2px color-mix(in srgb, var(--vp-c-brand-1) 10%, transparent)'
                                        : '0 0 8px 2px rgba(0, 0, 0, 0.0)',
                            }"
                        ></div>
                    </div>
                </div>
            </div>
        </div>

        <div v-else class="flex flex-row items-center mr-4">
            <div class="w-14 h-14 rounded-full flex items-center justify-center">
                <v-icon
                    v-if="updateStage === 'update_stage_done'"
                    name="oi-check"
                    :scale="1.85"
                    class="text-vp-alternate-1/95"
                    :class="{
                        'text-vp-brand-1/95 dark:text-vp-alternate-1/95': ifCurrentTheme(['purp']),
                    }"
                />
                <v-icon
                    v-else-if="updateStage === 'update_stage_flipper_updating'"
                    name="md-hourglasstop-twotone"
                    :scale="1.35"
                    class="text-vp-neutral/75"
                />
            </div>
            <p class="text-lg font-medium text-vp-1 text-center">
                {{ tr(updateStage as keyof MessageSchema, updateStageContext) }}
            </p>
        </div>
    </div>
</template>

<style scoped>
.warning-fade-enter-active,
.warning-fade-leave-active {
    transition: all 0.65s ease-out;
}

.warning-fade-enter-from {
    opacity: 0;
    transform: translateY(5px);
}

.warning-fade-leave-to {
    opacity: 0;
    transform: translateY(5px);
}

.warning-fade-enter-to,
.warning-fade-leave-from {
    opacity: 1;
    transform: translateY(0);
}
</style>
