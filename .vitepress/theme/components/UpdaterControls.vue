<script setup lang="ts">
import { computed, inject, nextTick, ref, watch } from "vue";
import {
    branchReleases,
    devbuildReleases,
    type ReleaseChannel,
    type ReleaseItem,
} from "../../../_data/releases";
import {
    useClickOutside,
    useConnectionInfo,
    useDots,
    useI18n,
    usePressedState,
    useSerialConnection,
    useSharedHover,
    useTempState,
    useThemeSwitcher,
} from "../composables";
import { formatDate, formatTimestamp } from "../date";
import { supportsSerialPort } from "../util";
import Tooltip from "./Tooltip.vue";

const { tr } = useI18n();
const { dots } = useDots();
const { ifCurrentTheme } = useThemeSwitcher();
const installPressedState = usePressedState();

interface Props {
    selectedChannel: ReleaseChannel | null;
    selectedRelease: ReleaseItem | null;
    channelReleases: ReleaseItem[];
    uploadedFile?: File | null;
    isMatchingRelease?: boolean;
    testMode?: boolean;
}

const props = defineProps<Props>();
const { isConnected: connectionIsConnected, connectionState, deviceInfo } = useConnectionInfo();

const serialConnection = inject<ReturnType<typeof useSerialConnection> | null>("serialConnection");

const {
    hostExpand,
    hostCollapse,
    isHovered: isInstallButtonHovered,
} = useSharedHover("disabled-install-button");

const downloadState = useTempState({
    beforeIcon: "oi-download",
    afterIcon: "oi-check",
    beforeText: () => tr("updater_download_release"),
    afterText: () => tr("updater_downloaded"),
});

const emit = defineEmits<{
    "channel-change": [channel: ReleaseChannel];
    "release-change": [release: ReleaseItem];
    "flash-firmware": [];
    "download-release": [];
}>();

const isBranchRelease = computed(() => props.selectedChannel === "branch");
const isConnected = computed(() => connectionIsConnected.value);
const canFlash = computed(() => {
    if (!supportsSerialPort()) return false;
    const hasReleaseOrFile = props.selectedRelease || props.uploadedFile;
    const notUpdating = !serialConnection?.flags.updateInProgress;

    return isConnected.value && hasReleaseOrFile && notUpdating;
});

const channelDropdownRef = ref<HTMLElement | null>(null);
const releaseDropdownRef = ref<HTMLElement | null>(null);
const isChannelDropdownOpen = ref(false);
const isReleaseDropdownOpen = ref(false);
const hoveredReleaseIndex = ref<number | null>(null);
const versionTextRefs = ref<(HTMLElement | null)[]>([]);
const releaseTextRef = ref<HTMLElement | null>(null);
const isReleaseButtonHovered = ref(false);
const releaseTextNeedsScroll = ref(false);

useClickOutside([
    {
        element: channelDropdownRef,
        callback: () => {
            isChannelDropdownOpen.value = false;
        },
    },
    {
        element: releaseDropdownRef,
        callback: () => {
            isReleaseDropdownOpen.value = false;
        },
    },
]);

const channelOptions = computed(() => [
    {
        value: "mainline",
        label: tr("updater_mainline_label"),
        description: tr("updater_mainline_description"),
    },
    ...(devbuildReleases.length > 0
        ? [
              {
                  value: "devbuild",
                  label: tr("updater_development_label"),
                  description: tr("updater_development_description"),
              },
          ]
        : []),
    ...(branchReleases.length > 0
        ? [
              {
                  value: "branch",
                  label: tr("updater_branch_label"),
                  description: tr("updater_branch_description"),
              },
          ]
        : []),
]);

const channelLabel = computed(() => {
    if (!props.selectedChannel) return tr("updater_select_channel");
    const option = channelOptions.value.find((opt) => opt.value === props.selectedChannel);
    return option ? option.label : tr("updater_select_channel");
});

const releaseLabel = computed(() => {
    if (!props.selectedRelease) return tr("updater_select_version");
    const release = props.selectedRelease;
    return `${release.version} (${
        isBranchRelease.value
            ? release.branch
            : release.timestamp
              ? formatDate(release.timestamp, "short")
              : tr("updater_unknown_date")
    })`;
});

const timestampLabel = (timestamp: number | string) => {
    return timestamp ? formatTimestamp(timestamp.toString()) : tr("updater_unknown_date");
};

