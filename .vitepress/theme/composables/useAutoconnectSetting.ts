import { useStorage } from "@vueuse/core";
import { computed } from "vue";
import { STORAGE_KEYS } from "../types";

export function useAutoconnectSetting() {
    const autoconnectEnabled = useStorage(STORAGE_KEYS.AUTO_CONNECT, true, undefined, {
        initOnMounted: true,
    });

    const isAutoconnectEnabled = computed({
        get: () => autoconnectEnabled.value,
        set: (value: boolean) => {
            autoconnectEnabled.value = value;
        },
    });

    const toggleAutoconnect = () => {
        autoconnectEnabled.value = !autoconnectEnabled.value;
    };

    return {
        autoconnectEnabled,
        isAutoconnectEnabled,
        toggleAutoconnect,
    };
}
