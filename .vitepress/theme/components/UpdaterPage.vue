<script setup lang="ts">
import { useDropZone, useStorage, useWindowSize } from "@vueuse/core";
import { computed, inject, nextTick, onBeforeUnmount, provide, ref, watch } from "vue";
import type { ReleaseItem } from "../../../_data/releases";
import { devbuildReleases, getReleaseByCommit, mainlineReleases } from "../../../_data/releases";
import { useConnectionInfo } from "../composables/useConnectionInfo";
import { useI18n } from "../composables/useI18n";
import { useReleaseNavigation } from "../composables/useReleaseNavigation";
import type { useSerialConnection } from "../composables/useSerialConnection";
import { useSharedHover } from "../composables/useSharedHover";
import { STORAGE_KEYS } from "../types";
import { bytesToSize, downloadFile, formatFileDate, parseUploadedFileName } from "../util";

import ScreenDisplay from "./ScreenDisplay.vue";
import UpdaterChangelog from "./UpdaterChangelog.vue";
import UpdaterControls from "./UpdaterControls.vue";
import UpdaterDeviceInfo from "./UpdaterDeviceInfo.vue";
import UpdaterLogs from "./UpdaterLogs.vue";

const { tr, getLocalizedPath } = useI18n();
const { width: windowWidth } = useWindowSize();
const { flags, isConnected: connectionIsConnected } = useConnectionInfo();
const { isHovered: isInstallButtonHovered } = useSharedHover("disabled-install-button");

const serialConnection = inject<ReturnType<typeof useSerialConnection> | null>("serialConnection");
const selectedChannel = ref<"mainline" | "devbuild" | null>(null);
const { selectedRelease, selectRelease } = useReleaseNavigation({
    basePath: "/update",
    useQueryParams: true,
    storageKeys: {
        selectedVersion: STORAGE_KEYS.UPDATER_SELECTED_VERSION,
    },
    onReleaseChange: (release: ReleaseItem) => {
        if (mainlineReleases.includes(release)) {
            selectedChannel.value = "mainline";
        } else if (devbuildReleases.includes(release)) {
            selectedChannel.value = "devbuild";
        }
    },
});

const uploadedFile = ref<File | null>(null);
const uploadedFileRelease = ref<ReleaseItem | null>(null);
const fileInputRef = ref<HTMLInputElement | null>(null);
const dropZoneRef = ref<HTMLDivElement | null>(null);

const changelogState = useStorage(STORAGE_KEYS.UPDATER_CHANGELOG_STATE, "open");
const isLogsExpanded = useStorage(STORAGE_KEYS.UPDATER_LOGS_STATE, false);
const testMode = ref(false);

const logsScrollTrigger = ref(0);
const triggerLogsScroll = () => {
    logsScrollTrigger.value++;
};

provide("logsScrollTrigger", logsScrollTrigger);

const showUpdateOverlay = computed(() => serialConnection?.flags.updateInProgress || false);
const updateStage = computed(() => serialConnection?.firmwareState.updateStage || "");
const updateProgress = computed(() => serialConnection?.flags.progress || 0);
const isConnected = computed(() => connectionIsConnected.value);
const isMatchingRelease = computed(() => {
    const deviceCommit = serialConnection?.connectionData.deviceInfo?.firmware_commit;
    if (!deviceCommit) return false;
    const deviceVersion = serialConnection?.connectionData.deviceInfo?.firmware_version;
    if (!deviceVersion) return false;

    const uploadFileName = uploadedFile.value?.name.toLowerCase();

    if (uploadFileName?.includes("mntm-dev")) {
        if (uploadFileName?.includes(deviceCommit.toLowerCase())) return true;
    } else {
        if (uploadFileName?.includes(deviceVersion.toLowerCase())) return true;
    }

    if (selectedRelease.value) {
        if (uploadedFile.value || uploadedFileRelease.value) return false;

        const selectedCommit = selectedRelease.value.commit;
        const selectedVersion = selectedRelease.value.version;
        if (
            selectedCommit === deviceCommit ||
            selectedCommit.substring(0, 7).toLowerCase() ===
                deviceCommit.substring(0, 7).toLowerCase() ||
            (selectedVersion && selectedVersion === deviceVersion) ||
            (selectedVersion && selectedVersion.toLowerCase().includes(deviceVersion.toLowerCase()))
        ) {
            return true;
        }
    }

    return false;
});

