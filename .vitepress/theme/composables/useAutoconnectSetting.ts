import { useStorage } from "@vueuse/core";
import { computed } from "vue";

export function useAutoconnectSetting() {
    const autoconnectEnabled = useStorage("momentum-autoconnect-enabled", true);

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
