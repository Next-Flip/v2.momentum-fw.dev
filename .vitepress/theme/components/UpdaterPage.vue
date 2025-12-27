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
import {
    useConnectionInfo,
    useI18n,
    usePanelResize,
    useReleaseNavigation,
    useSerialConnection,
    useSettings,
    useSharedHover,
    useThemeSwitcher,
} from "../composables";
import { formatDate } from "../date";
import { STORAGE_KEYS } from "../types";
import {
    bytesToSize,
    devMode,
    downloadFile,
    getFirmwareDownloadUrl,
    githubPullRequestUrl,
    parseUploadedFileName,
    replaceIn,
    supportsSerialPort,
} from "../util";

import UpdaterChangelog from "./UpdaterChangelog.vue";
import UpdaterControls from "./UpdaterControls.vue";
import UpdaterDeviceInfo from "./UpdaterDeviceInfo.vue";
import UpdaterFileUpload from "./UpdaterFileUpload.vue";
import UpdaterGlow from "./UpdaterGlow.vue";
import UpdaterLogs from "./UpdaterLogs.vue";
import UpdaterOverlay from "./UpdaterOverlay.vue";
import UpdaterWarning from "./UpdaterWarning.vue";

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

const logToSerial = (level: "info" | "warning" | "error", message: string) => {
    if (serialConnection && serialConnection.addLog) {
        serialConnection.addLog(level, message);
    }
};

const { selectedRelease, selectRelease } = useReleaseNavigation({
    basePath: "/update",
    useQueryParams: true,
    storageKeys: {
        selectedVersion: STORAGE_KEYS.UPDATER_SELECTED_VERSION,
        selectedChannel: STORAGE_KEYS.UPDATER_SELECTED_CHANNEL,
    },
    defaultFallback: () => {
        return !supportsSerialPort() ? mainlineReleases[0] : null;
    },
    onChannelChange: (channel: ReleaseChannel) => {
        selectedChannel.value = channel;
    },
});

const uploadedFile = ref<File | null>(null);
const uploadedFileRelease = ref<ReleaseItem | null>(null);
const dropZoneRef = ref<HTMLDivElement | null>(null);

const changelogState = useStorage(STORAGE_KEYS.UPDATER_CHANGELOG_STATE, "open");
const isLogsOpen = useStorage(STORAGE_KEYS.UPDATER_LOGS_STATE, false);
const testMode = ref(devMode() || false); // TEST: DO NOT leave this as true
const loopMode = ref(false); // TEST: DO NOT leave this as true

const logsScrollTrigger = ref(0);
const triggerLogsScroll = () => {
    logsScrollTrigger.value++;
};

provide("logsScrollTrigger", logsScrollTrigger);

const showUpdateOverlay = computed(() => serialConnection?.flags.updateInProgress || false); // TEST: DO NOT leave this as true
const isConnected = computed(() => connectionIsConnected.value);
const isNarrowViewport = computed(() => windowHeight.value < 1024);
const isBranchRelease = computed(() => selectedChannel.value === "branch");

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
            const releaseCommit = selectedRelease.value.version || selectedRelease.value.branch;
            return deviceCommit === releaseCommit;
        } else {
            return deviceVersion === selectedRelease.value.version;
        }
    }

    return false;
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
    [() => selectedChannel.value, () => isMatchingRelease.value, () => selectedRelease.value],
    ([newChannel, newIsMatching, newRelease], [oldChannel, oldIsMatching, oldRelease]) => {
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

            if (newRelease && newRelease !== oldRelease && newChannel === "branch") {
                const branchLink = newRelease.pr
                    ? `<a href="${githubPullRequestUrl(newRelease.pr)}" target="_blank">${newRelease.version}</a>`
                    : newRelease.version;
                logToSerial(
                    "warning",
                    `[Branch] Selected experimental branch: ${branchLink}. Proceed at your own risk.`,
                );
            }

            if (newIsMatching && !oldIsMatching) {
                const deviceCommit = serialConnection?.connectionData.deviceInfo?.firmware_commit;
                const deviceVersion = serialConnection?.connectionData.deviceInfo?.firmware_version;
                if (deviceCommit || deviceVersion) {
                    let inner = "Selected firmware";
                    let logType = "Release";

                    if (uploadedFile.value || uploadedFileRelease.value) {
                        inner = "Uploaded file";
                        logType = "Upload";
                    } else if (selectedChannel.value === "branch" && selectedRelease.value) {
                        inner = "Selected firmware";
                        logType = "Branch";
                    }

                    const logVersion =
                        deviceVersion === "mntm-dev"
                            ? "mntm-dev"
                            : `<a href="${getLocalizedPath("/releases")}/${deviceVersion}" target="_blank">${deviceVersion}</a>`;
                    const logCommit =
                        deviceVersion === "mntm-dev" && logType !== "Branch"
                            ? `<a href="${getLocalizedPath("/releases")}/${deviceCommit}" target="_blank">${deviceCommit}</a>`
                            : `<a class="!no-underline">${deviceCommit}</a>`;
                    const displayVersion =
                        logType === "Branch" && selectedRelease.value
                            ? selectedRelease.value.pr
                                ? `<a href="${githubPullRequestUrl(selectedRelease.value.pr)}" target="_blank">${selectedRelease.value.version}</a>`
                                : selectedRelease.value.version
                            : logVersion;

                    logToSerial(
                        "warning",
                        `[${logType}] ${inner} matches current Flipper firmware (${displayVersion}, ${logCommit})`,
                    );
                }
            }
        }
    },
);

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
            `[Upload] File ${action}: \`${file.name}\` (could not parse version/commit)`,
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

    const uploadedForTest = uploadedFile.value ?? null;
    const uploadedForUpdate = uploadedFile.value ?? undefined;
    const trackingVersion =
        releaseArg?.version || uploadedFile.value?.name.replace(".tgz", "") || "null";
    if (uploadedFile.value) {
        clearUploadedFile(false);
    }

    const success = testMode.value
        ? await serialConnection.testUpdateFirmware(releaseArg, uploadedForTest, loopMode.value)
        : await serialConnection.updateFirmware(releaseArg, uploadedForUpdate);

    if (success) {
        track("firmware_flash", {
            version: trackingVersion,
            theme: `${currentTheme.value}_${screenColor.value}`,
        });
    }
};

