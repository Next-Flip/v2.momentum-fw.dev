<script setup lang="ts">
import { computed, inject, onBeforeUnmount, onMounted, ref } from "vue";
import type { ReleaseItem } from "../../../_data/releases";
import { useConnectionInfo } from "../composables/useConnectionInfo";
import { useDots } from "../composables/useDots";
import { useI18n } from "../composables/useI18n";
import type { useSerialConnection } from "../composables/useSerialConnection";

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
const {
    isConnected: connectionIsConnected,
    connectionState,
    deviceInfo
} = useConnectionInfo();

const serialConnection = inject<ReturnType<typeof useSerialConnection> | null>("serialConnection");

const emit = defineEmits<{
    "channel-change": [channel: "mainline" | "devbuild"];
    "release-change": [release: ReleaseItem];
    "flash-firmware": [];
}>();

const isConnected = computed(() => connectionIsConnected.value);
const canFlash = computed(() => {
    const hasReleaseOrFile = (props.selectedRelease || props.uploadedFile);
    const notUpdating = !serialConnection?.flags.updateInProgress;

    if (props.testMode) {
        return hasReleaseOrFile && notUpdating;
    } else {
        return isConnected.value && hasReleaseOrFile && notUpdating;
    }
});

const channelDropdownRef = ref<HTMLElement | null>(null);
const releaseDropdownRef = ref<HTMLElement | null>(null);
const isChannelDropdownOpen = ref(false);
const isReleaseDropdownOpen = ref(false);

const channelOptions = computed(() => [
    { value: "mainline", label: tr("updater_mainline_label"), description: tr("updater_mainline_description") },
    { value: "devbuild", label: tr("updater_development_label"), description: tr("updater_development_description") }
]);

