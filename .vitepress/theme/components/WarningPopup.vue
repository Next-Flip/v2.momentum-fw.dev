<script setup lang="ts">
import { useStorage } from "@vueuse/core";
import { useRoute } from "vitepress";
import { computed, ref } from "vue";
import { useI18n } from "../composables/useI18n";

const route = useRoute();
const { tr } = useI18n();

const hasSeenWarning = useStorage("momentum-warning-seen", false);
const dismissedThisSession = ref(false);
const dontShowAgain = ref(false);

const shouldShowPopup = computed(() => {
    const homePagePaths = ["/", "/index.html", "/zh/", "/ja/", "/ko/"];
    const isHomePage = homePagePaths.some((path) => route.path === path);
    return isHomePage && !hasSeenWarning.value && !dismissedThisSession.value;
});

function handleConfirm() {
    if (dontShowAgain.value) {
        hasSeenWarning.value = true;
    } else {
        dismissedThisSession.value = true;
    }
}
</script>

<template>
    <Teleport to="body">
        <Transition
            name="warning-popup"
            enter-active-class="transition-all duration-300 ease-out"
            enter-from-class="opacity-0 scale-95"
            enter-to-class="opacity-100 scale-100"
            leave-active-class="transition-all duration-200 ease-in"
            leave-from-class="opacity-100 scale-100"
            leave-to-class="opacity-0 scale-95"
        >
            <div
                v-if="shouldShowPopup"
                class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
            >
                <div
                    class="relative flex flex-col max-w-sm w-full bg-vp-bg dark:bg-vp-bg rounded-xl shadow-2xl border border-vp-divider overflow-hidden backdrop-blur p-5 gap-y-4"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="warning-title"
                    aria-describedby="warning-description"
                >
                    <div class="bg-vp-bg">
                        <div class="flex items-end justify-start gap-3">
                            <div class="flex-shrink-0">
                                <v-icon
                                    name="ri-error-warning-line"
                                    scale="1.15"
                                    class="text-[var(--mntm-yellow-1)]"
                                />
                            </div>
                            <h2 id="warning-title" class="text-base font-semibold text-vp-1">
                                v2.momentum-fw.dev
                            </h2>
                        </div>
                    </div>

                    <div class="py-1">
                        <p id="warning-description" class="text-sm text-vp-1 leading-relaxed">
                            {{ tr("warning_popup_description") }}
                        </p>
                    </div>

                    <div class="">
                        <div class="flex flex-col gap-6">
                            <label class="flex items-center gap-2 text-sm text-vp-2 cursor-pointer">
                                <input
                                    v-model="dontShowAgain"
                                    type="checkbox"
                                    id="dont-show-again"
                                    class="rounded border-vp-divider text-sm text-vp-brand-2 focus:ring-vp-brand-1 bg-vp-bg"
                                />
                                <span>{{ tr("warning_popup_dont_show_again") }}</span>
                            </label>
                            <button
                                @click="handleConfirm"
                                class="w-full px-4 py-2 bg-vp-brand-2 hover:bg-vp-brand-3 focus:bg-vp-brand-3 text-white font-medium rounded-lg transition-colors duration-100 focus:outline-none focus:ring-2 focus:ring-vp-brand-1 focus:ring-offset-2 focus:ring-offset-vp-bg min-h-[38px]"
                            >
                                {{ tr("warning_popup_continue") }}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>
