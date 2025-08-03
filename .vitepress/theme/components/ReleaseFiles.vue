<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type {
    DevbuildFile,
    FirmwareFile,
    MainlineFile,
    ReleaseItem,
} from "../../../_data/releases";
import { useClickOutside } from "../composables/useClickOutside";
import { useI18n } from "../composables/useI18n";

import FileGrid from "./FileGrid.vue";
import Tooltip from "./Tooltip.vue";

const { tr, getLocalizedPath } = useI18n();

interface Props {
    selectedRelease: ReleaseItem | null;
    isCurrentVersion: boolean;
    devFilesOpen: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
    toggleDevFilesOpen: [devFilesOpen: boolean];
}>();

const devFilesRef = ref<HTMLElement | null>(null);

useClickOutside({
    element: devFilesRef,
    callback: () => {
        if (props.devFilesOpen) {
            emit("toggleDevFilesOpen", false);
        }
    },
});

const installMethods = computed(() => [
    {
        show: true,
        name: tr("releases_web_updater"),
        href: getLocalizedPath(`/update?version=${props.selectedRelease?.version}`),
        isExternal: false,
    },
    {
        show: true,
        name: tr("releases_flipper_lab"),
        href: flipperLabUrl(props.selectedRelease as ReleaseItem),
        isExternal: true,
    },
]);

const flipperLabUrl = (release: ReleaseItem): string => {
    const tgzDir = release.commit ? "dev" : release.version;
    const tgzUrl = `https://up.momentum-fw.dev/builds/firmware/${tgzDir}/${findUpdateTgz(release.files as DevbuildFile[])}`;
    const channel = release.commit ? "dev" : "release";
    const version = (release.commit ? "mntm-dev-" : "") + release.version;
    return `https://lab.flipper.net/?url=${tgzUrl}&channel=${channel}-cfw&version=${version}`;
};

const findUpdateTgz = (files: DevbuildFile[]): string | undefined => {
    const updateTgz = files.find(
        (file) => file.filename.startsWith("flipper-z-f7-update") && file.filename.endsWith(".tgz"),
    );
    return updateTgz?.filename;
};

const isDevelopmentFile = (filename: string): boolean => {
    const devFiles = [
        { type: "core2_firmware", ext: ".tgz" },
        { type: "scripts", ext: ".tgz" },
        { type: "sdk", ext: ".zip" },
        { type: "full", ext: ".dfu" },
    ];
    return devFiles.some(
        (devFile) => filename.split("-")[3] === devFile.type && filename.endsWith(devFile.ext),
    );
};

const categorizedFiles = computed(() => {
    if (!props.selectedRelease?.files) return { regular: [], development: [] };

    const getFilename = (file: FirmwareFile | DevbuildFile | MainlineFile) => {
        return "filename" in file ? file.filename : file.url.split("/").pop() || "";
    };

    const getFilePriority = (filename: string): number => {
        const f = filename.toLowerCase();
        if (f.endsWith(".tgz")) return 0;
        if (f.endsWith(".zip")) return 1;

        return 3;
    };

    const regular = props.selectedRelease.files
        .filter((file) => {
            const filename = getFilename(file);
            return !isDevelopmentFile(filename);
        })
        .sort((a, b) => {
            const priorityA = getFilePriority(getFilename(a));
            const priorityB = getFilePriority(getFilename(b));
            return priorityA - priorityB;
        });

    const development = props.selectedRelease.files
        .filter((file) => {
            const filename = getFilename(file);
            return isDevelopmentFile(filename);
        })
        .sort((a, b) => {
            const priorityA = getFilePriority(getFilename(a));
            const priorityB = getFilePriority(getFilename(b));
            return priorityA - priorityB;
        });

    return { regular, development };
});

const toggleDevelopmentSection = () => {
    emit("toggleDevFilesOpen", !props.devFilesOpen);
};

watch(
    () => props.selectedRelease,
    () => {
        emit("toggleDevFilesOpen", false);
    },
);
</script>

