<script setup lang="ts">
import { track } from "@vercel/analytics";
import { useDropZone, useStorage, useWindowSize } from "@vueuse/core";
import { computed, inject, nextTick, onBeforeUnmount, onMounted, provide, ref, watch } from "vue";
import type { ReleaseChannel, ReleaseItem } from "../../../_data/releases";
import {
    branchReleases,
    devbuildReleases,
    getReleaseByVersion,
    mainlineReleases,
} from "../../../_data/releases";
import { useConnectionInfo } from "../composables/useConnectionInfo";
import { useI18n } from "../composables/useI18n";
import { usePanelResize } from "../composables/usePanelResize";
import { useReleaseNavigation } from "../composables/useReleaseNavigation";
import type { useSerialConnection } from "../composables/useSerialConnection";
import { useSettings } from "../composables/useSettings";
import { useSharedHover } from "../composables/useSharedHover";
import { useThemeSwitcher } from "../composables/useThemeSwitcher";
import { formatDate } from "../date";
import { STORAGE_KEYS } from "../types";

import {
    bytesToSize,
    devMode,
    downloadFile,
    getFirmwareDownloadUrl,
    parseUploadedFileName,
    supportsSerialPort,
} from "../util";

import Tooltip from "./Tooltip.vue";
import UpdaterChangelog from "./UpdaterChangelog.vue";
import UpdaterControls from "./UpdaterControls.vue";
import UpdaterDeviceInfo from "./UpdaterDeviceInfo.vue";
import UpdaterGlow from "./UpdaterGlow.vue";
import UpdaterLogs from "./UpdaterLogs.vue";
import UpdaterOverlay from "./UpdaterOverlay.vue";

const { tr, getLocalizedPath } = useI18n();
const { width: windowWidth, height: windowHeight } = useWindowSize();
const { flags, isConnected: connectionIsConnected } = useConnectionInfo();
const { isHovered: isInstallButtonHovered } = useSharedHover("disabled-install-button");
const { currentTheme } = useThemeSwitcher();
const { screenColor } = useSettings();

const {
    containerRef: panelContainerRef,
    dividerRef,
    isDragging,
    topPanelHeight,
    bottomPanelHeight,
    topPanelHeightWhenBottomClosed,
    bottomPanelHeightWhenTopClosed,
    startDrag,
} = usePanelResize({});

const serialConnection = inject<ReturnType<typeof useSerialConnection> | null>("serialConnection");
const selectedChannel = ref<ReleaseChannel | null>(null);

const { selectedRelease, selectRelease } = useReleaseNavigation({
    basePath: "/update",
    useQueryParams: true,
    storageKeys: {
        selectedVersion: STORAGE_KEYS.UPDATER_SELECTED_VERSION,
        selectedChannel: STORAGE_KEYS.UPDATER_SELECTED_CHANNEL,
    },
    onChannelChange: (channel: ReleaseChannel) => {
        selectedChannel.value = channel;
    },
});

const uploadedFile = ref<File | null>(null);
const uploadedFileRelease = ref<ReleaseItem | null>(null);
const fileInputRef = ref<HTMLInputElement | null>(null);
const dropZoneRef = ref<HTMLDivElement | null>(null);

const changelogState = useStorage(STORAGE_KEYS.UPDATER_CHANGELOG_STATE, "open");
const isLogsOpen = useStorage(STORAGE_KEYS.UPDATER_LOGS_STATE, false);
const testMode = ref(devMode() || false); // TEST: DONT leave this as true
const loopMode = ref(false); // TEST: DONT leave this as true

const logsScrollTrigger = ref(0);
const triggerLogsScroll = () => {
    logsScrollTrigger.value++;
};

provide("logsScrollTrigger", logsScrollTrigger);