const channelReleases = computed(() => {
    if (!selectedChannel.value) return [];
    return selectedChannel.value === "mainline" ? mainlineReleases : devbuildReleases;
});

const currentChangelogRelease = computed(() => {
    return selectedRelease.value;
});

watch(
    [() => selectedChannel.value, () => isMatchingRelease.value],
    ([newChannel, newIsMatching], [oldChannel, oldIsMatching]) => {
        if (typeof window !== "undefined") {
            if (newChannel !== oldChannel) {
                if (newChannel) {
                    localStorage.setItem(STORAGE_KEYS.UPDATER_SELECTED_CHANNEL, newChannel);
                } else {
                    localStorage.removeItem(STORAGE_KEYS.UPDATER_SELECTED_CHANNEL);
                }

                if (newChannel && selectedRelease.value) {
                    const currentChannelReleases =
                        newChannel === "mainline" ? mainlineReleases : devbuildReleases;
                    const releaseExists = currentChannelReleases.some(
                        (release) => release.commit === selectedRelease.value?.commit,
                    );

                    if (!releaseExists) {
                        selectedRelease.value = null;
                    }
                }
            }

            if (newIsMatching && !oldIsMatching) {
                const deviceCommit = serialConnection?.connectionData.deviceInfo?.firmware_commit;
                const deviceVersion = serialConnection?.connectionData.deviceInfo?.firmware_version;
                if (deviceCommit || deviceVersion) {
                    let inner = "Selected firmware";
                    if (uploadedFile.value || uploadedFileRelease.value) {
                        inner = "Uploaded file";
                    } else if (selectedRelease.value) {
                        inner = "Selected firmware";
                    }
                    logToSerial(
                        "warning",
                        `[Upload] ${inner} matches current device firmware (<a href="${getLocalizedPath("/releases")}/${deviceVersion?.replace("mntm-", "")}" target="_blank">${deviceVersion}</a>${deviceCommit && deviceCommit !== deviceVersion ? ", " + `<a href="${getLocalizedPath("/releases")}/${deviceCommit}" target="_blank">${deviceCommit}</a>` : ""})`,
                    );
                }
            }
        }
    },
);

const logToSerial = (level: "info" | "warning" | "error", message: string) => {
    if (serialConnection && serialConnection.addLog) {
        serialConnection.addLog(level, message);
    }
};

const processFile = (file: File, source: "uploaded" | "selected") => {
    if (!file.name.endsWith(".tgz")) {
        logToSerial(
            "error",
            `[Upload] Invalid file type: ${file.name} (only .tgz files are supported)`,
        );
        return;
    }

    uploadedFile.value = file;
    const versionOrCommit = parseUploadedFileName(file.name);
    const action = source === "uploaded" ? "uploaded" : "selected";

    if (versionOrCommit) {
        const foundRelease = getReleaseByCommit(versionOrCommit);
        uploadedFileRelease.value = foundRelease || null;

        if (foundRelease) {
            logToSerial(
                "info",
                `[Upload] File ${action}: ${file.name} (matched release: <a href="${getLocalizedPath("/releases")}/${foundRelease.commit}" target="_blank">${foundRelease.version || foundRelease.commit}</a>)`,
            );
        } else {
            logToSerial(
                "warning",
                `[Upload] File ${action}: ${file.name} (no matching release found)`,
            );
        }
    } else {
        uploadedFileRelease.value = null;
        logToSerial(
            "warning",
            `[Upload] File ${action}: ${file.name} (could not parse version/commit)`,
        );
    }
};

