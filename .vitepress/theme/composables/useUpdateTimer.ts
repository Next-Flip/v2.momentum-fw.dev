import { computed } from "vue";

const formatTimerMs = (ms: number, compact = false): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    if (compact) {
        if (minutes > 0) {
            return `${minutes}:${String(seconds).padStart(2, "0")}`;
        }
        return `${seconds}`;
    }

    const tenths = Math.floor((ms % 1000) / 100);
    if (minutes > 0) {
        return `${minutes}:${String(seconds).padStart(2, "0")}.${tenths}`;
    }
    return `${seconds}.${tenths}`;
};

export const useUpdateTimer = (firmwareState: { updateTimerElapsed: number | null }) => {
    const timerDisplay = computed(() => {
        if (firmwareState.updateTimerElapsed === null) return null;
        return formatTimerMs(firmwareState.updateTimerElapsed);
    });

    const timerDisplayCompact = computed(() => {
        if (firmwareState.updateTimerElapsed === null) return null;
        return formatTimerMs(firmwareState.updateTimerElapsed, true);
    });

    const isTimerRunning = computed(() => firmwareState.updateTimerElapsed !== null);

    return { timerDisplay, timerDisplayCompact, isTimerRunning };
};
