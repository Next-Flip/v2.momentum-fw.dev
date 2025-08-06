import { useStorage } from "@vueuse/core";
import { computed } from "vue";
import { BooleanSetting, SCREEN_COLORS, STORAGE_KEYS, ScreenColor } from "../types";

export function useSettings() {
    // prettier-ignore
    const autoconnectEnabled = useStorage(STORAGE_KEYS.AUTO_CONNECT, true, undefined, { initOnMounted: true });
    // prettier-ignore
    const clearLogsEnabled = useStorage(STORAGE_KEYS.CLEAR_LOGS, false, undefined, { initOnMounted: true });
    // prettier-ignore
    const screenColor = useStorage<ScreenColor>(STORAGE_KEYS.SCREEN_COLOR, "default", undefined, { initOnMounted: true });

    const getBool = (setting: BooleanSetting) => {
        const map = {
            autoconnect: autoconnectEnabled,
            clearLogs: clearLogsEnabled,
        };
        return computed({
            get: () => map[setting].value,
            set: (value: boolean) => {
                map[setting].value = value;
            },
        });
    };

    const toggleBool = (setting: BooleanSetting) => {
        const map = {
            autoconnect: autoconnectEnabled,
            clearLogs: clearLogsEnabled,
        };
        map[setting].value = !map[setting].value;
    };

    const isAutoconnectEnabled = getBool("autoconnect");
    const isClearLogsEnabled = getBool("clearLogs");
    const toggleAutoconnect = () => toggleBool("autoconnect");
    const toggleClearLogs = () => toggleBool("clearLogs");

    const currentScreenColor = computed({
        get: () => screenColor.value,
        set: (value: ScreenColor) => {
            screenColor.value = value;
        },
    });

    const getScreenColorOptions = () => SCREEN_COLORS;

    return {
        autoconnectEnabled,
        clearLogsEnabled,
        screenColor,
        getBool,
        toggleBool,
        isAutoconnectEnabled,
        isClearLogsEnabled,
        toggleAutoconnect,
        toggleClearLogs,
        currentScreenColor,
        getScreenColorOptions,
    };
}
