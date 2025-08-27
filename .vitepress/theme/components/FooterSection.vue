<script setup lang="ts">
import { useI18n } from "../composables/useI18n";
import { formatDate } from "../date";
import { isExternalLink } from "../util";

const { getLocalizedPath } = useI18n();

interface FooterItem {
    text?: string;
    name?: string;
    url?: string;
    link?: string;
    date?: string;
    target?: string;
    rel?: string;
    version?: string;
}

interface Props {
    title: string;
    items: FooterItem[];
    type?: "release" | "link";
}

const props = withDefaults(defineProps<Props>(), {
    type: "link",
});

const getItemUrl = (item: FooterItem) => {
    if (props.type === "release") {
        return getLocalizedPath(`/releases/${item.version}`);
    }
    return item.url || item.link || "";
};

const getItemText = (item: FooterItem) => {
    return item.version || item.text || item.name || "";
};
</script>

<template v-if="items.length > 0">
    <div>
        <h3
            class="text-xs font-semibold text-vp-1 uppercase tracking-wider mb-2 text-left w-min whitespace-nowrap"
        >
            {{ title }}
        </h3>
        <ul class="space-y-0">
            <li v-for="item in items" :key="getItemText(item)">
                <a
                    :href="getItemUrl(item)"
                    :target="isExternalLink(getItemUrl(item)) ? '_blank' : undefined"
                    :rel="isExternalLink(getItemUrl(item)) ? 'noopener noreferrer' : undefined"
                    :class="[
                        'text-[13px] text-vp-2 hover:text-vp-brand-1 transition-colors duration-100 flex items-center min-h-[1.25rem] leading-6 whitespace-nowrap overflow-hidden text-ellipsis',
                        type === 'release' ? 'gap-2' : '',
                        isExternalLink(getItemUrl(item)) ? 'vp-external-link-icon' : '',
                    ]"
                >
                    <template v-if="type === 'release'">
                        <span class="min-w-[68px] lowercase font-mono">{{
                            getItemText(item)
                        }}</span>
                        <span
                            class="text-vp-3 text-[11px] tracking-tighter text-right whitespace-nowrap font-mono"
                        >
                            {{ formatDate(item.date || "", "short") }}
                        </span>
                    </template>
                    <template v-else>
                        {{ getItemText(item) }}
                    </template>
                </a>
            </li>
        </ul>
    </div>
</template>