const toggleChannelDropdown = () => {
    if (props.uploadedFile) return;
    if (isChannelDropdownOpen.value) {
        isChannelDropdownOpen.value = false;
    } else {
        isReleaseDropdownOpen.value = false;
        isChannelDropdownOpen.value = true;
    }
};

const toggleReleaseDropdown = () => {
    if (props.uploadedFile || !props.selectedChannel) return;
    if (isReleaseDropdownOpen.value) {
        isReleaseDropdownOpen.value = false;
    } else {
        isChannelDropdownOpen.value = false;
        isReleaseDropdownOpen.value = true;
    }
};

const selectChannel = (channel: ReleaseChannel) => {
    emit("channel-change", channel);
    isChannelDropdownOpen.value = false;
};

const selectRelease = (release: ReleaseItem) => {
    emit("release-change", release);
    isReleaseDropdownOpen.value = false;
};

const handleFlashFirmware = () => {
    emit("flash-firmware");
};

const handleDownloadRelease = () => {
    downloadState.trigger();
    emit("download-release");
};

const installTooltipContent = computed(() => {
    if (connectionState.value === "error") return tr("connection_serial_busy");
    if (isConnected.value && !canFlash.value) return tr("updater_flash_select_release_or_file");
    return tr("updater_flash_button_disconnected");
});

const shouldScrollVersion = (index: number) => {
    const textElement = versionTextRefs.value[index];
    if (!textElement) return false;
    return textElement.scrollWidth > textElement.clientWidth;
};

const shouldScrollReleaseText = () => {
    return releaseTextNeedsScroll.value;
};

const checkReleaseTextScroll = () => {
    if (!releaseTextRef.value) {
        releaseTextNeedsScroll.value = false;
        return;
    }
    releaseTextNeedsScroll.value =
        releaseTextRef.value.scrollWidth > releaseTextRef.value.clientWidth;
};

watch([releaseLabel, () => props.selectedRelease], () => {
    nextTick(() => {
        checkReleaseTextScroll();
    });
});

watch(releaseTextRef, () => {
    if (releaseTextRef.value) {
        nextTick(() => {
            checkReleaseTextScroll();
        });
    }
});

const isBranchSelected = (channel: ReleaseChannel | null, version: string) => {
    if (!channel) return false;
    return channel === "branch" && props.selectedRelease?.version === version;
};
</script>