const getChannelLabel = () => {
    if (!props.selectedChannel) return tr("updater_select_channel");
    const option = channelOptions.value.find(opt => opt.value === props.selectedChannel);
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
        <div class="grid grid-cols-1 md:grid-cols-11 gap-4 items-end">
            <div class="md:col-span-3" :class="{ 'opacity-50': uploadedFile }">
                <label class="block text-sm font-medium text-vp-2 mb-3">{{ tr("updater_channel_label") }}</label>
                <div class="relative backdrop-blur" ref="channelDropdownRef">
                    <button class="dropdown-button w-full" @click="toggleChannelDropdown" :class="{
                        'is-active': isChannelDropdownOpen,
                        'cursor-not-allowed': uploadedFile
                    }">
                        <span class="whitespace-nowrap overflow-hidden text-ellipsis block z-[5]">
                            {{ getChannelLabel() }}
                        </span>
                        <div class="select-icon flex items-center text-vp-3 transition-transform duration-200">
                            <v-icon name="oi-chevron-down" />
                        </div>
                    </button>

                    <Transition name="fade-dropdown">
                        <div class="dropdown-menu-container" v-if="isChannelDropdownOpen">
                            <div class="dropdown-menu" :class="{ 'is-visible': isChannelDropdownOpen }">
                                <div
                                    class="flex flex-col overflow-hidden max-h-60 overflow-y-auto rounded-[4px] bg-vp-soft-mute">
                                    <span v-for="channel in channelOptions" :key="channel.value"
                                        class="dropdown-item items-center justify-start px-3 py-2 cursor-pointer flex transition-colors duration-100 w-full z-[5] text-[13px] overflow-hidden min-w-0"
                                        :class="{ 'is-selected': selectedChannel === channel.value }"
                                        @click="selectChannel(channel.value as 'mainline' | 'devbuild')">
                                        <div class="flex flex-row items-center gap-3 min-w-0 flex-1">
                                            <div class="flex flex-col min-w-0 flex-1">
                                                <span
                                                    class="font-medium text-sm whitespace-nowrap overflow-hidden text-ellipsis">
                                                    {{ channel.label }}
                                                </span>
                                                <span
                                                    class="text-xs text-vp-3 whitespace-nowrap overflow-hidden text-ellipsis"
                                                    :class="{ 'text-vp-brand-1/60': selectedChannel === channel.value }">
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
            </div>

            <div class="md:col-span-5" :class="{ 'opacity-50': uploadedFile }">
                <label class="block text-sm font-medium text-vp-2 mb-3">{{ tr("updater_version_dropdown_label")
                    }}</label>
                <div class="relative backdrop-blur" :class="{ 'opacity-50': !selectedChannel && !uploadedFile }"
                    ref="releaseDropdownRef">
                    <button class="dropdown-button w-full" @click="toggleReleaseDropdown" :class="{
                        'is-active': isReleaseDropdownOpen,
                        'cursor-not-allowed': uploadedFile || (!selectedChannel && !uploadedFile)
                    }">
                        <span class="whitespace-nowrap overflow-hidden text-ellipsis block z-[5]">
                            {{ getReleaseLabel() }}
                        </span>
                        <div class="select-icon flex items-center text-vp-3 transition-transform duration-200">
                            <v-icon name="oi-chevron-down" />
                        </div>
                    </button>

                    <Transition name="fade-dropdown">
                        <div class="dropdown-menu-container" v-if="isReleaseDropdownOpen">
                            <div class="dropdown-menu" :class="{ 'is-visible': isReleaseDropdownOpen }">
                                <div
                                    class="flex flex-col overflow-hidden max-h-[275px] pr-[7px] overflow-y-auto rounded-[4px] bg-vp-soft-mute">
                                    <div v-for="(release, index) in channelReleases" :key="release.commit"
                                        class="dropdown-item flex flex-row min-h-7 items-center justify-between px-3 py-2 cursor-pointer transition-colors duration-100 w-full z-[5] text-[13px] overflow-hidden min-w-0"
                                        :class="{
                                            'is-selected': selectedRelease?.commit === release.commit,
                                            'rounded-t-[4px]': index === 0,
                                            'rounded-b-[4px]': index === channelReleases.length - 1,
                                        }" @click="selectRelease(release)">
                                        <div class="flex flex-row items-center gap-3 min-w-0">
                                            <span class="font-medium text-vp-1 font-mono flex-shrink-0"
                                                :class="{ 'text-vp-brand-1': selectedRelease?.commit === release.commit }">
                                                {{ release.version && release.version.startsWith("mntm-")
                                                    ? release.version
                                                    : release.commit.substring(0, 7) }}
                                            </span>
                                            <span v-if="deviceInfo?.firmware_commit === release.commit"
                                                class="font-medium text-xs whitespace-nowrap overflow-hidden text-ellipsis uppercase text-vp-brand-1"
                                                :class="{ 'text-vp-brand-1/60': selectedRelease?.commit === release.commit }">
                                                {{ tr("installed") }}
                                            </span>
                                        </div>
                                        <span class="text-xs text-vp-3 ml-2 flex-shrink-0 font-mono"
                                            :class="{ 'text-vp-brand-1/60': selectedRelease?.commit === release.commit }">
                                            {{ release.timestamp ? new Date(release.timestamp *
                                                1000).toLocaleDateString() : tr("updater_unknown_date") }}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Transition>
                </div>
            </div>

            <div class="md:col-span-3 rounded-full transition-all duration-100 border mt-3 select-none"
                :class="canFlash ? 'border-vp-brand-1 hover:border-vp-brand-2' : 'border-vp-divider'">
                <button @click="handleFlashFirmware" :disabled="!canFlash"
                    class="w-full px-4 py-3 rounded-full font-medium flex items-center justify-center gap-2 h-[40px] transition-all duration-200 tracking-tighter uppercase"
                    :class="canFlash ? 'hover:bg-vp-brand-3 cursor-pointer hover:text-neutral-50' : 'text-vp-3 cursor-not-allowed opacity-50'">
                    <v-icon v-if="connectionState !== 'connecting' && connectionState !== 'disconnecting'"
                        name="pr-download" class="opacity-90" />
                    {{ connectionState === 'connecting' ? dots :
                        tr("updater_flash_button") }}
                </button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.dropdown-button {
    display: flex;
    align-items: center;
    border: 1px solid var(--vp-c-divider);
    justify-content: space-between;
    width: 100%;
    max-width: 100%;
    min-width: 0;
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
    left: 0;
    min-width: 140px;
    width: 100%;
    border: 1px solid var(--vp-c-divider);
    border-radius: 8px;
    padding: 7px;
    background-color: var(--vp-c-bg);
    box-shadow: var(--vp-shadow-3);
    backdrop-filter: blur(12px);
}

.dropdown-menu {
    background-color: transparent;
    transform: translateY(-8px);
    transition: transform 0.2s ease;
    overflow: hidden;
    max-height: 250px;
    display: flex;
    flex-direction: column;
    width: 100%;
    min-width: 100%;
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
</style>