const { isOverDropZone: rawIsOverDropZone } = useDropZone(dropZoneRef, {
    onDrop: (files) => {
        if (flags.value.updateInProgress) {
            logToSerial("warning", "[Upload] Cannot upload file while update is in progress");
            return;
        }

        const file = files?.[0];
        if (file) {
            processFile(file, "uploaded");
        }
    },
    dataTypes: [
        "application/gzip",
        "application/x-gzip",
        "application/x-tar",
        "application/x-compressed-tar",
    ],
});

const isOverDropZone = computed(() => rawIsOverDropZone.value && !flags.value.updateInProgress);

const handleChannelChange = (channel: "mainline" | "devbuild") => {
    selectedChannel.value = channel;
    const releases = channel === "mainline" ? mainlineReleases : devbuildReleases;
    if (releases.length > 0) {
        selectRelease(releases[0]);
    } else {
        selectedRelease.value = null;
    }
};

const handleReleaseChange = (release: ReleaseItem) => {
    selectRelease(release);
};

const handleFlashFirmware = async () => {
    const releaseToFlash = uploadedFile.value || uploadedFileRelease.value || selectedRelease.value;
    if (!releaseToFlash || !serialConnection) {
        logToSerial("error", "[Upload] No release to flash or serial connection");
        return;
    }

    try {
        const updateMethod = testMode.value
            ? serialConnection.testUpdateFirmware
            : serialConnection.updateFirmware;

        if (!testMode.value && !isConnected.value) return;

        if (uploadedFile.value) {
            await updateMethod?.(releaseToFlash as ReleaseItem, uploadedFile.value);
        } else {
            await updateMethod?.(releaseToFlash as ReleaseItem);
        }
    } catch {
        /* ignore */
    }
};

const handleDownloadRelease = () => {
    if (!selectedRelease.value) return;

    // Find the firmware download URL
    const firmwareUrl = getFirmwareDownloadUrl(selectedRelease.value);

    if (firmwareUrl) {
        downloadFile(firmwareUrl);
        logToSerial(
            "info",
            `[Download] Downloading firmware: ${selectedRelease.value.version || selectedRelease.value.commit}`,
        );
    } else {
        logToSerial("error", "[Download] No firmware download URL found for selected release");
    }
};

// Helper function to get firmware download URL (same as in useSerialConnection)
const getFirmwareDownloadUrl = (release: ReleaseItem): string | null => {
    if (!release.files) return null;

    for (const file of release.files) {
        if (
            "url" in file &&
            file.url &&
            "filename" in file &&
            file.filename?.includes("update-mntm-") &&
            file.filename?.endsWith(".tgz")
        ) {
            return file.url;
        }

        if (
            "filename" in file &&
            file.filename?.includes("update-mntm-") &&
            file.filename.endsWith(".tgz")
        ) {
            return `https://up.momentum-fw.dev/builds/firmware/dev/${file.filename}`;
        }
    }

    return null;
};

const handleFileUpload = () => {
    if (flags.value.updateInProgress) return;
    fileInputRef.value?.click();
};

const handleFileChange = (event: Event) => {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) processFile(file, "selected");
};

const clearUploadedFile = () => {
    const fileName = uploadedFile.value?.name;
    uploadedFile.value = null;
    uploadedFileRelease.value = null;
    if (fileInputRef.value) {
        fileInputRef.value.value = "";
    }

    if (fileName) {
        logToSerial("info", `[Upload] File removed: ${fileName}`);
    }
};

const displayFileSize = computed(() => {
    if (uploadedFileRelease.value?.files && uploadedFile.value) {
        const matchingFile = uploadedFileRelease.value.files.find(
            (file) => "filename" in file && file.filename === uploadedFile.value?.name,
        );
        if (matchingFile && "size" in matchingFile && matchingFile.size) {
            return matchingFile.size;
        }
    }
    return uploadedFile.value ? bytesToSize(uploadedFile.value.size, true) : "";
});

const displayFileDate = computed(() => {
    if (uploadedFileRelease.value?.timestamp) {
        return formatFileDate(uploadedFileRelease.value.timestamp * 1000);
    }
    return uploadedFile.value ? formatFileDate(uploadedFile.value.lastModified) : "";
});