<template>
    <div class="rounded-xl">
        <div class="flex flex-col md:flex-row gap-2 md:gap-3 items-end">
            <div class="flex flex-row gap-3 items-end w-full min-w-0 flex-1">
                <div class="relative flex-shrink-0 max-w-[200px]">
                    <label
                        class="block text-sm font-normal text-vp-2 mb-3 select-none"
                        :class="{ 'opacity-50': uploadedFile || isInstallButtonHovered }"
                    >
                        {{ tr("updater_channel_label") }}
                    </label>
                    <button
                        ref="channelDropdownRef"
                        class="dropdown-button min-w-[160px] max-w-[200px] w-auto"
                        :class="{
                            'is-active': isChannelDropdownOpen,
                            'opacity-50 cursor-not-allowed': uploadedFile || isInstallButtonHovered,
                        }"
                        @click="toggleChannelDropdown"
                    >
                        <span
                            class="block z-[5] min-w-0 overflow-hidden text-ellipsis whitespace-nowrap select-none pointer-events-none"
                        >
                            {{ channelLabel }}
                        </span>
                        <div
                            class="select-icon flex items-center text-vp-3 transition-transform duration-200"
                        >
                            <v-icon name="oi-chevron-down" />
                        </div>
                    </button>
                    <Transition name="fade-dropdown">
                        <div v-if="isChannelDropdownOpen" class="dropdown-menu-container left-0">
                            <div
                                class="dropdown-menu relative pr-[7px]"
                                :class="{ 'is-visible': isChannelDropdownOpen }"
                            >
                                <div
                                    class="flex flex-col overflow-hidden max-h-60 overflow-y-auto my-[7px] rounded-[4px] bg-vp-soft-mute"
                                >
                                    <span
                                        v-for="channel in channelOptions"
                                        :key="channel.value"
                                        class="dropdown-item items-center justify-start pl-3 pr-2.5 h-[53.33px] cursor-pointer flex w-full z-[5] text-[13px] overflow-hidden min-w-0"
                                        :class="{
                                            'is-selected': selectedChannel === channel.value,
                                            'is-branch': channel.value === 'branch',
                                        }"
                                        @click="selectChannel(channel.value as ReleaseChannel)"
                                    >
                                        <div
                                            class="flex flex-row items-center justify-center gap-3 min-w-0 flex-1"
                                        >
                                            <div class="flex flex-col min-w-0 flex-1">
                                                <div class="flex flex-row gap-x-1.5 items-start">
                                                    <span
                                                        class="font-medium text-sm whitespace-nowrap overflow-hidden text-ellipsis select-none"
                                                    >
                                                        {{ channel.label }}
                                                    </span>
                                                    <div
                                                        v-if="channel.value === 'branch'"
                                                        class="flex-shrink-0"
                                                    >
                                                        <v-icon
                                                            name="md-warningamber-round"
                                                            :scale="0.75"
                                                            class="text-yellow-600 dark:text-orange-400/90"
                                                        />
                                                    </div>
                                                </div>
                                                <span
                                                    class="text-xs text-vp-3 whitespace-nowrap overflow-hidden text-ellipsis select-none"
                                                    :class="{
                                                        'text-vp-brand-1/60':
                                                            selectedChannel === channel.value,
                                                        'text-yellow-700/80 dark:text-orange-500/50':
                                                            selectedChannel === channel.value &&
                                                            channel.value === 'branch',
                                                    }"
                                                >
                                                    {{ channel.description }}
                                                </span>
                                            </div>
                                        </div>
                                    </span>
                                </div>
                            </div>
                        </div>
                    </Transition>
                </div>

                <div class="relative flex-1 min-w-0">
                    <label
                        class="block text-sm font-normal text-vp-2 mb-3 select-none"
                        :class="{ 'opacity-50': uploadedFile || isInstallButtonHovered }"
                    >
                        {{
                            tr(
                                selectedChannel === "branch"
                                    ? "updater_branch_dropdown_label"
                                    : "updater_version_dropdown_label",
                            )
                        }}
                    </label>
                    <button
                        ref="releaseDropdownRef"
                        class="dropdown-button w-full min-w-0"
                        :class="{
                            'is-active': isReleaseDropdownOpen,
                            'opacity-50 cursor-not-allowed':
                                uploadedFile ||
                                (!selectedChannel && !uploadedFile) ||
                                isInstallButtonHovered,
                        }"
                        @click="toggleReleaseDropdown"
                        @mouseenter="isReleaseButtonHovered = true"
                        @mouseleave="isReleaseButtonHovered = false"
                    >
                        <div
                            v-if="
                                shouldScrollReleaseText() &&
                                !uploadedFile &&
                                (isReleaseButtonHovered || isReleaseDropdownOpen)
                            "
                            class="marquee relative w-full overflow-hidden min-w-0 flex-1 pointer-events-none"
                        >
                            <span
                                class="inline-block whitespace-nowrap pr-0 marquee-content z-[5] select-none"
                            >
                                {{ releaseLabel }}
                            </span>
                        </div>
                        <span
                            v-else
                            ref="releaseTextRef"
                            class="whitespace-nowrap overflow-hidden text-ellipsis text-left z-[5] flex-1 min-w-0 pointer-events-none select-none"
                        >
                            {{ releaseLabel }}
                        </span>
                        <div
                            class="select-icon flex items-center text-vp-3 transition-transform duration-200"
                        >
                            <v-icon name="oi-chevron-down" />
                        </div>
                    </button>
                    <Transition name="fade-dropdown">
                        <div v-if="isReleaseDropdownOpen" class="dropdown-menu-container right-0">
                            <div
                                class="dropdown-menu"
                                :class="{
                                    'is-visible': isReleaseDropdownOpen,
                                    'md:pr-[7px]': selectedChannel === 'branch',
                                }"
                            >
                                <div
                                    ref="el"
                                    class="flex flex-col overflow-hidden max-h-[174px] py-[7px] pr-[7px] md:pr-0 overflow-y-auto rounded-[4px] bg-vp-soft-mute"
                                >
                                    <div
                                        v-for="(release, index) in channelReleases"
                                        :key="release.version"
                                        class="dropdown-item flex flex-row min-h-8 max-h-8 items-center justify-between px-3 py-2 cursor-pointer w-full z-[5] text-[13px] overflow-hidden min-w-0"
                                        :class="{
                                            'is-selected':
                                                selectedRelease?.version === release.version,
                                            'rounded-t-[4px]': index === 0,
                                            'rounded-b-[4px]': index === channelReleases.length - 1,
                                            'bg-yellow-600/5 dark:bg-orange-600/5 hover:!bg-yellow-500/10 dark:hover:!bg-orange-500/10 is-branch':
                                                isBranchSelected(selectedChannel, release.version),
                                        }"
                                        @click="selectRelease(release)"
                                        @mouseenter="hoveredReleaseIndex = index"
                                        @mouseleave="hoveredReleaseIndex = null"
                                    >
                                        <div
                                            class="flex flex-row items-center gap-2 min-w-0 flex-1"
                                        >
                                            <div class="flex-1 overflow-hidden relative min-w-0">
                                                <div
                                                    v-if="
                                                        shouldScrollVersion(index) &&
                                                        hoveredReleaseIndex === index
                                                    "
                                                    class="marquee relative w-full overflow-hidden"
                                                >
                                                    <span
                                                        class="inline-block whitespace-nowrap pr-0 marquee-content font-medium text-vp-1 select-none"
                                                        :class="{
                                                            'text-vp-brand-1':
                                                                selectedRelease?.version ===
                                                                release.version,
                                                            'text-yellow-700 dark:text-orange-500':
                                                                isBranchSelected(
                                                                    selectedChannel,
                                                                    release.version,
                                                                ),
                                                        }"
                                                    >
                                                        {{ release.version }}
                                                    </span>
                                                </div>
                                                <span
                                                    v-else
                                                    :ref="
                                                        (el) => {
                                                            if (el)
                                                                versionTextRefs[index] =
                                                                    el as HTMLElement;
                                                        }
                                                    "
                                                    class="font-medium text-vp-1 select-none overflow-hidden text-ellipsis whitespace-nowrap block"
                                                    :class="{
                                                        'text-vp-brand-1':
                                                            selectedRelease?.version ===
                                                            release.version,
                                                        'text-yellow-700 dark:text-orange-500':
                                                            isBranchSelected(
                                                                selectedChannel,
                                                                release.version,
                                                            ),
                                                    }"
                                                >
                                                    {{ release.version }}
                                                </span>
                                            </div>
                                            <Tooltip
                                                v-if="
                                                    isConnected &&
                                                    (release.commit
                                                        ? deviceInfo?.firmware_version ===
                                                              'mntm-dev' &&
                                                          deviceInfo?.firmware_commit ===
                                                              release.version
                                                        : deviceInfo?.firmware_version ===
                                                          release.version)
                                                "
                                                :delay="0"
                                                :position="'top'"
                                                :z-index="9999"
                                            >
                                                <div
                                                    class="flex items-center text-sm rounded-full bg-vp-alternate-1/5 dark:bg-vp-alternate-1/10 p-0.5 border border-vp-alternate-1/10 hover:border-vp-alternate-1/20 transition-all duration-100 cursor-help"
                                                    :class="[
                                                        ifCurrentTheme(['white'])
                                                            ? 'text-vp-brand-1 dark:text-vp-brand-1/60'
                                                            : 'text-vp-alternate-1 dark:text-vp-alternate-1',
                                                    ]"
                                                    :aria-label="tr('releases_current_version')"
                                                >
                                                    <v-icon name="oi-check" scale="0.60" />
                                                </div>
                                                <template #content>{{ tr("installed") }}</template>
                                            </Tooltip>
                                        </div>
                                        <span
                                            class="text-xs text-vp-3 ml-3 font-mono select-none overflow-hidden text-ellipsis whitespace-nowrap max-w-[80px]"
                                            :class="{
                                                'tracking-tighter': selectedChannel !== 'branch',
                                                'text-vp-brand-1/60':
                                                    selectedRelease?.version === release.version,
                                                'text-yellow-700/80 dark:text-orange-500/60':
                                                    isBranchSelected(
                                                        selectedChannel,
                                                        release.version,
                                                    ),
                                            }"
                                            :aria-label="timestampLabel(release.timestamp || '')"
                                            :title="timestampLabel(release.timestamp || '')"
                                        >
                                            {{
                                                isBranchRelease
                                                    ? release.branch
                                                    : release.timestamp
                                                      ? formatDate(release.timestamp, "fullYear")
                                                      : tr("updater_unknown_date")
                                            }}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Transition>
                </div>
            </div>

            <div class="flex flex-row gap-3 items-end w-full md:w-auto flex-shrink-0">
                <div
                    class="hidden xl:block h-6 mb-2 mx-1 w-px bg-vp-divider transition-opacity duration-200"
                    :class="{ 'opacity-60': isInstallButtonHovered }"
                />
                <div class="flex items-end">
                    <Tooltip
                        :delay="uploadedFile ? 400 : 0"
                        :offset="18"
                        :disabled="
                            !!uploadedFile || !selectedRelease || connectionState === 'connecting'
                        "
                        class="min-w-0 overflow-hidden"
                        :class="{
                            'opacity-60 transition-opacity duration-200':
                                uploadedFile || isInstallButtonHovered,
                        }"
                    >
                        <div class="action w-10 z-[5]">
                            <button
                                :disabled="!!uploadedFile || !selectedRelease"
                                :aria-label="downloadState.currentText.value"
                                class="download-button-small inline-flex text-center font-semibold whitespace-nowrap transition-all duration-100 rounded-full py-0 px-0 leading-[38px] text-sm w-full items-center justify-center h-10 box-border select-none pointer-events-auto !z-[999]"
                                :class="
                                    !uploadedFile && selectedRelease
                                        ? 'text-vp-2/80 hover:text-vp-brand-1 cursor-pointer hover:bg-vp-soft border-vp-divider/70'
                                        : 'text-vp-3 cursor-not-allowed opacity-50'
                                "
                                download
                                @mousedown="downloadState.handleMouseDown"
                                @mouseup="downloadState.handleMouseUp"
                                @mouseleave="downloadState.handleMouseLeave"
                                @click="handleDownloadRelease"
                            >
                                <v-icon
                                    :class="{
                                        'scale-90': downloadState.isPressed.value,
                                    }"
                                    :name="downloadState.currentIcon.value"
                                    :scale="
                                        downloadState.currentIcon.value === 'oi-check' ? 0.95 : 1.1
                                    "
                                    class="!stroke-vp-dark !stroke-[0.25]"
                                />
                            </button>
                        </div>
                        <template #content>
                            {{
                                !uploadedFile && selectedRelease
                                    ? tr("updater_download_release")
                                    : tr("updater_flash_select_release")
                            }}
                        </template>
                    </Tooltip>
                </div>

                <div
                    class="rounded-full transition-all duration-200 border border-vp-divider box-border mt-3 select-none min-w-32 w-full md:w-auto group"
                    :class="[
                        canFlash &&
                            ((!isMatchingRelease && !isBranchRelease) || uploadedFile) &&
                            '!border-vp-brand-1 hover:!border-vp-brand-2 hover:bg-vp-brand-3 shadow-grow',
                        canFlash &&
                            (isMatchingRelease || isBranchRelease) &&
                            !uploadedFile &&
                            'bg-yellow-300/5 dark:bg-orange-900/5 border-yellow-400 dark:border-orange-500 hover:!border-yellow-300 hover:!bg-yellow-400 dark:hover:!border-orange-400/70 dark:hover:!bg-orange-500 shadow-grow-yellow dark:shadow-grow-orange',
                        isInstallButtonHovered && 'opacity-90 transition-all duration-200',
                        canFlash && 'cursor-pointer',
                        installPressedState.isPressed.value && 'scale-[0.98]',
                    ]"
                    @mousedown="installPressedState.handleMouseDown"
                    @mouseup="installPressedState.handleMouseUp"
                    @mouseleave="installPressedState.handleMouseLeave"
                    @touchstart="installPressedState.handleTouchStart"
                    @touchend="installPressedState.handleTouchEnd"
                >
                    <Tooltip
                        :disabled="
                            !supportsSerialPort() || !!canFlash || connectionState === 'connecting'
                        "
                        :delay="0"
                        :offset="18"
                        class="min-w-0 overflow-hidden"
                    >
                        <button
                            :disabled="!canFlash"
                            class="w-full py-3 rounded-full select-none font-medium flex items-center justify-center gap-2 h-[40px] transition-all duration-150 tracking-tighter uppercase whitespace-nowrap"
                            :class="[
                                canFlash
                                    ? `${ifCurrentTheme(['orange']) ? 'group-hover:text-black' : ifCurrentTheme(['white', 'skyline']) ? 'group-hover:text-vp-neutral-inverse dark:group-hover:text-vp-neutral-inverse' : 'group-hover:text-white'} px-14`
                                    : 'text-vp-3 cursor-not-allowed opacity-50 px-12',
                                canFlash &&
                                    (isMatchingRelease || isBranchRelease) &&
                                    !uploadedFile &&
                                    'group-hover:!text-black',
                            ]"
                            @click="handleFlashFirmware"
                            @mouseenter="
                                !connectionIsConnected &&
                                connectionState !== 'connecting' &&
                                hostExpand()
                            "
                            @mouseleave="!canFlash && hostCollapse()"
                        >
                            {{
                                connectionState === "connecting"
                                    ? dots
                                    : canFlash
                                      ? tr("updater_flash_button")
                                      : tr("updater_unavailable")
                            }}
                        </button>
                        <template #content>
                            {{ installTooltipContent }}
                        </template>
                    </Tooltip>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.action {
    padding: 0;
}

