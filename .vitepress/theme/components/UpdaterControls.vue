<script setup lang="ts">
import { computed, inject, onBeforeUnmount, onMounted, ref } from "vue";
import type { ReleaseItem } from "../../../_data/releases";
import { useConnectionInfo } from "../composables/useConnectionInfo";
import { useDots } from "../composables/useDots";
import { useI18n } from "../composables/useI18n";
import type { useSerialConnection } from "../composables/useSerialConnection";
import { useSharedHover } from "../composables/useSharedHover";
import { supportsSerialPort } from "../util";

import Tooltip from "./Tooltip.vue";

const { tr } = useI18n();
const { dots } = useDots();

interface Props {
    selectedChannel: "mainline" | "devbuild" | null;
    selectedRelease: ReleaseItem | null;
    channelReleases: ReleaseItem[];
    uploadedFile?: File | null;
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

const emit = defineEmits<{
    "channel-change": [channel: "mainline" | "devbuild"];
    "release-change": [release: ReleaseItem];
    "flash-firmware": [];
    "download-release": [];
}>();

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

const channelOptions = computed(() => [
    {
        value: "mainline",
        label: tr("updater_mainline_label"),
        description: tr("updater_mainline_description"),
    },
    {
        value: "devbuild",
        label: tr("updater_development_label"),
        description: tr("updater_development_description"),
    },
]);

const getChannelLabel = () => {
    if (!props.selectedChannel) return tr("updater_select_channel");
    const option = channelOptions.value.find((opt) => opt.value === props.selectedChannel);
    return option ? option.label : tr("updater_select_channel");
};

const getReleaseLabel = () => {
    if (!props.selectedRelease) return tr("updater_select_version");

    const version = props.selectedRelease.version;
    const commit = props.selectedRelease.commit;

    if (!commit) return tr("updater_select_version");

    const shortCommit = commit.substring(0, 7);

    if (version && version.startsWith("mntm-")) {
        return version;
    }

    return `${shortCommit} (${props.selectedRelease.timestamp ? new Date(props.selectedRelease.timestamp * 1000).toLocaleDateString() : tr("updater_unknown_date")})`;
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

const selectChannel = (channel: "mainline" | "devbuild") => {
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
    emit("download-release");
};

const clickOutside = (event: MouseEvent) => {
    const target = event.target as Node;
    if (channelDropdownRef.value && !channelDropdownRef.value.contains(target)) {
        isChannelDropdownOpen.value = false;
    }
    if (releaseDropdownRef.value && !releaseDropdownRef.value.contains(target)) {
        isReleaseDropdownOpen.value = false;
    }
};

onMounted(() => {
    document.addEventListener("click", clickOutside);
});

onBeforeUnmount(() => {
    document.removeEventListener("click", clickOutside);
});
</script>

<template>
    <div class="rounded-xl">
        <div class="flex flex-col xl:flex-row gap-3 items-end">
            <div class="flex flex-row gap-3 items-end w-full">
                <div ref="channelDropdownRef" class="relative flex-shrink-0">
                    <label class="block text-sm font-medium text-vp-2 mb-3">
                        {{ tr("updater_channel_label") }}
                    </label>
                    <button
                        class="dropdown-button min-w-[160px] w-auto"
                        :class="{
                            'is-active': isChannelDropdownOpen,
                            'opacity-50 cursor-not-allowed': uploadedFile || isInstallButtonHovered,
                        }"
                        @click="toggleChannelDropdown"
                    >
                        <span class="whitespace-nowrap overflow-hidden text-ellipsis block z-[5]">
                            {{ getChannelLabel() }}
                        </span>
                        <div
                            class="select-icon flex items-center text-vp-3 transition-transform duration-200"
                        >
                            <v-icon name="oi-chevron-down" />
                        </div>
                    </button>
                    <Transition name="fade-dropdown">
                        <div
                            v-if="isChannelDropdownOpen"
                            class="dropdown-menu-container left-0"
                            style="min-width: 100%; left: 0; right: auto"
                        >
                            <div
                                class="dropdown-menu"
                                :class="{ 'is-visible': isChannelDropdownOpen }"
                            >
                                <div
                                    class="flex flex-col overflow-hidden max-h-60 overflow-y-auto rounded-[4px] bg-vp-soft-mute"
                                >
                                    <span
                                        v-for="channel in channelOptions"
                                        :key="channel.value"
                                        class="dropdown-item items-center justify-start px-3 py-2 cursor-pointer flex transition-colors duration-100 w-full z-[5] text-[13px] overflow-hidden min-w-0"
                                        :class="{
                                            'is-selected': selectedChannel === channel.value,
                                        }"
                                        @click="
                                            selectChannel(channel.value as 'mainline' | 'devbuild')
                                        "
                                    >
                                        <div
                                            class="flex flex-row items-center gap-3 min-w-0 flex-1"
                                        >
                                            <div class="flex flex-col min-w-0 flex-1">
                                                <span
                                                    class="font-medium text-sm whitespace-nowrap overflow-hidden text-ellipsis"
                                                >
                                                    {{ channel.label }}
                                                </span>
                                                <span
                                                    class="text-xs text-vp-3 whitespace-nowrap overflow-hidden text-ellipsis"
                                                    :class="{
                                                        'text-vp-brand-1/60':
                                                            selectedChannel === channel.value,
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

                <div ref="releaseDropdownRef" class="relative flex-1 min-w-0">
                    <label class="block text-sm font-medium text-vp-2 mb-3">
                        {{ tr("updater_version_dropdown_label") }}
                    </label>
                    <button
                        class="dropdown-button w-full"
                        :class="{
                            'is-active': isReleaseDropdownOpen,
                            'opacity-50 cursor-not-allowed':
                                uploadedFile ||
                                (!selectedChannel && !uploadedFile) ||
                                isInstallButtonHovered,
                        }"
                        @click="toggleReleaseDropdown"
                    >
                        <span class="whitespace-nowrap overflow-hidden text-ellipsis block z-[5]">
                            {{ getReleaseLabel() }}
                        </span>
                        <div
                            class="select-icon flex items-center text-vp-3 transition-transform duration-200"
                        >
                            <v-icon name="oi-chevron-down" />
                        </div>
                    </button>
                    <Transition name="fade-dropdown">
                        <div
                            v-if="isReleaseDropdownOpen"
                            class="dropdown-menu-container right-0"
                            style="min-width: 100%; right: 0; left: auto"
                        >
                            <div
                                class="dropdown-menu"
                                :class="{ 'is-visible': isReleaseDropdownOpen }"
                            >
                                <div
                                    class="flex flex-col overflow-hidden max-h-[224px] pr-[7px] overflow-y-auto rounded-[4px] bg-vp-soft-mute"
                                >
                                    <div
                                        v-for="(release, index) in channelReleases"
                                        :key="release.commit"
                                        class="dropdown-item flex flex-row min-h-7 items-center justify-between px-3 py-2 cursor-pointer transition-colors duration-100 w-full z-[5] text-[13px] overflow-hidden min-w-0"
                                        :class="{
                                            'is-selected':
                                                selectedRelease?.commit === release.commit,
                                            'rounded-t-[4px]': index === 0,
                                            'rounded-b-[4px]': index === channelReleases.length - 1,
                                        }"
                                        @click="selectRelease(release)"
                                    >
                                        <div class="flex flex-row items-center gap-3 min-w-0">
                                            <span
                                                class="font-medium text-vp-1 font-mono flex-shrink-0"
                                                :class="{
                                                    'text-vp-brand-1':
                                                        selectedRelease?.commit === release.commit,
                                                }"
                                            >
                                                {{
                                                    release.version &&
                                                    release.version.startsWith("mntm-")
                                                        ? release.version
                                                        : release.commit.substring(0, 7)
                                                }}
                                            </span>
                                            <span
                                                v-if="
                                                    isConnected &&
                                                    (deviceInfo?.firmware_commit ===
                                                        release.commit ||
                                                        deviceInfo?.firmware_version ===
                                                            release.version)
                                                "
                                                class="font-medium text-xs whitespace-nowrap overflow-hidden text-ellipsis uppercase text-vp-brand-1"
                                                :class="{
                                                    'text-vp-brand-1/60':
                                                        deviceInfo?.firmware_commit ===
                                                            release.commit ||
                                                        deviceInfo?.firmware_version ===
                                                            release.version,
                                                }"
                                            >
                                                {{ tr("installed") }}
                                            </span>
                                        </div>
                                        <span
                                            class="text-xs text-vp-3 ml-3 flex-shrink-0 font-mono"
                                            :class="{
                                                'text-vp-brand-1/60':
                                                    selectedRelease?.commit === release.commit,
                                            }"
                                        >
                                            {{
                                                release.timestamp
                                                    ? new Date(
                                                          release.timestamp * 1000,
                                                      ).toLocaleDateString()
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

            <div class="flex flex-row gap-3 items-end w-full md:w-auto">
                <div
                    class="hidden xl:block h-6 mb-2 mx-2 w-px bg-vp-divider transition-opacity duration-200"
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
                                :aria-label="tr('download')"
                                class="download-button-small inline-flex text-center font-semibold whitespace-nowrap transition-all duration-100 rounded-full py-0 px-0 leading-[38px] text-sm w-full items-center justify-center h-10 box-border select-none pointer-events-auto !z-[999]"
                                :class="
                                    !uploadedFile && selectedRelease
                                        ? 'text-vp-2 hover:text-vp-brand-1 cursor-pointer hover:bg-vp-soft border-vp-divider/70'
                                        : 'text-vp-3 cursor-not-allowed opacity-50'
                                "
                                @click="handleDownloadRelease"
                            >
                                <v-icon name="la-download-solid" :scale="1.1" />
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
                    class="rounded-full transition-all duration-100 border box-border mt-3 select-none min-w-36 flex-1 w-full"
                    :class="
                        canFlash
                            ? 'border-vp-brand-1 hover:border-vp-brand-2'
                            : isInstallButtonHovered
                              ? 'border-vp-divider opacity-90 transition-opacity duration-200'
                              : 'border-vp-divider opacity-70'
                    "
                >
                    <Tooltip
                        :disabled="!!canFlash || connectionState === 'connecting'"
                        :delay="0"
                        :offset="18"
                        class="min-w-0 overflow-hidden"
                    >
                        <button
                            :disabled="!canFlash"
                            class="w-full py-3 rounded-full font-medium flex items-center justify-center gap-2 h-[40px] transition-all duration-200 tracking-tighter uppercase whitespace-nowrap"
                            :class="
                                canFlash
                                    ? 'hover:bg-vp-brand-3 cursor-pointer hover:text-neutral-50 px-14'
                                    : 'text-vp-3 cursor-not-allowed opacity-50 px-12'
                            "
                            @click="handleFlashFirmware"
                            @mouseenter="!connectionIsConnected && hostExpand()"
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
                            {{
                                connectionState === "disconnected"
                                    ? supportsSerialPort()
                                        ? tr("updater_flash_button_disconnected")
                                        : tr("updater_serial_unsupported")
                                    : connectionIsConnected && !canFlash
                                      ? tr("updater_flash_select_release_or_file")
                                      : ""
                            }}
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
    /* min-width: 120px; */
    background-color: color-mix(in srgb, var(--vp-c-bg-elv) 95%, transparent);
    backface-visibility: hidden;
    border-radius: 8px;
    padding: 8px 10px;
    font-size: 14px;
    color: var(--vp-c-text-1);
    cursor: pointer;
    transition: all 0.2s;
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
    width: max-content;
    min-width: 100%;
    border: 1px solid var(--vp-c-divider);
    border-radius: 8px;
    padding: 7px;
    background-color: var(--vp-c-bg);
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
    transition: transform 0.2s ease;
    overflow: hidden;
    max-height: 250px;
    display: flex;
    flex-direction: column;
    /* min-width: 160px; */
}

.dropdown-menu.is-visible {
    transform: translateY(0);
}

.dropdown-item:hover {
    background-color: color-mix(in srgb, var(--vp-c-text-1) 5%, transparent);
}

.dark .dropdown-item:hover {
    background-color: color-mix(in srgb, var(--vp-c-text-1) 4%, transparent);
}

.dropdown-item.is-selected {
    background-color: color-mix(in srgb, var(--vp-c-brand-1) 10%, transparent);
    /* background-image: linear-gradient(to right, var(--vp-c-brand-soft), transparent); */
    color: var(--vp-c-brand-1);
}

.dropdown-item.is-selected:hover {
    background-color: color-mix(in srgb, var(--vp-c-brand-1) 15%, transparent);
}

.fade-dropdown-enter-active,
.fade-dropdown-leave-active {
    transition: opacity 0.2s ease;
}

.fade-dropdown-enter-from,
.fade-dropdown-leave-to {
    opacity: 0;
}

.download-button-small {
    border: 1px solid var(--vp-c-divider);
}
</style>