const toggleLogs = () => {
    isLogsExpanded.value = !isLogsExpanded.value;
};

const isChangelogOpen = computed(() => changelogState.value === "open");
const isChangelogExpanded = computed(() => changelogState.value === "expanded");
const isChangelogClosed = computed(() => changelogState.value === "closed");
const toggleChangelogOpenClose = () => {
    if (changelogState.value === "closed") {
        changelogState.value = "open";
    } else {
        changelogState.value = "closed";
    }

    nextTick(() => {
        triggerLogsScroll();
    });
};
const toggleChangelogExpand = () => {
    if (changelogState.value === "open") {
        changelogState.value = "expanded";
    } else if (changelogState.value === "expanded") {
        changelogState.value = "open";
    }

    nextTick(() => {
        triggerLogsScroll();
    });
};

onBeforeUnmount(() => {
    clearUploadedFile();
    if (dropZoneRef.value) {
        dropZoneRef.value = null;
    }
});
</script>

<template>
    <div
        class="relative w-full flex flex-col items-center"
        :style="windowWidth >= 1024 ? 'height: calc(100vh - var(--vp-nav-height));' : ''"
    >
        <div class="max-w-7xl mx-auto px-6 lg:px-8 flex-1 flex flex-col w-full min-h-0">
            <div
                class="flex flex-col h-full space-y-6 w-full min-h-0 py-6 lg:py-[var(--vp-nav-height)] border-t border-vp-divider"
            >
                <div class="flex flex-col lg:flex-row gap-x-6 flex-1 w-full min-h-0 h-full">
                    <div
                        class="flex flex-col w-full lg:w-[31%] h-full min-w-0 lg:min-w-80 sticky self-start pb-3 mb-1 lg:mb-0 lg:pb-0"
                        :class="{
                            'border-b border-vp-divider lg:border-b-0 pb-7': !isMatchingRelease,
                        }"
                        :style="
                            windowWidth >= 1024 ? 'top: calc(var(--vp-nav-height) + 24px);' : ''
                        "
                    >
                        <div class="flex-shrink-0 hidden lg:block">
                            <ScreenDisplay />
                        </div>
                        <div class="flex-shrink-0">
                            <UpdaterDeviceInfo />
                        </div>
                    </div>

                    <div
                        ref="dropZoneRef"
                        class="flex flex-col lg:w-2/3 min-w-0 relative flex-1 min-h-0 max-h-full transition-all duration-300"
                        :class="{
                            'border-vp-3/60 bg-vp-dark/10 border-dashed': isOverDropZone,
                        }"
                    >
                        <div
                            v-if="isOverDropZone"
                            class="absolute inset-0 bg-vp-dark/10 rounded-xl flex items-center justify-center"
                        ></div>

                        <div
                            class="relative flex flex-col border border-vp-divider rounded-lg px-6 pb-6"
                            :class="{
                                'min-h-[202px]': flags.updateInProgress,
                                'border-vp-divider/50': isInstallButtonHovered,
                            }"
                        >
                            <Transition name="overlay-fade">
                                <div
                                    v-if="showUpdateOverlay"
                                    class="absolute inset-0 bg-vp-dark/75 backdrop-blur-lg rounded-lg flex items-center justify-center z-50 min-h-0"
                                >
                                    <div
                                        v-if="updateStage !== 'update_stage_done'"
                                        class="w-full"
                                        :class="
                                            isChangelogExpanded
                                                ? 'py-6 px-28 min-h-[175px] flex items-center justify-center'
                                                : 'py-28 px-28'
                                        "
                                    >
                                        <div class="flex flex-row items-start gap-5 w-full">
                                            <div
                                                class="relative w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0"
                                            >
                                                <div
                                                    class="absolute inset-0 rounded-full border-2 border-transparent border-t-vp-brand-2 dark:border-t-mntm-yellow-1 animate-spin"
                                                ></div>
                                                <v-icon
                                                    name="pr-download"
                                                    :scale="1.3"
                                                    class="text-neutral-700"
                                                />
                                            </div>
                                            <div class="flex flex-col gap-3.5 flex-1 min-w-0">
                                                <p
                                                    class="text-lg font-medium text-vp-1 whitespace-nowrap overflow-hidden text-ellipsis"
                                                >
                                                    {{
                                                        tr(updateStage as any) ||
                                                        tr("update_stage_updating")
                                                    }}
                                                </p>
                                                <div class="w-full bg-vp-soft rounded-full h-1">
                                                    <div
                                                        class="bg-vp-brand-2 h-1 rounded-full transition-all duration-300"
                                                        :style="{
                                                            width: `${updateProgress * 100}%`,
                                                        }"
                                                    ></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div v-else class="flex flex-row items-center">
                                        <div
                                            class="w-14 h-14 rounded-full flex items-center justify-center"
                                        >
                                            <v-icon
                                                name="oi-check"
                                                :scale="1.85"
                                                class="text-green-500"
                                            />
                                        </div>
                                        <p class="text-lg font-medium text-vp-1 text-center">
                                            {{ tr("update_stage_done") }}
                                        </p>
                                    </div>
                                </div>
                            </Transition>

                            <Transition name="slide-up" mode="out-in">
                                <div v-if="!showUpdateOverlay" class="flex flex-col">
                                    <Transition name="fade-drop" mode="out-in">
                                        <div
                                            v-if="isMatchingRelease"
                                            class="flex flex-row items-center justify-start gap-3 w-full mt-5 mb-3 lg:mt-6 lg:mb-0"
                                        >
                                            <div class="flex-shrink-0">
                                                <v-icon
                                                    name="ri-error-warning-line"
                                                    scale="1.2"
                                                    class="text-yellow-700 dark:text-yellow-500 bg-yellow-300/20 dark:bg-yellow-900/15 border border-yellow-800/25 rounded-full p-0.5"
                                                />
                                            </div>
                                            <span class="text-xs text-vp-3 flex flex-row gap-2">
                                                {{ tr("updater_matching_release_warning") }}
                                                <div class="flex flex-row gap-px">
                                                    <span class="text-vp-3/60 mr-px">(</span>
                                                    <a
                                                        class="text-vp-2 hover:underline vp-external-link-icon"
                                                        :href="`${getLocalizedPath('/releases')}/${serialConnection?.connectionData.deviceInfo?.firmware_commit}`"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        {{
                                                            serialConnection?.connectionData
                                                                .deviceInfo?.firmware_commit
                                                        }}
                                                    </a>
                                                    <span class="text-vp-3/60">)</span>
                                                </div>
                                            </span>
                                        </div>
                                    </Transition>
                                    <div
                                        v-if="!isChangelogExpanded"
                                        class="flex-shrink-0 !z-10 transition-all duration-300"
                                        :class="{
                                            'opacity-0': showUpdateOverlay,
                                            'h-0 overflow-hidden':
                                                showUpdateOverlay && isChangelogExpanded,
                                            'opacity-30': isOverDropZone && !uploadedFile,
                                            'opacity-30 pointer-events-none':
                                                showUpdateOverlay && !isChangelogExpanded,
                                        }"
                                    >
                                        <h3
                                            class="text-[13px] leading-3 uppercase font-semibold text-vp-1 mt-6"
                                            :class="{
                                                'opacity-50 transition-opacity duration-200':
                                                    isInstallButtonHovered,
                                            }"
                                        >
                                            {{ tr("updater_select_firmware") }}
                                        </h3>
                                        <div
                                            class="transition-opacity duration-300 !z-20 mt-6"
                                            :class="{
                                                'opacity-30': isOverDropZone,
                                                'opacity-30 pointer-events-none': showUpdateOverlay,
                                            }"
                                        >
                                            <UpdaterControls
                                                :selected-channel="selectedChannel"
                                                :selected-release="selectedRelease"
                                                :channel-releases="channelReleases"
                                                :uploaded-file="uploadedFile"
                                                :test-mode="testMode"
                                                @channel-change="handleChannelChange"
                                                @release-change="handleReleaseChange"
                                                @flash-firmware="handleFlashFirmware"
                                                @download-release="handleDownloadRelease"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </Transition>

                            <Transition name="slide-up" mode="out-in">
                                <div
                                    v-if="!isChangelogExpanded"
                                    class="w-full relative flex-shrink-0 z-[1] transition-all duration-300 mt-6"
                                    :class="{
                                        'opacity-50 transition-opacity duration-200':
                                            isInstallButtonHovered,
                                        'opacity-0': showUpdateOverlay,
                                        'h-0 overflow-hidden':
                                            showUpdateOverlay && isChangelogExpanded,
                                        'opacity-90': isOverDropZone && !showUpdateOverlay,
                                        'opacity-30 pointer-events-none':
                                            showUpdateOverlay && !isChangelogExpanded,
                                    }"
                                >
                                    <div class="flex items-center justify-center gap-4 mb-6">
                                        <h3
                                            class="text-[13px] leading-3 uppercase font-semibold text-vp-1"
                                        >
                                            {{ tr("updater_or_install_from_file") }}
                                        </h3>
                                        <div class="flex-1 h-px bg-vp-divider w-full"></div>
                                    </div>

                                    <div v-if="uploadedFile" class="w-full">
                                        <div
                                            class="flex items-center justify-between p-4 bg-vp-bg/75 border border-vp-divider rounded-lg border-dashed"
                                            :class="{ 'border-vp-3/65': isOverDropZone }"
                                        >
                                            <div class="flex items-center gap-4">
                                                <div
                                                    class="flex items-center text-sm rounded-md p-1.5 border transition-all duration-100"
                                                    :class="
                                                        uploadedFileRelease && !isMatchingRelease
                                                            ? 'text-green-700 dark:text-green-500 bg-green-300/20 dark:bg-green-900/15 border-green-800/25'
                                                            : 'text-yellow-700 dark:text-yellow-500 bg-yellow-300/20 dark:bg-yellow-900/15 border-yellow-800/25'
                                                    "
                                                    :aria-label="tr('releases_current_version')"
                                                >
                                                    <v-icon
                                                        name="bi-file-earmark-zip"
                                                        scale="0.85"
                                                    />
                                                </div>
                                                <div class="flex items-center gap-2">
                                                    <div class="flex flex-col gap-0.5">
                                                        <span class="text-sm font-medium text-vp-1">
                                                            {{ uploadedFile.name }}
                                                        </span>
                                                        <div
                                                            class="flex items-center gap-3 text-xs text-vp-3"
                                                        >
                                                            <span
                                                                v-if="
                                                                    uploadedFileRelease?.branch ||
                                                                    uploadedFileRelease?.commit
                                                                "
                                                            >
                                                                {{
                                                                    uploadedFileRelease?.branch ||
                                                                    uploadedFileRelease?.commit
                                                                }}</span
                                                            >
                                                            <span>{{ displayFileSize }}</span>
                                                            <span>{{ displayFileDate }}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="flex items-center gap-3">
                                                <button
                                                    class="px-3 py-[7px] text-xs font-medium !text-vp-2 hover:!text-vp-1 !bg-vp-3/10 hover:!bg-vp-3/25 dark:!bg-vp-3/10 dark:hover:!bg-vp-3/25 rounded-md transition-colors whitespace-nowrap"
                                                    @click="handleFileUpload"
                                                >
                                                    {{ tr("updater_change_button") }}
                                                </button>
                                                <button
                                                    class="px-3 py-[7px] text-xs font-medium !text-red-500 hover:!text-red-600 !bg-red-500/10 hover:!bg-red-500/25 dark:!bg-red-600/10 dark:hover:!bg-red-500/15 rounded-md transition-colors whitespace-nowrap"
                                                    @click="clearUploadedFile"
                                                >
                                                    {{ tr("updater_remove_button") }}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div
                                        v-else
                                        class="w-full border border-dashed border-vp-divider rounded-xl flex items-center justify-center bg-vp-dark/60 dark:bg-vp-bg/90 cursor-pointer pt-6 pb-7 backdrop-blur-md relative z-10"
                                        :class="{
                                            'border-vp-brand-1 bg-vp-brand-soft': isOverDropZone,
                                            'opacity-50 !cursor-not-allowed':
                                                flags.updateInProgress,
                                            'hover:bg-vp-soft/40 hover:dark:bg-vp-bg/40':
                                                !flags.updateInProgress,
                                        }"
                                        @click="handleFileUpload"
                                    >
                                        <div
                                            class="flex flex-col items-center gap-1 text-center select-none"
                                        >
                                            <p class="text-sm text-vp-2">
                                                {{
                                                    isOverDropZone
                                                        ? tr("updater_drop_file_here")
                                                        : tr("updater_drop_file_browse")
                                                }}
                                            </p>
                                            <p class="text-xs text-vp-3">
                                                {{ tr("updater_file_example") }}
                                            </p>
                                        </div>
                                    </div>

                                    <input
                                        ref="fileInputRef"
                                        type="file"
                                        accept=".tgz"
                                        class="hidden"
                                        @change="handleFileChange"
                                    />
                                </div>
                            </Transition>
                        </div>

                        <div
                            v-if="windowWidth >= 1024 || selectedRelease || uploadedFileRelease"
                            class="min-h-14 transition-opacity duration-200 mt-6"
                            :class="{
                                'opacity-50': isInstallButtonHovered,
                                'opacity-30': isOverDropZone,
                                'flex-1 min-h-0 mb-6': !isChangelogClosed,
                                'flex-shrink-0 mb-6': isChangelogClosed,
                            }"
                        >
                            <UpdaterChangelog
                                :selected-release="currentChangelogRelease"
                                :uploaded-file="uploadedFile"
                                :uploaded-file-release="uploadedFileRelease"
                                :changelog-state="changelogState"
                                @toggle-open-close="toggleChangelogOpenClose"
                                @toggle-expand="toggleChangelogExpand"
                            />
                        </div>

                        <div
                            class="min-h-14 transition-opacity duration-200"
                            :class="{
                                'opacity-50': isInstallButtonHovered,
                                'opacity-30': isOverDropZone,
                                'flex-shrink-0': !isChangelogClosed,
                                'flex-1 min-h-0': isChangelogClosed,
                            }"
                        >
                            <UpdaterLogs
                                :is-expanded="isLogsExpanded"
                                :changelog-is-open="isChangelogOpen"
                                @toggle="toggleLogs"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.logs-expand-enter-active,
