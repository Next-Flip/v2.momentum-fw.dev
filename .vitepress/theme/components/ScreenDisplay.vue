<script setup lang="ts">
import { inject, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useBgContainer, useConnectionInfo, useSerialConnection } from "../composables";
import { downloadFile } from "../util";

const { flags, isConnected, deviceInfo } = useConnectionInfo();
const serialConnection = inject<ReturnType<typeof useSerialConnection> | null>("serialConnection");
const canvasRef = ref<HTMLCanvasElement | null>(null);
const { bgContainerClasses, shouldUseBgContainer, shouldUseDarkImage } = useBgContainer();

let retryTimeout: NodeJS.Timeout | null = null;
let autoRetryInterval: NodeJS.Timeout | null = null;

const completeRestart = async () => {
    await stopStream(true);

    if (canvasRef.value) {
        const ctx = canvasRef.value.getContext("2d");
        if (ctx) {
            ctx.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height);
            ctx.fillStyle = "#fe8a2b";
            ctx.fillRect(0, 0, canvasRef.value.width, canvasRef.value.height);
        }
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
    await tryStartStream();
};

const startAutoRetry = () => {
    stopAutoRetry();

    autoRetryInterval = setInterval(() => {
        const shouldBeStreaming =
            isConnected.value &&
            flags.value.rpcActive &&
            !flags.value.screenStreamPaused &&
            serialConnection &&
            canvasRef.value;

        if (shouldBeStreaming && !flags.value.screenStream) {
            completeRestart().catch((error) => {
                console.warn("Auto-retry failed:", error);
            });
        }
    }, 2000);
};

const stopAutoRetry = () => {
    if (autoRetryInterval) {
        clearInterval(autoRetryInterval);
        autoRetryInterval = null;
    }
};

const manualRestart = async () => {
    if (flags.value.updateInProgress) return;
    await completeRestart();
};

const tryStartStream = async () => {
    if (typeof window === "undefined") return;

    await nextTick();

    if (
        !serialConnection ||
        !canvasRef.value ||
        !isConnected.value ||
        !flags.value.rpcActive ||
        flags.value.screenStreamPaused
    ) {
        return;
    }

    if (flags.value.screenStream) {
        return;
    }

    try {
        if (serialConnection.startScreenStream) {
            await serialConnection.startScreenStream(canvasRef.value);
        }
    } catch {
        if (retryTimeout) clearTimeout(retryTimeout);
        retryTimeout = setTimeout(() => {
            tryStartStream();
        }, 2000);
    }
};

const stopStream = async (force = false) => {
    if (typeof window === "undefined") return;

    if (retryTimeout) {
        clearTimeout(retryTimeout);
        retryTimeout = null;
    }

    if (!serialConnection || (!flags.value.screenStream && !force)) return;

    try {
        if (serialConnection.stopScreenStream) {
            await serialConnection.stopScreenStream();
        }
    } catch (error) {
        if (force) {
            console.warn("Error during forced stop:", error);
        }
    }
};

const takeScreenshot = async (): Promise<Blob | null> => {
    if (typeof window === "undefined") return null;
    if (!canvasRef.value) return null;
    const ctx = canvasRef.value.getContext("2d");
    if (!ctx) return null;

    try {
        const tempCanvas = document.createElement("canvas");
        const tempCtx = tempCanvas.getContext("2d");
        if (!tempCtx) return null;

        tempCanvas.width = 512;
        tempCanvas.height = 256;
        tempCtx.imageSmoothingEnabled = false;
        tempCtx.drawImage(canvasRef.value, 0, 0, 512, 256);

        return new Promise((resolve) => {
            tempCanvas.toBlob(
                (blob) => {
                    resolve(blob);
                },
                "image/png",
                1.0,
            );
        });
    } catch (error) {
        serialConnection?.addLog("error", `Failed to take screenshot: ${error}`);
        return null;
    }
};

const downloadScreenshot = async (filename: string = "flipper"): Promise<boolean> => {
    const blob = await takeScreenshot();
    if (!blob) return false;

    try {
        const url = URL.createObjectURL(blob);
        const now = new Date();
        const pad = (n: number) => n.toString().padStart(2, "0");
        const formattedDate = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
        const formattedTime = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
        const file = `${deviceInfo.value?.hardware_name || filename}-${formattedDate}-${formattedTime}.png`;
        downloadFile(url, file);
        URL.revokeObjectURL(url);
        serialConnection?.addLog("info", `[{{Screen}}] Downloaded screenshot: ${file}`);
        return true;
    } catch (error) {
        serialConnection?.addLog("error", `Failed to download screenshot: ${error}`);
        return false;
    }
};

defineExpose({
    takeScreenshot,
    downloadScreenshot,
});

watch(
    [
        isConnected,
        () => flags.value.rpcActive,
        () => flags.value.screenStream,
        () => flags.value.screenStreamPaused,
    ],
    ([connected, rpcActive, isStreaming, isPaused]) => {
        if (typeof window === "undefined") return;

        if (retryTimeout) {
            clearTimeout(retryTimeout);
            retryTimeout = null;
        }

        if (connected && rpcActive && !isPaused) {
            startAutoRetry();
            if (!isStreaming) {
                retryTimeout = setTimeout(() => {
                    tryStartStream();
                }, 200);
            }
        } else {
            stopAutoRetry();
            stopStream();
        }
    },
    { immediate: true },
);

onMounted(() => {
    if (typeof window === "undefined") return;

    setTimeout(() => {
        tryStartStream();
    }, 100);
});

onBeforeUnmount(() => {
    if (retryTimeout) {
        clearTimeout(retryTimeout);
        retryTimeout = null;
    }
    stopAutoRetry();
    stopStream();
});
</script>

<template>
    <div v-if="isConnected" class="screen-display-container p-3 pb-0">
        <div class="relative overflow-hidden rounded-md">
            <div
                class="absolute top-[-16px] left-[-16px] w-[calc(100%+32px)] h-[calc(100%+48px)] z-0 p-0 pointer-events-none"
                aria-hidden="true"
            ></div>
            <div
                class="relative flex justify-center items-center min-h-[140px] p-3 z-4"
                :class="[
                    shouldUseBgContainer
                        ? ['bg-vp-bg dark:bg-vp-neutral rounded-xl', ...bgContainerClasses]
                        : 'bg-flipper-fill rounded-none',
                ]"
            >
                <canvas
                    ref="canvasRef"
                    :width="128 * (serialConnection?.screenScale?.value || 2)"
                    :height="64 * (serialConnection?.screenScale?.value || 2)"
                    class="screen-canvas block w-full h-auto max-w-full aspect-[2/1] bg-vp-bg transition-opacity duration-200"
                    :class="{
                        'opacity-25': !flags.screenStream,
                        'saturate-0 contrast-200 brightness-[3]': shouldUseDarkImage,
                        'dark:saturate-100 dark:contrast-100 dark:brightness-100':
                            !shouldUseDarkImage,
                        'dark:bg-vp-bg dark:saturate-0 dark:contrast-200 dark:brightness-[3]':
                            shouldUseDarkImage,
                    }"
                    @click="manualRestart"
                />
            </div>
        </div>
    </div>
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
