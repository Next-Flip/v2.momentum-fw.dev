import { useStorage } from "@vueuse/core";
import { computed } from "vue";
import { BooleanSetting, SCREEN_COLORS, STORAGE_KEYS, ScreenColor } from "../types";

export function useSettings() {
    // prettier-ignore
    const autoconnectEnabled = useStorage(STORAGE_KEYS.AUTO_CONNECT, true, undefined, { initOnMounted: true });
    // prettier-ignore
    const verboseLogsEnabled = useStorage(STORAGE_KEYS.VERBOSE_LOGS, false, undefined, { initOnMounted: true });
    // prettier-ignore
    const screenColor = useStorage<ScreenColor>(STORAGE_KEYS.SCREEN_COLOR, "default", undefined, { initOnMounted: true });

    const getBool = (setting: BooleanSetting) => {
        const map = {
            autoConnect: autoconnectEnabled,
            verboseLogs: verboseLogsEnabled,
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
            autoConnect: autoconnectEnabled,
            verboseLogs: verboseLogsEnabled,
        };
        map[setting].value = !map[setting].value;
    };

    const isSettingEnabled = (setting: BooleanSetting) => getBool(setting).value;
    const toggleSetting = (setting: BooleanSetting) => toggleBool(setting);

    const currentScreenColor = computed({
        get: () => screenColor.value,
        set: (value: ScreenColor) => {
            screenColor.value = value;
        },
    });

    const getScreenColorOptions = () => SCREEN_COLORS;

    return {
        autoconnectEnabled,
        verboseLogsEnabled,
        screenColor,
        getBool,
        toggleBool,
        isSettingEnabled,
        toggleSetting,
        currentScreenColor,
        getScreenColorOptions,
    };
}