.logs-expand-leave-active {
    transition: all 0.3s ease-in-out;
    overflow: hidden;
}

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

.slide-up-enter-active,
.slide-up-leave-active {
    transition: all 0.3s ease-in-out;
    overflow: hidden;
}

.slide-up-enter-from {
    opacity: 0;
    max-height: 0;
    transform: translateY(-20px);
}

.slide-up-enter-to {
    opacity: 1;
    max-height: 1000px;
    transform: translateY(0);
}

.slide-up-leave-from {
    opacity: 1;
    max-height: 1000px;
    transform: translateY(0);
}

.slide-up-leave-to {
    opacity: 0;
    max-height: 0;
    transform: translateY(-20px);
}

.overlay-fade-enter-active,
.overlay-fade-leave-active {
    transition: opacity 0.3s ease-in-out;
}

.overlay-fade-enter-from,
.overlay-fade-leave-to {
    opacity: 0;
}

.overlay-fade-enter-to,
.overlay-fade-leave-from {
    opacity: 1;
}

.fade-drop-enter-active,
.fade-drop-leave-active {
    transition: all 0.4s ease-out;
}

.fade-drop-enter-from {
    opacity: 0;
    transform: translateY(-10px);
}

.fade-drop-enter-to {
    opacity: 1;
    transform: translateY(0);
}

.fade-drop-leave-from {
    opacity: 1;
    transform: translateY(0);
}

.fade-drop-leave-to {
    opacity: 0;
    transform: translateY(-10px);
}
</style>