.action a {
    width: 100%;
    padding: 0;
}

.download-action {
    flex: 1;
    z-index: 5;
}

.action button {
    font-size: 0.85em;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    height: 40px;
    width: 40px;
}

.dropdown-button {
    display: flex;
    align-items: center;
    border: 1px solid var(--vp-c-divider);
    justify-content: space-between;
    width: 100%;
    max-width: 100%;
    background-color: color-mix(in srgb, var(--vp-c-bg-elv) 95%, transparent);
    backface-visibility: hidden;
    border-radius: 8px;
    padding: 8px 10px;
    font-size: 14px;
    color: var(--vp-c-text-1);
    cursor: pointer;
    transition: all 0.1s;
    line-height: 1.6;
    min-height: 38px;
    gap: 10px;
    overflow: hidden;
}

.dark .dropdown-button {
    background-color: color-mix(in srgb, var(--vp-c-bg-elv) 95%, transparent);
}

.dropdown-button:hover:not(.cursor-not-allowed) {
    border-color: var(--vp-c-brand-1);
}

.dropdown-button.cursor-not-allowed {
    cursor: not-allowed !important;
}

.dropdown-button.cursor-not-allowed:hover {
    border-color: var(--vp-c-divider);
}

.dropdown-button.is-active {
    border-color: var(--vp-c-brand-1);
}

