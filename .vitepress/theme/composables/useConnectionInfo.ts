import { useClipboard, useObjectUrl } from "@vueuse/core";
import { computed, inject, shallowRef } from "vue";
import { getReleaseByCommit } from "../../../_data/releases";
import { ConnectionState } from "../types";
import { bytesToSize, getRadioStackType } from "../util";
import { useI18n } from "./useI18n";
import type { useSerialConnection } from "./useSerialConnection";
import { useTempState } from "./useTempState";

export function useConnectionInfo() {
    const { tr, getLocalizedPath } = useI18n();

    const serialConnection = inject<ReturnType<typeof useSerialConnection> | null>(
        "serialConnection",
    );

    const connectionData = computed(
        () =>
            serialConnection?.connectionData || {
                state: ConnectionState.DISCONNECTED,
                error: undefined,
                deviceInfo: undefined,
                firmwareState: undefined,
            },
    );

    const flags = computed(
        () =>
            serialConnection?.flags || {
                connected: false,
                serialSupported: false,
                portSelectRequired: false,
                rpcActive: false,
                rpcToggling: false,
                updateInProgress: false,
                progress: 0,
                installStatus: null,
                ableToExtract: null,
                ableToUpdate: null,
                restarting: false,
                screenStream: false,
                screenStreamPaused: false,
            },
    );

    const firmwareState = computed(
        () =>
            serialConnection?.firmwareState || {
                updateStage: "",
                writeProgress: {
                    filename: "",
                    progress: 0,
                },
            },
    );

    const connectionState = computed(() => connectionData.value.state);
    const deviceInfo = computed(() => connectionData.value.deviceInfo);
    const isConnected = computed(() => connectionState.value === "connected");

    const commitInReleases = computed(() =>
        getReleaseByCommit(deviceInfo.value?.firmware_commit || ""),
    );

    const copyState = useTempState({
        beforeIcon: "oi-copy",
        afterIcon: "oi-check",
        beforeText: () => tr("copy"),
        afterText: () => tr("copied"),
    });

    const saveState = useTempState({
        beforeIcon: "ri-save-line",
        afterIcon: "oi-check",
        beforeText: () => tr("save"),
        afterText: () => tr("saved"),
    });

    const sdCardUsage = computed(() => {
        const device = deviceInfo.value;
        const totalSpace = device?.storage_sdcard_totalSpace;
        const freeSpace = device?.storage_sdcard_freeSpace;
        const present = device?.storage_sdcard_present;

        if (present === "loading") return "...";
        if (!totalSpace || freeSpace === undefined) return null;

        const usedSpace = totalSpace - freeSpace;
        return `${bytesToSize(usedSpace)} / ${bytesToSize(totalSpace)}`;
    });

    const radioFwVersion = computed(() => {
        const device = deviceInfo.value;
        return device?.radio_alive !== false
            ? device?.radio_stack_major +
                  "." +
                  device?.radio_stack_minor +
                  "." +
                  device?.radio_stack_sub
            : tr("corrupt");
    });

    const radioStackType = computed(() => {
        return getRadioStackType(deviceInfo.value?.radio_stack_type);
    });

    const getRadioVersion = computed(() => {
        const version = radioFwVersion.value;
        const type = radioStackType.value;
        return version == undefined || type == undefined ? "" : version + " " + type;
    });

    const exportDeviceInfo = async (action: "copy" | "save") => {
        if (!deviceInfo.value) return;
        const jsonString = JSON.stringify(deviceInfo.value, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });

        if (action === "copy") {
            useClipboard().copy(jsonString);
            copyState.trigger();
        } else if (action === "save") {
            const url = useObjectUrl(shallowRef(blob));
            const link = document.createElement("a");
            link.href = url.value || "";
            link.download = `${deviceInfo.value?.hardware_name || "flipper"}-device-info-${new Date().toISOString().split("T")[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url.value || "");
            saveState.trigger();
        }
    };

    const handleConnect = async () => {
        if (
            !flags.value.connected &&
            connectionState.value !== "disconnecting" &&
            serialConnection
        ) {
            await serialConnection.connect();
        }
    };

    const handleDisconnect = async () => {
        if (serialConnection) {
            await serialConnection.disconnect();
        }
    };

    const testConnecting = async () => {
        if (serialConnection?.testConnecting) {
            await serialConnection.testConnecting();
        }
    };

    return {
        connectionData,
        flags,
        firmwareState,
        connectionState,
        deviceInfo,
        isConnected,
        commitInReleases,
        sdCardUsage,
        radioFwVersion,
        radioStackType,
        getRadioVersion,
        copyState,
        saveState,
        exportDeviceInfo,
        handleConnect,
        testConnecting,
        handleDisconnect,
        tr,
        getLocalizedPath,
        serialConnection,
    };
}