const showUpdateOverlay = computed(() => serialConnection?.flags.updateInProgress || false);
const isConnected = computed(() => connectionIsConnected.value);
const isNarrowViewport = computed(() => windowHeight.value < 1024);
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

        if (deviceVersion === "mntm-dev") {
            return deviceCommit === selectedRelease.value.version;
        } else {
            return deviceVersion === selectedRelease.value.version;
        }
    }

    return false;
});

const currentDeviceVersion = computed(() => {
    return serialConnection?.connectionData.deviceInfo?.firmware_version === "mntm-dev"
        ? serialConnection?.connectionData.deviceInfo?.firmware_commit
        : serialConnection?.connectionData.deviceInfo?.firmware_version;
});

const channelReleases = computed(() => {
    if (!selectedChannel.value) return [];
    return selectedChannel.value === "mainline"
        ? mainlineReleases
        : selectedChannel.value === "devbuild"
          ? devbuildReleases
          : branchReleases;
});

const currentChangelogRelease = computed(() => {
    return selectedRelease.value;
});

watch(
    [() => selectedChannel.value, () => isMatchingRelease.value],
    ([newChannel, newIsMatching], [oldChannel, oldIsMatching]) => {
        if (typeof window !== "undefined") {
            if (newChannel !== oldChannel) {
                if (newChannel && selectedRelease.value) {
                    const currentChannelReleases =
                        newChannel === "mainline"
                            ? mainlineReleases
                            : newChannel === "devbuild"
                              ? devbuildReleases
                              : branchReleases;
                    const releaseExists = currentChannelReleases.some(
                        (release) => release.version === selectedRelease.value?.version,
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
                    }
                    const logVersion =
                        deviceVersion === "mntm-dev"
                            ? "mntm-dev"
                            : `<a href="${getLocalizedPath("/releases")}/${deviceVersion}" target="_blank">${deviceVersion}</a>`;
                    const logCommit =
                        deviceVersion === "mntm-dev"
                            ? `<a href="${getLocalizedPath("/releases")}/${deviceCommit}" target="_blank">${deviceCommit}</a>`
                            : deviceCommit;
                    logToSerial(
                        "warning",
                        `[${inner === "Selected firmware" ? "Release" : "Upload"}] ${inner} matches current device firmware (${logVersion}, ${logCommit})`,
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
    const version = parseUploadedFileName(file.name);
    const action = source === "uploaded" ? "uploaded" : "selected";

    if (version) {
        const foundRelease = getReleaseByVersion(version);
        uploadedFileRelease.value = foundRelease || null;

        if (foundRelease) {
            logToSerial(
                "info",
                `[Upload] File ${action}: \`${file.name}\` (matched release: <a href="${getLocalizedPath("/releases")}/${foundRelease.version}" target="_blank">${foundRelease.version}</a>)`,
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
const isBranchRelease = computed(() => selectedChannel.value === "branch");

const handleChannelChange = (channel: ReleaseChannel) => {
    selectedChannel.value = channel;
    const releases =
        channel === "mainline"
            ? mainlineReleases
            : channel === "devbuild"
              ? devbuildReleases
              : branchReleases;
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
    if (!serialConnection) {
        logToSerial("error", "[Upload] No release to flash or serial connection");
        return;
    }

    const releaseArg: ReleaseItem | undefined = uploadedFile.value
        ? undefined
        : uploadedFileRelease.value || selectedRelease.value || undefined;

    if (!testMode.value && !isConnected.value) return;

    try {
        const uploadedForTest = uploadedFile.value ?? null;
        const uploadedForUpdate = uploadedFile.value ?? undefined;
        const success = testMode.value
            ? await serialConnection.testUpdateFirmware(releaseArg, uploadedForTest, loopMode.value)
            : await serialConnection.updateFirmware(releaseArg, uploadedForUpdate);

        if (success) {
            track("firmware_flash", {
                version:
                    releaseArg?.version || uploadedFile.value?.name.replace(".tgz", "") || "null",
                theme: `${currentTheme.value}_${screenColor.value}`,
            });
        }
    } catch (error) {
        logToSerial("error", `[Upload] Flash failed: ${error}`);
    }
};

const handleDownloadRelease = () => {
    if (!selectedRelease.value) return;

    const firmwareUrl = getFirmwareDownloadUrl(selectedRelease.value);

    if (firmwareUrl) {
        downloadFile(firmwareUrl);
        logToSerial("info", `[Download] Downloading firmware: ${firmwareUrl}`);
    } else {
        logToSerial("error", "[Download] No firmware download URL found for selected release");
    }
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
        return formatDate(uploadedFileRelease.value.timestamp, "short");
    }
    return uploadedFile.value ? formatDate(uploadedFile.value.lastModified / 1000, "short") : "";
});

const toggleLogs = () => {
    // dont allow closing logs if its the only panel with content
    if (isLogsOpen.value && !hasChangelogContent.value && hasLogsContent.value) {
        return;
    }

    const newLogsState = !isLogsOpen.value;
    isLogsOpen.value = newLogsState;

    // if were closing logs and have changelog content but it's closed, open it
    if (!newLogsState && hasChangelogContent.value && isChangelogClosed.value) {
        changelogState.value = "open";
    }
};

const isChangelogExpanded = computed(() => changelogState.value === "expanded");
const isChangelogClosed = computed(() => changelogState.value === "closed");
const hasChangelogContent = computed(() => {
    return !!(selectedRelease.value || uploadedFileRelease.value);
});
const hasLogsContent = computed(() => {
    return !!(serialConnection?.logs && serialConnection.logs.length > 0);
});

const effectiveLogsOpen = computed(() => {
    // if logs are marked as open but have no content, theyre effectively closed
    if (isLogsOpen.value && !hasLogsContent.value) {
        return false;
    }
    // if no changelog content but have logs, force logs open
    if (!hasChangelogContent.value && hasLogsContent.value) {
        return true;
    }
    // if changelog is closed and we have logs, logs should be open
    if (isChangelogClosed.value && hasLogsContent.value) {
        return true;
    }
    return isLogsOpen.value && hasLogsContent.value;
});

const effectiveChangelogOpen = computed(() => {
    // if we have changelog content and logs are effectively closed, changelog should be open
    if (hasChangelogContent.value && !effectiveLogsOpen.value) {
        return true;
    }
    // if we have changelog content, respect the user's choice unless logs force it closed
    return hasChangelogContent.value && !isChangelogClosed.value;
});

const toggleChangelogOpenClose = () => {
    // dont allow closing if it's the only panel with content
    if (!isChangelogClosed.value && !effectiveLogsOpen.value) {
        return;
    }

    if (changelogState.value === "closed") {
        changelogState.value = "open";
    } else {
        changelogState.value = "closed";
        // if were closing changelog and have logs content, open them
        if (hasLogsContent.value && !isLogsOpen.value) {
            isLogsOpen.value = true;
        }
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

onMounted(() => {
    if (changelogState.value === "expanded") {
        changelogState.value = "open";
    }

    // if logs are marked as open but have no content, and we have changelog content, ensure changelog is open
    if (isLogsOpen.value && !hasLogsContent.value && hasChangelogContent.value) {
        changelogState.value = "open";
    }
});

onBeforeUnmount(() => {
    clearUploadedFile();
    if (dropZoneRef.value) {
        dropZoneRef.value = null;
    }
});
</script>

<template>
    <div
        class="relative w-full flex flex-col items-center lg:py-14 lg:pb-28 lg:px-5 transition-colors duration-500"
        :style="
            windowWidth >= 1024 && !isNarrowViewport
                ? 'height: calc(100vh - var(--vp-nav-height));'
                : ''
        "
        :class="{
            'min-h-[calc(100vh-var(--vp-nav-height))] lg:pt-10':
                windowWidth >= 1024 && isNarrowViewport,
        }"
    >
        <div
            class="absolute top-0 left-0 w-full h-[121px] border-b border-vp-divider z-[-1]"
            :class="{
                'h-[97px]': !isNarrowViewport,
                'h-[81px]': isNarrowViewport,
            }"
        ></div>

        <div
            class="max-w-6xl mx-auto flex-1 flex flex-col w-full min-h-0 rounded-xl overflow-clip lg:border border-vp-divider bg-vp-dark"
        >
            <div class="flex flex-col h-full space-y-6 w-full min-h-0">
                <div class="flex flex-col lg:flex-row flex-1 w-full min-h-0 h-full">
                    <div
                        class="device-info-wrapper flex flex-col w-full lg:w-[32%] h-full flex-shrink-0 overflow-hidden min-w-0 lg:min-w-80 sticky self-start"
                        :class="{
                            'h-full': !isConnected,
                            'h-screen': !isConnected && isNarrowViewport,
                        }"
                        :style="windowWidth >= 1024 ? 'top: calc(var(--vp-nav-height));' : ''"
                        :data-connected="isConnected"
                        :data-hovered="isInstallButtonHovered"
                    >
                        <div class="flex-shrink-0 h-full">
                            <UpdaterDeviceInfo />
                        </div>
                    </div>

                    <div
                        class="w-px bg-vp-divider z-10"
                        :class="{
                            'h-full': !isNarrowViewport,
                            'min-h-screen': isNarrowViewport,
                        }"
                    ></div>

                    <div
                        ref="dropZoneRef"
                        class="flex flex-col pb-5 lg:w-2/3 min-w-0 relative flex-1 min-h-0 max-h-full transition-all duration-300 overflow-hidden"
                        :class="{
                            'border-vp-3/60 bg-vp-dark/10 border-dashed': isOverDropZone,
                        }"
                    >
                        <UpdaterGlow :show="showUpdateOverlay" />

                        <div
                            v-if="isOverDropZone"
                            class="absolute inset-0 bg-vp-dark/10 rounded-xl flex items-center justify-center"
                        ></div>

                        <div
                            v-if="!isChangelogExpanded"
                            class="relative flex flex-col z-10"
                            :class="{
                                'min-h-[185px]': flags.updateInProgress,
                                'border-vp-divider/50': isInstallButtonHovered,
                            }"
                        >
                            <UpdaterOverlay
                                :show-update-overlay="showUpdateOverlay"
                                :is-changelog-expanded="isChangelogExpanded"
                            />

                            <Transition name="slide-up" mode="out-in">
                                <div
                                    v-if="!showUpdateOverlay"
                                    class="flex flex-col border-t lg:border-t-0 border-vp-divider"
                                >
                                    <Transition name="fade-drop" mode="out-in">
                                        <div
                                            v-if="isMatchingRelease || isBranchRelease"
                                            class="flex flex-row items-start md:items-center justify-center gap-2 w-full py-1.5 px-2 lg:mb-0 border-b border-vp-divider bg-yellow-300/10 dark:bg-yellow-900/5 h-10"
                                            :class="{
                                                'opacity-40': isOverDropZone,
                                            }"
                                        >
                                            <div class="flex-shrink-0">
                                                <v-icon
                                                    :name="
                                                        isBranchRelease
                                                            ? 'md-warningamber-round'
                                                            : 'ri-error-warning-line'
                                                    "
                                                    :scale="isBranchRelease ? 1.1 : 1.0"
                                                    class="text-yellow-600 dark:text-yellow-500 p-0.5 mt-px"
                                                />
                                            </div>
                                            <span
                                                class="text-xs font-medium text-yellow-700 dark:text-yellow-500 flex flex-col-reverse md:flex-row gap-2"
                                            >
                                                {{
                                                    isMatchingRelease
                                                        ? uploadedFile
                                                            ? tr(
                                                                  "updater_matching_release_warning",
                                                                  {
                                                                      type: tr(
                                                                          "updater_upload_file",
                                                                      ),
                                                                  },
                                                              )
                                                            : tr(
                                                                  "updater_matching_release_warning",
                                                                  {
                                                                      type: tr(
                                                                          "updater_select_release",
                                                                      ),
                                                                  },
                                                              )
                                                        : isBranchRelease
                                                          ? tr("updater_branch_warning")
                                                          : ""
                                                }}
                                                <div class="flex flex-row gap-px">
                                                    <a
                                                        class="font-medium text-yellow-950/90 dark:text-yellow-100/90 hover:underline underline underline-offset-4 dark:decoration-yellow-200/20 decoration-yellow-950/20 hover:decoration-yellow-950/50 dark:hover:decoration-yellow-200/40 transition-all duration-100 vp-external-link-icon"
                                                        :href="
                                                            isBranchRelease
                                                                ? `https://github.com/Next-Flip/Momentum-Firmware/tree/${selectedRelease?.version}`
                                                                : `${getLocalizedPath('/releases')}/${currentDeviceVersion}`
                                                        "
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        {{
                                                            isBranchRelease
                                                                ? selectedRelease?.version +
                                                                  " (Github)"
                                                                : currentDeviceVersion
                                                        }}
                                                    </a>
                                                </div>
                                            </span>
                                        </div>
                                    </Transition>
                                    <div
                                        v-if="!isChangelogExpanded"
                                        class="flex-shrink-0 !z-10 transition-all duration-300 px-5"
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
                                            class="text-[13px] leading-3 uppercase font-semibold text-vp-1 mt-7"
                                            :class="{
                                                'opacity-40 transition-opacity duration-200':
                                                    isInstallButtonHovered ||
                                                    uploadedFile ||
                                                    isOverDropZone,
                                            }"
                                        >
                                            {{ tr("updater_select_firmware") }}
                                        </h3>
                                        <div
                                            class="transition-opacity duration-300 !z-20 mt-4"
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
                                                :is-matching-release="isMatchingRelease"
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
                                    class="w-full relative flex-shrink-0 z-[1] transition-all duration-300 px-5"
                                    :class="{
                                        'opacity-50 transition-opacity duration-200':
                                            isInstallButtonHovered,
                                        'opacity-0': showUpdateOverlay,
                                        'h-0 overflow-hidden':
                                            showUpdateOverlay && isChangelogExpanded,
                                        'opacity-90': isOverDropZone && !showUpdateOverlay,
                                        'opacity-0 pointer-events-none':
                                            showUpdateOverlay && !isChangelogExpanded,
                                        'mb-0': supportsSerialPort(),
                                    }"
                                >
                                    <div
                                        v-if="supportsSerialPort()"
                                        class="flex items-end justify-start gap-2 mb-5 mt-7"
                                    >
                                        <div class="flex items-center justify-start gap-2">
                                            <Tooltip
                                                :aria-label="tr('releases_install')"
                                                :delay="0"
                                                :hide-delay="100"
                                                :max-width="'315px'"
                                                class="files-tooltip z-[1]"
                                            >
                                                <div
                                                    class="flex items-center justify-center text-vp-3/70 hover:!text-vp-2 transition-colors duration-200 cursor-help"
                                                >
                                                    <v-icon
                                                        name="md-infooutline-round"
                                                        scale="0.9"
                                                    />
                                                </div>
                                                <template #content>
                                                    <div
                                                        class="prose prose-sm dark:prose-invert !text-white max-w-none text-center justify-center"
                                                    >
                                                        <span
                                                            v-html="
                                                                tr(
                                                                    'updater_install_from_file_tooltip',
                                                                    {
                                                                        url: getLocalizedPath(
                                                                            `/releases`,
                                                                        ),
                                                                        text: `here`,
                                                                    },
                                                                )
                                                            "
                                                        ></span>
                                                    </div>
                                                </template>
                                            </Tooltip>
                                            <h3
                                                class="text-[13px] leading-3 uppercase font-semibold text-vp-1 mr-2"
                                            >
                                                {{ tr("updater_or_install_from_file") }}
                                            </h3>
                                        </div>
                                    </div>

                                    <div v-if="supportsSerialPort() && uploadedFile" class="w-full">
                                        <div
                                            class="flex items-center justify-between p-4 bg-vp-bg/55 border border-vp-divider rounded-lg border-dashed"
                                            :class="{ 'border-vp-3/65': isOverDropZone }"
                                        >
                                            <div class="flex items-center gap-4">
                                                <div
                                                    class="flex items-center text-sm rounded-md p-1.5 border transition-all duration-100"
                                                    :class="
                                                        uploadedFileRelease && !isMatchingRelease
                                                            ? 'text-green-700 dark:text-green-500 bg-green-300/20 dark:bg-green-900/15 border-green-800/25'
                                                            : 'text-yellow-600 dark:text-yellow-500 bg-yellow-300/20 dark:bg-yellow-900/15 border-yellow-800/25'
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
                                                                v-if="uploadedFileRelease?.version"
                                                            >
                                                                {{ uploadedFileRelease?.version }}
                                                            </span>
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
                                        v-else-if="supportsSerialPort()"
                                        class="w-full border border-dashed border-vp-divider rounded-lg flex items-center justify-center cursor-pointer relative z-10 p-px"
                                        :class="{
                                            'border-vp-3/40 bg-vp-3/10': isOverDropZone,
                                            'opacity-50 !cursor-not-allowed':
                                                flags.updateInProgress,
                                            'hover:bg-vp-soft/40 hover:dark:bg-vp-bg/90 hover:border-vp-border/80':
                                                !flags.updateInProgress,
                                        }"
                                        @click="handleFileUpload"
                                    >
                                        <div
                                            class="flex flex-col items-center gap-0.5 text-center select-none bg-vp-dark/60 dark:bg-vp-bg/80 w-full h-full pt-6 pb-7 px-6 rounded-lg"
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
                                    <div
                                        v-if="!showUpdateOverlay"
                                        class="h-px bg-vp-3/25 w-auto mt-5 mx-5"
                                        :class="{
                                            'opacity-30': isOverDropZone,
                                        }"
                                    ></div>
                                </div>
                            </Transition>
                        </div>

                        <div
                            v-if="windowWidth >= 1024 || selectedRelease || uploadedFileRelease"
                            ref="panelContainerRef"
                            class="flex flex-col transition-opacity duration-250 overflow-hidden"
                            :class="{
                                'min-h-0 flex-1': !isNarrowViewport,
                                'max-h-[1325px] h-full': isNarrowViewport,
                                'opacity-50': isInstallButtonHovered,
                                'opacity-30': isOverDropZone,
                                'mt-5': selectedRelease || uploadedFileRelease,
                            }"
                        >
                            <div
                                v-if="hasChangelogContent"
                                class="min-h-14 flex flex-col"
                                :class="{
                                    'transition-all duration-200': !isDragging,
                                    'flex-shrink-0': isChangelogClosed,
                                    'min-h-0 overflow-hidden': effectiveChangelogOpen,
                                    'opacity-55 dark:opacity-65 hover:!opacity-100':
                                        showUpdateOverlay,
                                    '!opacity-100': isDragging,
                                }"
                                :style="{
                                    height: !effectiveChangelogOpen
                                        ? '56px'
                                        : effectiveLogsOpen
                                          ? topPanelHeight
                                          : topPanelHeightWhenBottomClosed,
                                }"
                            >
                                <UpdaterChangelog
                                    :show-update-overlay="showUpdateOverlay"
                                    :selected-release="currentChangelogRelease"
                                    :uploaded-file="uploadedFile"
                                    :uploaded-file-release="uploadedFileRelease"
                                    :changelog-state="
                                        supportsSerialPort() ? changelogState : 'open'
                                    "
                                    :is-logs-open="effectiveLogsOpen"
                                    :is-narrow-viewport="isNarrowViewport"
                                    @toggle-open-close="toggleChangelogOpenClose"
                                    @toggle-expand="toggleChangelogExpand"
                                />
                            </div>

                            <div
                                v-if="supportsSerialPort()"
                                ref="dividerRef"
                                class="flex flex-row min-h-5 w-full items-center justify-center relative px-10 cursor-row-resize select-none transition-all duration-200"
                                :class="{
                                    'opacity-55 dark:opacity-65':
                                        effectiveChangelogOpen && effectiveLogsOpen,
                                    'opacity-0 pointer-events-none': !(
                                        effectiveChangelogOpen && effectiveLogsOpen
                                    ),
                                }"
                                tabindex="0"
                                role="separator"
                                :aria-label="tr('updater_resize_panels')"
                                @mousedown="startDrag"
                            >
                                <div
                                    class="flex flex-row items-center justify-center w-full h-full group"
                                >
                                    <div
                                        class="h-px border-t border-dotted border-vp-divider w-auto flex-1 transition-colors duration-200"
                                        :class="{
                                            'border-vp-3/50 !border-solid': isDragging,
                                        }"
                                    ></div>
                                    <div
                                        class="h-[3px] bg-vp-border rounded-full w-10 absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 transition-all duration-200 group-hover:bg-vp-brand-2"
                                        :class="{
                                            'bg-vp-brand-1 scale-110': isDragging,
                                        }"
                                    ></div>
                                </div>
                            </div>

                            <div
                                v-if="supportsSerialPort()"
                                class="min-h-14 flex flex-col"
                                :class="{
                                    'transition-all duration-200': !isDragging,
                                    'flex-shrink-0': !effectiveLogsOpen,
                                    'min-h-0 overflow-hidden': effectiveLogsOpen,
                                    'opacity-55 dark:opacity-65 hover:!opacity-100':
                                        showUpdateOverlay,
                                    '!opacity-100': isDragging,
                                }"
                                :style="{
                                    height: !effectiveLogsOpen
                                        ? '56px'
                                        : !hasChangelogContent || !effectiveChangelogOpen
                                          ? bottomPanelHeightWhenTopClosed
                                          : bottomPanelHeight,
                                }"
                            >
                                <UpdaterLogs
                                    :is-open="effectiveLogsOpen"
                                    :is-changelog-open="effectiveChangelogOpen"
                                    :is-changelog-expanded="isChangelogExpanded"
                                    :is-changelog-closed="!effectiveChangelogOpen"
                                    :is-narrow-viewport="isNarrowViewport"
                                    :is-selected-or-uploaded-file="hasChangelogContent"
                                    @toggle="toggleLogs"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.device-info-wrapper:before {
    content: "";
    position: absolute;
    top: 24%;
    left: 18%;
    width: 60%;
    height: 60%;
    transform: rotate(-45deg);
    background-image: url("/bg/flipper.png");
    background-size: contain;
    background-position: center;
    background-repeat: no-repeat;
    opacity: 0.04;
    filter: saturate(0);
    z-index: 0;
    transition: opacity 0.2s ease-in-out;
}

@media (min-width: 1024px) {
    .device-info-wrapper:before {
        top: -25%;
        left: -28%;
        width: 150%;
        height: 150%;
    }
}

.dark .device-info-wrapper:before {
    mix-blend-mode: lighten;
    opacity: 0.03;
    filter: saturate(0) invert(1);
}

.device-info-wrapper[data-connected="true"]:before {
    opacity: 0;
}

.device-info-wrapper[data-hovered="true"]:before {
    opacity: 0.055;
}
.dark .device-info-wrapper[data-hovered="true"]:before {
    opacity: 0.035;
}

.device-info-wrapper:after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: var(--vp-c-brand-3);
    opacity: 0;
    transition: opacity 0.2s ease-in-out;
    z-index: 0;
    pointer-events: none;
}

.device-info-wrapper[data-hovered="true"]:after {
    opacity: 0.01;
}
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