.dropdown-menu-container {
    position: absolute;
    top: calc(100% + 5px);
    z-index: 10;
    width: 100%;
    border: 1px solid var(--vp-c-divider);
    border-radius: 8px;
    padding: 0 0 0 7px;
    background-color: var(--vp-c-bg-dark);
    box-shadow: var(--vp-shadow-3);
    backdrop-filter: blur(12px);
}

.dropdown-menu-container.left-0 {
    left: 0;
    right: auto;
}

.dropdown-menu-container.right-0 {
    right: 0;
    left: auto;
}

.dropdown-menu {
    background-color: transparent;
    transform: translateY(-8px);
    transition: transform 0.1s ease;
    overflow: hidden;
    max-height: 250px;
    display: flex;
    flex-direction: column;
}

.dropdown-menu.is-visible {
    transform: translateY(0);
}

.dropdown-item:hover {
    background-color: color-mix(in srgb, var(--vp-c-text-1) 5%, transparent);
}

.dropdown-item.is-branch:hover {
    @apply bg-orange-600/5;
}

.dark .dropdown-item.is-branch:hover {
    @apply bg-orange-500/10;
}

.dark .dropdown-item:hover {
    background-color: color-mix(in srgb, var(--vp-c-text-1) 4%, transparent);
}

.dropdown-item.is-selected {
    background-color: color-mix(in srgb, var(--vp-c-brand-1) 7%, transparent);
    color: var(--vp-c-brand-1);
}

.dropdown-item.is-selected:hover {
    background-color: color-mix(in srgb, var(--vp-c-brand-1) 15%, transparent);
}

.dropdown-item.is-branch.is-selected {
    @apply bg-yellow-600/5 dark:bg-orange-600/5 text-yellow-700 dark:text-orange-500 hover:bg-yellow-500/10 dark:hover:bg-orange-500/10;
}

.fade-dropdown-enter-active,
.fade-dropdown-leave-active {
    transition: opacity 0.2s ease;
}

.fade-dropdown-enter-from,
.fade-dropdown-leave-to {
    opacity: 0;
}

.marquee-content {
    animation: marquee 2.5s linear infinite alternate;
}

@keyframes marquee {
    0%,
    10% {
        transform: translateX(0);
    }

    90%,
    100% {
        transform: translateX(-15%);
    }
}

.download-button-small {
    border: 1px solid var(--vp-c-divider);
}
</style>
