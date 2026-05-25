<script setup lang="ts">
interface Props {
    iconName?: string;
    scale?: number | string;
    label?: string;
    checked: boolean;
    callback?: () => void;
    disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
    iconName: "ri-refresh-line",
    scale: 0.65,
    label: "",
    callback: undefined,
    disabled: false,
});

const emit = defineEmits<{
    toggle: [];
}>();

const handleToggle = () => {
    if (props.disabled) return;
    if (props.callback) {
        props.callback();
    } else {
        emit("toggle");
    }
};
</script>

<template>
    <button
        type="button"
        role="switch"
        :aria-checked="checked"
        :aria-label="label"
        class="VPSwitch"
        :class="{ disabled: disabled }"
        :disabled="disabled"
        @click="handleToggle"
    >
        <span
            class="check absolute top-px left-px w-[18px] h-[18px] rounded-full bg-[var(--vp-c-neutral-inverse)] shadow-[var(--vp-shadow-1)] transition-transform duration-[250ms] flex items-center justify-center"
        >
            <span class="icon relative block w-[18px] h-[18px]">
                <v-icon
                    :name="iconName"
                    class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-opacity duration-[250ms] text-vp-1"
                    :scale="scale"
                />
            </span>
        </span>
    </button>
</template>

<style scoped>
.VPSwitch {
    position: relative;
    border-radius: 11px;
    display: block;
    width: 40px;
    height: 22px;
    flex-shrink: 0;
    border: 1px solid var(--vp-input-border-color);
    background-color: var(--vp-input-switch-bg-color);
    transition: border-color 0.1s !important;
    cursor: pointer;
}

.VPSwitch:hover {
    border-color: var(--vp-c-brand-1);
}

.VPSwitch.disabled {
    opacity: 0.4;
    cursor: not-allowed;
}

.VPSwitch.disabled:hover {
    border-color: var(--vp-input-border-color);
}

.VPSwitch[aria-checked="true"] .check {
    transform: translateX(18px);
}
</style>
