<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { DevbuildFile, ReleaseItem } from "../../../_data/releases";
import { useI18n } from "../composables/useI18n";

import FileGrid from "./FileGrid.vue";
import Tooltip from "./Tooltip.vue";

const { tr, getLocalizedPath } = useI18n();

interface Props {
    selectedRelease: ReleaseItem | null;
    isCurrentVersion: boolean;
}

const props = defineProps<Props>();

const installMethods = computed(() => [
    {
        show: true,
        name: tr("releases_web_updater"),
        href: getLocalizedPath(`/update/${props.selectedRelease?.commit}`),
    },
    {
        show: props.selectedRelease?.branch.includes("dev"),
        name: tr("releases_flipper_lab"),
        href: props.selectedRelease?.branch.includes("dev")
            ? `https://lab.flipper.net/?url=https://up.momentum-fw.dev/builds/firmware/dev/${findUpdateTgz(props.selectedRelease?.files as DevbuildFile[])}&channel=dev-cfw&version=${props.selectedRelease?.branch}-${props.selectedRelease?.commit}`
            : "",
    },
]);

const findUpdateTgz = (files: DevbuildFile[]): string | undefined => {
    const updateTgz = files.find(
        (file) => file.filename.startsWith("flipper-z-f7-update") && file.filename.endsWith(".tgz"),
    );
    return updateTgz?.filename;
};

const isDevelopmentFile = (filename: string): boolean => {
    const devKeywords = ["any-core2", "any-scripts", "sdk"];
    return devKeywords.some((keyword) => filename.toLowerCase().includes(keyword));
};

const categorizedFiles = computed(() => {
    if (!props.selectedRelease?.files) return { regular: [], development: [] };

    const getFilename = (file: any) => {
        return "filename" in file ? file.filename : file.url.split("/").pop() || "";
    };

    const getFilePriority = (filename: string): number => {
        const f = filename.toLowerCase();
        if (f.endsWith(".tgz")) return 0;
        if (f.endsWith(".zip")) return 1;
        if (f.endsWith(".dfu")) return 2;

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

const isDevelopmentSectionExpanded = ref(false);

const toggleDevelopmentSection = () => {
    isDevelopmentSectionExpanded.value = !isDevelopmentSectionExpanded.value;
};

watch(
    () => props.selectedRelease,
    () => {
        isDevelopmentSectionExpanded.value = false;
    },
);
</script>

<template>
    <div v-if="selectedRelease?.files" class="md:mb-4 px-4 sm:px-4">
        <div
            class="flex flex-row justify-start items-end gap-1.5 pb-2 mb-3 border-b border-vp-divider"
        >
            <span
                class="text-vp-1 text-[13px] font-semibold py-1 leading-6 tracking-wide uppercase"
                >{{ tr("releases_files") }}</span
            >
        </div>

        <div v-if="categorizedFiles.regular.length > 0" class="mb-4">
            <FileGrid :files="categorizedFiles.regular" :branch="selectedRelease.branch" />
        </div>

        <div v-if="categorizedFiles.development.length > 0" class="mt-3 mb-4">
            <button
                @click="toggleDevelopmentSection"
                class="flex gap-2 w-full text-left py-2 text-vp-2 hover:text-vp-1 items-center justify-start transition-colors duration-100 group"
            >
                <v-icon
                    name="oi-chevron-down"
                    scale="0.8"
                    class="transition-transform duration-200 text-vp-2"
                    :class="{ 'rotate-180': isDevelopmentSectionExpanded }"
                />
                <span
                    class="text-sm text-vp-2 font-medium group-hover:text-vp-1 transition-colors duration-200"
                    >{{ tr("releases_files_dev") }}</span
                >
                <span class="text-xs text-vp-3 mt-px mx-px">{{
                    categorizedFiles.development.length
                }}</span>
                <div class="flex-1 bg-vp-divider w-full h-px"></div>
            </button>

            <Transition name="dev-files">
                <div v-if="isDevelopmentSectionExpanded" class="mt-1">
                    <div class="flex flex-col gap-5">
                        <div class="flex-shrink-0">
                            <p class="text-xs text-vp-3 leading-relaxed my-0">
                                {{ tr("releases_files_dev_description") }}
                            </p>
                        </div>

                        <div class="flex-1 min-w-80">
                            <div class="mb-3">
                                <FileGrid
                                    :files="categorizedFiles.development"
                                    :branch="selectedRelease.branch"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </Transition>
        </div>

        <div
            class="flex flex-row flex-wrap justify-start sm:justify-between items-start sm:items-center gap-1.5 border-t border-vp-divider pt-4 pb-4"
        >
            <div class="flex flex-row gap-x-1.5 items-center text-sm mr-auto">
                <Tooltip
                    :aria-label="tr('releases_install')"
                    :delay="0"
                    :hide-delay="100"
                    :max-width="'315px'"
                    class="files-tooltip z-[1] -mb-[6px]"
                >
                    <div
                        class="flex items-center justify-center text-vp-3/70 hover:!text-vp-2 transition-colors duration-200"
                    >
                        <v-icon name="la-info-circle-solid" scale="0.9" />
                    </div>
                    <template #content>
                        <div
                            class="prose prose-sm dark:prose-invert text-vp-1 max-w-none text-left justify-center"
                            v-html="
                                tr('releases_install_tooltip', {
                                    url: getLocalizedPath(`/wiki/installation`),
                                    text: `v2.momentum-fw.dev${getLocalizedPath(`/wiki/installation`)}`,
                                })
                            "
                        ></div>
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
                        v-if="method.show"
                        :href="method.href"
                        target="_blank"
                        rel="noopener"
                        class="text-vp-2 sm:text-vp-1 sm:hover:text-vp-2 transition-colors duration-200 no-underline font-medium vp-external-link-icon whitespace-nowrap sm:py-1 sm:pl-2.5 sm:pr-2 sm:border sm:border-vp-divider sm:rounded-full sm:hover:border-vp-brand-1 sm:hover:bg-vp-soft/55"
                    >
                        {{ method.name }}
                    </a>
                </template>
            </div>
        </div>
    </div>
</template>

<style scoped>
.files-tooltip :deep(.tooltip-trigger) {
    display: inline-flex;
    height: 16px;
    width: 20px;
    align-items: center;
    justify-content: center;
    cursor: default !important;
}

.dev-files-enter-active,
.dev-files-leave-active {
    transition: all 0.3s ease-in-out;
    overflow: hidden;
}

.dev-files-enter-from {
    opacity: 0;
    max-height: 0;
    transform: translateY(-10px);
}

.dev-files-enter-to {
    opacity: 1;
    max-height: 1000px;
    transform: translateY(0);
}

.dev-files-leave-from {
    opacity: 1;
    max-height: 1000px;
    transform: translateY(0);
}

.dev-files-leave-to {
    opacity: 0;
    max-height: 0;
    transform: translateY(-10px);
}
</style>
