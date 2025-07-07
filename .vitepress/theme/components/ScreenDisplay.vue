<script setup lang="ts">
import { inject, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useConnectionInfo } from "../composables/useConnectionInfo";
import type { useSerialConnection } from "../composables/useSerialConnection";

const { flags, isConnected } = useConnectionInfo();

const serialConnection = inject<ReturnType<typeof useSerialConnection> | null>("serialConnection");
const canvasRef = ref<HTMLCanvasElement | null>(null);

let retryTimeout: NodeJS.Timeout | null = null;

const tryStartStream = async () => {
    await nextTick();

    if (!serialConnection || !canvasRef.value || !isConnected.value || !flags.value.rpcActive || flags.value.screenStreamPaused) {
        console.log('[ScreenDisplay] Stream start conditions not met:', {
            hasSerialConnection: !!serialConnection,
            hasCanvas: !!canvasRef.value,
            isConnected: isConnected.value,
            rpcActive: flags.value.rpcActive,
            screenStreamPaused: flags.value.screenStreamPaused
        });
        return;
    }

    if (flags.value.screenStream) {
        console.log('[ScreenDisplay] Screen stream already active');
        return;
    }

    try {
        console.log('[ScreenDisplay] Attempting to start screen stream...');
        if (serialConnection.startScreenStream) {
            await serialConnection.startScreenStream(canvasRef.value);
            console.log('[ScreenDisplay] Screen stream started successfully');
        }
    } catch (error) {
        console.warn('[ScreenDisplay] Failed to start screen stream:', error);
        if (retryTimeout) clearTimeout(retryTimeout);
        retryTimeout = setTimeout(() => {
            tryStartStream();
        }, 2000);
    }
};

const stopStream = async () => {
    if (retryTimeout) {
        clearTimeout(retryTimeout);
        retryTimeout = null;
    }

    if (!serialConnection || !flags.value.screenStream) {
        return;
    }

    try {
        if (serialConnection.stopScreenStream) {
            await serialConnection.stopScreenStream();
        }
    } catch (error) {
    }
};

onMounted(() => {
    console.log('[ScreenDisplay] Component mounted, attempting to start stream');
    setTimeout(() => {
        tryStartStream();
    }, 100);
});

watch([isConnected, () => flags.value.rpcActive], ([connected, rpcActive]) => {
    console.log('[ScreenDisplay] Connection state changed:', { connected, rpcActive });
    if (connected && rpcActive && !flags.value.screenStreamPaused) {
        setTimeout(() => {
            tryStartStream();
        }, 200);
    } else {
        stopStream();
    }
}, { immediate: true });

watch(() => flags.value.screenStream, (isStreaming, wasStreaming) => {
    if (wasStreaming && !isStreaming && isConnected.value && flags.value.rpcActive && !flags.value.screenStreamPaused) {
        console.warn('[ScreenDisplay] Screen stream stopped unexpectedly, attempting restart in 3 seconds');
        if (retryTimeout) clearTimeout(retryTimeout);
        retryTimeout = setTimeout(() => {
            tryStartStream();
        }, 3000);
    }
});

watch(() => flags.value.screenStreamPaused, (isPaused, wasPaused) => {
    if (wasPaused && !isPaused && isConnected.value && flags.value.rpcActive && !flags.value.screenStream) {
        console.log('[ScreenDisplay] Screen stream unpaused, attempting restart in 1 second');
        if (retryTimeout) clearTimeout(retryTimeout);
        retryTimeout = setTimeout(() => {
            tryStartStream();
        }, 1000);
    }
});

onBeforeUnmount(() => {
    if (retryTimeout) {
        clearTimeout(retryTimeout);
        retryTimeout = null;
    }
    stopStream();
});
</script>

<template>
    <Transition name="slide-down" mode="out-in">
        <div v-if="isConnected" class="screen-display-container backdrop-blur-lg border-b border-vp-divider pb-7 mb-7">
            <div
                class="relative flex justify-center items-center min-h-[140px] bg-vp-c-bg-soft border border-vp-divider rounded-lg overflow-hidden p-2">
                <canvas ref="canvasRef" :width="128 * ((serialConnection?.screenScale?.value) || 2)"
                    :height="64 * ((serialConnection?.screenScale?.value) || 2)"
                    class="screen-canvas block w-full h-auto max-w-full aspect-[2/1] bg-vp-bg transition-opacity duration-200 saturate-0 contrast-200 brightness-200 dark:saturate-100 dark:contrast-100 dark:brightness-100"
                    :class="{ 'opacity-30': !flags.screenStream }" />

                <div v-if="!flags.screenStream" class="absolute inset-0 flex items-center justify-center">
                    <div class="w-4 h-4 border-2 border-vp-brand-1 border-t-transparent rounded-full animate-spin">
                    </div>
                </div>
            </div>
        </div>
    </Transition>
</template>

<style scoped>
.screen-display-container {
    width: 100%;
    max-width: 100%;
}

.screen-canvas {
    image-rendering: pixelated;
    image-rendering: -moz-crisp-edges;
    image-rendering: crisp-edges;
}

.slide-down-enter-active,
.slide-down-leave-active {
    transition: all 0.3s ease-out;
}

.slide-down-enter-from {
    opacity: 0;
    transform: translateY(-10px);
}

.slide-down-enter-to {
    opacity: 1;
    transform: translateY(0);
}

.slide-down-leave-from {
    opacity: 1;
    transform: translateY(0);
}

.slide-down-leave-to {
    opacity: 0;
    transform: translateY(-10px);
}

@media (max-width: 768px) {
    .screen-container {
        min-height: 100px;
        padding: 4px;
    }
}

@media (max-width: 480px) {
    .screen-container {
        min-height: 80px;
        padding: 4px;
    }
}
</style>