<template>
    <div v-if="selectedRelease?.files" class="relative px-6 sm:px-8 pt-32 pb-3">
        <div class="absolute inset-0 release-files-backdrop mb-3"></div>
        <div
            class="relative z-10 flex flex-row justify-between items-end gap-1.5 pb-2 mb-3 border-b border-vp-divider"
        >
            <span
                class="text-vp-1 text-[13px] font-semibold py-1 leading-6 tracking-wide uppercase"
                >{{ tr("releases_files") }}</span
            >
            <Transition
                enter-active-class="transition-opacity duration-200 ease-in-out"
                leave-active-class="transition-opacity duration-200 ease-in-out"
                enter-from-class="opacity-0"
                enter-to-class="opacity-100"
                leave-from-class="opacity-100"
                leave-to-class="opacity-0"
            >
                <div v-if="devFilesOpen" class="flex items-center">
                    <Tooltip :aria-label="tr('updater_close')" :delay="0" class="z-[1]">
                        <button
                            class="flex items-center justify-center text-vp-3/70 hover:text-vp-2 transition-colors duration-200 p-1 rounded cursor-pointer rotate-45"
                            @click="emit('toggleDevFilesOpen', false)"
                        >
                            <v-icon name="hi-plus-sm" scale="1.1" />
                        </button>
                        <template #content>
                            <span class="text-vp-1">{{ tr("updater_close") }}</span>
                        </template>
                    </Tooltip>
                </div>
            </Transition>
        </div>

        <div v-if="categorizedFiles.regular.length > 0" class="relative z-10 mb-4">
            <FileGrid :files="categorizedFiles.regular as any" />
        </div>

        <div
            v-if="categorizedFiles.development.length > 0"
            ref="devFilesRef"
            class="relative z-10 mt-3 mb-4"
        >
            <button
                class="flex gap-2 w-full text-left py-2 text-vp-2 hover:text-vp-1 items-center justify-start transition-colors duration-100 group"
                @click="toggleDevelopmentSection"
            >
                <v-icon
                    name="oi-chevron-down"
                    scale="0.8"
                    class="transition-transform duration-200 text-vp-2"
                    :class="{ '-rotate-180': props.devFilesOpen }"
                />
                <span
                    class="text-sm text-vp-2 font-medium group-hover:text-vp-1 transition-colors duration-100"
                    >{{ tr("releases_files_dev") }}</span
                >
                <span class="text-xs text-vp-3 mt-px ml-px mr-0.5">{{
                    categorizedFiles.development.length
                }}</span>
                <div class="flex-1 bg-vp-divider w-full h-px"></div>
            </button>

            <Transition
                enter-active-class="transition-all duration-300 ease-in-out overflow-hidden"
                leave-active-class="transition-all duration-300 ease-in-out overflow-hidden"
                enter-from-class="opacity-0 max-h-0 -translate-y-2.5"
                enter-to-class="opacity-100 max-h-[1000px] translate-y-0"
                leave-from-class="opacity-100 max-h-[1000px] translate-y-0"
                leave-to-class="opacity-0 max-h-0 -translate-y-2.5"
            >
                <div v-if="props.devFilesOpen" class="mt-1">
                    <div class="flex flex-col gap-5">
                        <div class="flex-shrink-0">
                            <p class="text-xs text-vp-3 leading-relaxed my-0">
                                {{ tr("releases_files_dev_description") }}
                            </p>
                        </div>

                        <div class="flex-1 min-w-80">
                            <div class="mb-3">
                                <FileGrid :files="categorizedFiles.development as any" />
                            </div>
                        </div>
                    </div>
                </div>
            </Transition>
        </div>

        <div
            class="relative z-10 flex flex-row flex-wrap justify-start sm:justify-between items-start sm:items-center gap-1.5 border-t border-vp-divider pt-4 pb-4"
        >
            <div class="flex flex-row gap-x-1.5 items-center text-sm mr-auto">
                <Tooltip
                    :aria-label="tr('releases_install')"
                    :delay="0"
                    :hide-delay="100"
                    :max-width="'315px'"
                    class="z-[1] -mb-[6px]"
                >
                    <div
                        class="flex items-center justify-center text-vp-3/70 hover:!text-vp-2 transition-colors duration-200 cursor-help"
                    >
                        <v-icon name="la-info-circle-solid" scale="0.9" />
                    </div>
                    <template #content>
                        <div
                            class="prose prose-sm dark:prose-invert text-vp-1 max-w-none text-left justify-center"
                        >
                            <span
                                v-html="
                                    tr('releases_install_tooltip', {
                                        url: getLocalizedPath(`/wiki/installation`),
                                        text: `v2.momentum-fw.dev${getLocalizedPath(`/wiki/installation`)}`,
                                    })
                                "
                            ></span>
                        </div>
                    </template>
                </Tooltip>
                <span
                    class="text-vp-1 text-base font-medium py-1 leading-6 tracking-wide whitespace-nowrap"
                >
                    {{ isCurrentVersion ? tr("releases_reinstall") : tr("releases_install") }}
                </span>
            </div>
            <div
                class="flex flex-col sm:flex-row gap-y-2 gap-x-3 items-end sm:items-center text-[13px] mb-2 sm:mb-0"
            >
                <template v-for="method in installMethods" :key="method.name">
                    <a
                        :href="method.href"
                        :target="method.isExternal ? '_blank' : undefined"
                        rel="noopener"
                        class="text-vp-2 sm:text-vp-1 sm:hover:text-vp-2 transition-all duration-300 no-underline font-medium whitespace-nowrap sm:py-1 sm:pl-3 sm:pr-2.5 sm:border sm:border-vp-divider sm:rounded-full sm:hover:border-vp-brand-1 sm:hover:bg-vp-soft/55"
                        :class="[
                            method.show
                                ? 'opacity-100 visible relative pointer-events-auto'
                                : 'opacity-0 invisible absolute pointer-events-none',
                            method.isExternal ? 'vp-external-link-icon' : '',
                        ]"
                    >
                        {{ method.name }}
                    </a>
                </template>
            </div>
        </div>
    </div>
</template>

<style scoped>
.release-files-backdrop {
    backdrop-filter: blur(1px);
    background-image: linear-gradient(
        to top,
        color-mix(in srgb, var(--vp-c-bg-dark) 100%, transparent) 0%,
        color-mix(in srgb, var(--vp-c-bg-dark) 90%, transparent) 70%,
        color-mix(in srgb, var(--vp-c-bg-dark) 0%, transparent) 100%
    );
    mask-image: linear-gradient(
        to top,
        rgba(0, 0, 0, 1) 0%,
        rgba(0, 0, 0, 1) 70%,
        rgba(0, 0, 0, 0) 100%
    );
    -webkit-mask-image: linear-gradient(
        to top,
        rgba(0, 0, 0, 1) 0%,
        rgba(0, 0, 0, 1) 70%,
        rgba(0, 0, 0, 0) 100%
    );
    will-change: transform;
    transform: translateZ(0);
    z-index: 0;
    pointer-events: none;
}

:deep(.tooltip-trigger) {
    @apply inline-flex h-4 w-5 items-center justify-center cursor-default;
}
</style>