const handleDownloadRelease = () => {
    if (!selectedRelease.value) return;

    const firmwareUrl = getFirmwareDownloadUrl(selectedRelease.value);

    if (firmwareUrl) {
        downloadFile(firmwareUrl);
        logToSerial(
            "info",
            `[Download] Downloading firmware tgz: <a href="${firmwareUrl}" target="_blank">${replaceIn(firmwareUrl, "https://up.momentum-fw.dev/builds/firmware", "")}</a>`,
        );
    } else {
        logToSerial("error", "[Download] No firmware download URL found for selected release");
    }
};

const handleFileSelected = (file: File) => {
    processFile(file, "selected");
};

const clearUploadedFile = (log: boolean = true) => {
    const fileName = uploadedFile.value?.name;
    uploadedFile.value = null;
    uploadedFileRelease.value = null;

    if (fileName && log) {
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

const clearLogs = () => {
    if (serialConnection && serialConnection.clearLogs) {
        serialConnection.clearLogs();
    }
    if (isChangelogClosed.value && hasChangelogContent.value) {
        changelogState.value = "open";
    }
};

const isChangelogExpanded = computed(() => changelogState.value === "expanded");
const isChangelogClosed = computed(() => changelogState.value === "closed");
const hasChangelogContent = computed(() => {
    return !!(selectedRelease.value || uploadedFileRelease.value);
});
const hasLogsContent = computed(() => {
    return !!(serialConnection?.logs && serialConnection.logs.value.length > 0);
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
    if (!supportsSerialPort()) {
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
        class="relative w-full flex flex-col items-center lg:py-14 lg:px-5 transition-colors duration-500"
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
        <UpdaterGlow :show="showUpdateOverlay" />

        <div class="max-w-6xl mx-auto flex-1 flex flex-col w-full min-h-0">
            <div class="flex flex-col h-full space-y-6 w-full min-h-0">
                <div
                    class="flex flex-col lg:flex-row flex-1 w-full min-h-0 h-full gap-4 px-0 sm:px-4 lg:px-0"
                >
                    <div
                        class="device-info-wrapper sm:rounded-lg border-t sm:border mt-4 lg:mt-0 border-vp-divider flex flex-col w-full lg:w-[32%] h-fit lg:h-full flex-shrink-0 overflow-hidden min-w-0 lg:min-w-80 sticky self-start transition-all duration-100 ease-in-out"
                        :class="{
                            'lg:h-full': !isConnected && supportsSerialPort(),
                            'lg:h-screen': !isConnected && isNarrowViewport && supportsSerialPort(),
                            '!border-vp-brand-1': isInstallButtonHovered,
                        }"
                        :style="windowWidth >= 1024 ? 'top: calc(var(--vp-nav-height));' : ''"
                        :data-connected="isConnected"
                        :data-hovered="isInstallButtonHovered"
                    >
                        <div class="flex-shrink-0 lg:h-full">
                            <UpdaterDeviceInfo />
                        </div>
                    </div>

                    <div
                        ref="dropZoneRef"
                        class="flex flex-col lg:w-2/3 min-w-0 relative flex-1 min-h-0 max-h-full transition-all duration-300 gap-y-4"
                        :class="{
                            'border-vp-3/60 bg-vp-dark/10 border-dashed': isOverDropZone,
                        }"
                    >
                        <div
                            v-if="isOverDropZone"
                            class="absolute inset-0 bg-vp-dark/10 rounded-xl flex items-center justify-center"
                        ></div>

                        <Transition name="slide-up" mode="out-in">
                            <div
                                v-if="
                                    !isChangelogExpanded &&
                                    !showUpdateOverlay &&
                                    (isMatchingRelease || (isBranchRelease && !uploadedFile))
                                "
                                class="bg-vp-dark/75 mt-4 lg:mt-0"
                                :class="{
                                    'opacity-30': isOverDropZone,
                                }"
                            >
                                <div class="updater-warning-container">
                                    <UpdaterWarning
                                        :is-over-drop-zone="isOverDropZone"
                                        :is-branch-release="isBranchRelease"
                                        :uploaded-file="uploadedFile"
                                        :selected-release="selectedRelease"
                                        :is-matching-release="isMatchingRelease"
                                    />
                                </div>
                            </div>
                        </Transition>

                        <Transition name="slide-up" mode="out-in">
                            <div
                                v-if="!isChangelogExpanded && !showUpdateOverlay"
                                class="relative flex flex-col z-10 sm:rounded-lg border-y sm:border border-vp-divider bg-vp-dark/75 py-5"
                                :class="{
                                    'border-vp-divider/45': isInstallButtonHovered,
                                }"
                            >
                                <div class="flex flex-col">
                                    <div
                                        class="flex flex-col flex-shrink-0 !z-10 transition-all duration-300 px-3.5 sm:px-5 gap-4"
                                        :class="{
                                            'opacity-30': isOverDropZone && !uploadedFile,
                                        }"
                                    >
                                        <h3
                                            v-if="supportsSerialPort()"
                                            class="text-[13px] leading-3 uppercase font-semibold text-vp-1 select-none"
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
                                            class="transition-opacity duration-300 !z-20"
                                            :class="{
                                                'opacity-30': isOverDropZone,
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

                                    <template v-if="supportsSerialPort()">
                                        <div
                                            class="h-px border-b border-solid border-vp-3/25 w-auto mt-5 mx-3.5 sm:mx-5"
                                            :class="{
                                                'opacity-30': isOverDropZone,
                                            }"
                                        ></div>

                                        <UpdaterFileUpload
                                            :is-over-drop-zone="isOverDropZone"
                                            :show-update-overlay="showUpdateOverlay"
                                            :uploaded-file="uploadedFile"
                                            :uploaded-file-release="uploadedFileRelease"
                                            :display-file-size="displayFileSize"
                                            :display-file-date="displayFileDate"
                                            :is-install-button-hovered="isInstallButtonHovered"
                                            :is-changelog-expanded="isChangelogExpanded"
                                            @file-selected="handleFileSelected"
                                            @clear-file="clearUploadedFile"
                                        />
                                    </template>
                                </div>
                            </div>
                        </Transition>

                        <Transition name="slide-up" mode="out-in">
                            <div
                                v-if="!isChangelogExpanded && showUpdateOverlay"
                                class="relative flex flex-col z-10 lg:rounded-lg border lg:border border-vp-divider bg-vp-dark/45 py-5 min-h-[150px]"
                            >
                                <UpdaterOverlay
                                    :show-update-overlay="showUpdateOverlay"
                                    :is-changelog-expanded="isChangelogExpanded"
                                />
                            </div>
                        </Transition>

                        <div
                            v-if="windowWidth >= 1024 || selectedRelease || uploadedFileRelease"
                            ref="panelContainerRef"
                            class="flex flex-col transition-opacity duration-250 overflow-hidden z-[1]"
                            :class="{
                                'min-h-0 flex-1': !isNarrowViewport,
                                'max-h-[1325px] h-full': isNarrowViewport,
                                'opacity-50': isInstallButtonHovered,
                                'opacity-30': isOverDropZone,
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
                                v-if="supportsSerialPort() && hasChangelogContent"
                                ref="dividerRef"
                                class="flex flex-row min-h-4 items-center justify-center relative px-5 cursor-row-resize select-none transition-all duration-200"
                                :class="{
                                    'opacity-55 dark:opacity-65':
                                        effectiveChangelogOpen && effectiveLogsOpen,
                                    'opacity-0 pointer-events-none mt-0.5': !(
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
                                    @clearlogs="clearLogs"
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
    transform: rotate(-45deg);
    opacity: 0.04;
    filter: saturate(0);
    z-index: 0;
    transition: opacity 0.2s ease-in-out;
}

@media (min-width: 1024px) {
    .device-info-wrapper:before {
        background-image: url("/bg/flipper.png");
        background-size: contain;
        background-position: center;
        background-repeat: no-repeat;
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
</style>
