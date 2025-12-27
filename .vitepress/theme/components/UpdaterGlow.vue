<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { buildInfo } from "../../../_data/buildInfo.ts";
import { useThemeSwitcher } from "../composables";

const MathFloor = Math.floor;
const MathRandom = Math.random;

const { currentTheme } = useThemeSwitcher();
const regenerationKey = ref(0);

interface Props {
    show?: boolean;
    useSeededRandom?: boolean;
}

interface ColorPalette {
    from: string;
    via: string;
    to: string;
}

interface Orb {
    id: string;
    cssVars: Record<string, string>;
    classes: string;
    animationClass: string;
}

interface OrbConfig {
    count: [number, number]; // [base, random]
    size: [number, number]; // [base, random]
    blur: string | string[];
    position: { top: [number, number]; right: [number, number] };
    baseDuration: number;
    directionThreshold: number;
    opacityRange: [number, number];
}

const props = withDefaults(defineProps<Props>(), {
    show: false,
    useSeededRandom: false, // TODO: use later
});

class SeededRandom {
    private seed: number;
    constructor(seed: number) {
        this.seed = seed;
    }

    next(): number {
        this.seed = (this.seed * 1664525 + 1013904223) % 4294967296;
        return this.seed / 4294967296;
    }

    nextInt(max: number): number {
        return MathFloor(this.next() * max);
    }
}

const createSeed = (timestamp: number, commitHash: string): number => {
    const hashNum = parseInt(commitHash.slice(0, 8), 16) || 0;
    return (timestamp % 1000000) + hashNum;
};
const baseSeed = createSeed(buildInfo.timestamp, buildInfo.commitHash);

const palette = (from: string, via: string, to: string) => {
    return { from, via, to };
};
const themePalettes: Record<string, ColorPalette[]> = {
    white: [
        palette("blue-400/50", "purple-500/35", "transparent"),
        palette("cyan-300/40", "indigo-400/25", "transparent"),
        palette("purple-400/40", "pink-500/25", "transparent"),
        palette("violet-400/50", "purple-300/30", "transparent"),
        palette("emerald-400/45", "teal-300/25", "transparent"),
        palette("white/40", "emerald-400/25", "transparent"),
        palette("blue-300/45", "cyan-400/25", "transparent"),
        palette("indigo-400/50", "purple-400/30", "transparent"),
        palette("teal-400/40", "emerald-300/25", "transparent"),
        palette("sky-400/40", "blue-300/25", "transparent"),
        palette("pink-400/45", "blue-400/30", "transparent"),
        palette("white/30", "emerald-400/25", "transparent"),
        palette("fuchsia-400/45", "violet-300/30", "transparent"),
    ],
    purp: [
        palette("purple-400/55", "indigo-500/40", "transparent"),
        palette("violet-400/50", "purple-400/35", "transparent"),
        palette("yellow-300/40", "orange-200/30", "transparent"),
        palette("indigo-400/45", "violet-500/30", "transparent"),
        palette("blue-400/50", "purple-300/35", "transparent"),
        palette("purple-300/50", "indigo-400/30", "transparent"),
        palette("violet-500/45", "purple-400/25", "transparent"),
        palette("indigo-300/50", "violet-400/35", "transparent"),
        palette("purple-500/40", "blue-400/30", "transparent"),
        palette("yellow-400/45", "orange-300/30", "transparent"),
        palette("violet-300/55", "indigo-300/40", "transparent"),
        palette("blue-300/45", "purple-500/30", "transparent"),
        palette("indigo-500/50", "violet-300/35", "transparent"),
        palette("sky-400/40", "purple-300/25", "transparent"),
        palette("orange-500/50", "yellow-400/25", "transparent"),
    ],
    orange: [
        palette("red-400/50", "orange-400/30", "transparent"),
        palette("amber-400/45", "orange-300/25", "transparent"),
        palette("purple-400/45", "indigo-500/25", "transparent"),
        palette("rose-400/45", "amber-400/25", "transparent"),
        palette("orange-400/50", "pink-400/25", "transparent"),
        palette("yellow-400/45", "orange-300/30", "transparent"),
        palette("red-500/50", "amber-300/25", "transparent"),
        palette("amber-500/50", "rose-300/30", "transparent"),
        palette("pink-400/45", "orange-200/25", "transparent"),
        palette("orange-300/40", "red-300/25", "transparent"),
        palette("rose-500/50", "amber-400/30", "transparent"),
        palette("yellow-300/40", "orange-200/30", "transparent"),
        palette("lavender-300/45", "sky-200/25", "transparent"),
        palette("amber-300/50", "yellow-200/30", "transparent"),
        palette("orange-200/40", "red-200/25", "transparent"),
    ],
    pink: [
        palette("pink-400/50", "purple-400/30", "transparent"),
        palette("fuchsia-400/45", "blue-300/25", "transparent"),
        palette("rose-400/50", "white/20", "transparent"),
        palette("violet-400/45", "pink-300/30", "transparent"),
        palette("indigo-300/40", "fuchsia-400/25", "transparent"),
        palette("white/30", "pink-400/25", "transparent"),
        palette("blue-200/35", "fuchsia-300/25", "transparent"),
        palette("rose-300/45", "purple-300/25", "transparent"),
        palette("violet-300/45", "blue-200/25", "transparent"),
        palette("pink-300/40", "indigo-200/20", "transparent"),
        palette("pink-300/40", "indigo-200/20", "transparent"),
        palette("fuchsia-500/50", "purple-400/25", "transparent"),
        palette("sky-300/45", "pink-200/25", "transparent"),
        palette("lavender-300/45", "sky-200/25", "transparent"),
    ],
    skyline: [
        palette("cyan-300/40", "indigo-400/25", "transparent"),
        palette("green-400/45", "lime-300/30", "transparent"),
        palette("emerald-400/45", "teal-300/25", "transparent"),
        palette("white/40", "emerald-400/25", "transparent"),
        palette("blue-300/45", "cyan-400/25", "transparent"),
        palette("teal-400/40", "emerald-300/25", "transparent"),
        palette("sky-400/40", "blue-300/25", "transparent"),
        palette("white/30", "green-400/25", "transparent"),
        palette("lime-400/45", "green-300/30", "transparent"),
    ],
    mini: [palette("neutral-400/80", "neutral-300/60", "transparent")],
};
// prettier-ignore
const ANIMATIONS = [
    "glow-wander-1", "glow-wander-2", "glow-wander-3", "glow-pulse-1", "glow-pulse-2", "glow-orbit-1", "glow-orbit-2", "glow-drift-1", "glow-drift-2", "glow-float-1", "glow-float-2",
] as const;

const ORB_CONFIGS: Record<string, OrbConfig> = {
    large: {
        count: [10, 3],
        size: [280, 120],
        blur: ["blur-xl", "blur-2xl"],
        position: { top: [-15, 40], right: [-10, 95] },
        baseDuration: 13,
        directionThreshold: 0.35,
        opacityRange: [0.75, 0.2],
    },
    medium: {
        count: [11, 4],
        size: [180, 100],
        blur: "blur-xl",
        position: { top: [-20, 40], right: [5, 80] },
        baseDuration: 8,
        directionThreshold: 0.4,
        opacityRange: [0.7, 0.25],
    },
    small: {
        count: [15, 3],
        size: [80, 100],
        blur: ["blur-lg", "blur-md"],
        position: { top: [-20, 40], right: [10, 75] },
        baseDuration: 10,
        directionThreshold: 0.56,
        opacityRange: [0.7, 0.3],
    },
    mini: {
        count: [8, 3],
        size: [15, 15],
        blur: "blur-md",
        position: { top: [0, 20], right: [-10, 85] },
        baseDuration: 8,
        directionThreshold: 0.3,
        opacityRange: [0.65, 0.35],
    },
};

const colorPalettes = computed(() => {
    return themePalettes[currentTheme.value as keyof typeof themePalettes] || themePalettes.white;
});

const generateOrbClasses = (
    colorIndex: number,
    blur: string,
    isMini: boolean,
    palettes: ColorPalette[],
): string => {
    const palette = isMini ? themePalettes.mini : palettes;
    const colors = palette[colorIndex] || palette[0];
    return [`from-${colors.from}`, `via-${colors.via}`, `to-${colors.to}`, blur].join(" ");
};

const generateOrbs = (
    type: string,
    config: OrbConfig,
    currentKey: number,
    palette: ColorPalette[],
): Orb[] => {
    const count =
        config.count[0] +
        (props.useSeededRandom
            ? new SeededRandom(baseSeed + currentKey + type.charCodeAt(0)).nextInt(
                  config.count[1] + 1,
              )
            : MathFloor(MathRandom() * (config.count[1] + 1)));
    const baseSpeed = 25;
    const isMini = type === "mini";

    return Array.from({ length: count }, (_, i) => {
        let rng: SeededRandom | null = null;

        if (props.useSeededRandom) {
            const typeSeed = baseSeed + currentKey + type.charCodeAt(0);
            const orbSeed = typeSeed + i * 1000;
            rng = new SeededRandom(orbSeed);
        }

        const getRandom = () => (rng ? rng.next() : MathRandom());
        const getRandomInt = (max: number) =>
            rng ? rng.nextInt(max) : MathFloor(MathRandom() * max);
        const size = config.size[0] + getRandom() * config.size[1];
        const colorIndex = getRandomInt(palette.length);
        const animation = ANIMATIONS[getRandomInt(ANIMATIONS.length)];
        const blur = Array.isArray(config.blur)
            ? config.blur[getRandom() > 0.5 ? 1 : 0]
            : config.blur;
        const top = config.position.top[0] + getRandom() * config.position.top[1];
        const right = config.position.right[0] + getRandom() * config.position.right[1];
        const duration = config.baseDuration + getRandom() * baseSpeed;
        const direction = getRandom() > config.directionThreshold ? "normal" : "reverse";
        const maxOpacity = config.opacityRange[0] + getRandom() * config.opacityRange[1];
        const delay = getRandom() * 2;
        const id = `${type}-${i}-${currentKey}`;

        return {
            id,
            cssVars: {
                "--orb-size": `${size}px`,
                "--orb-top": `${top}%`,
                "--orb-right": `${right}%`,
                "--orb-duration": `${duration}s`,
                "--orb-delay": `${delay}s`,
                "--max-opacity": maxOpacity.toString(),
            },
            classes: generateOrbClasses(colorIndex, blur, isMini, palette),
            animationClass: `orb-animation orb-${animation} ${direction === "reverse" ? "orb-reverse" : ""}`,
        };
    });
};

const randomOrbs = computed(() => {
    const currentKey = regenerationKey.value;
    const currentPalette = colorPalettes.value;

    return [
        ...generateOrbs("large", ORB_CONFIGS.large, currentKey, currentPalette),
        ...generateOrbs("medium", ORB_CONFIGS.medium, currentKey, currentPalette),
        ...generateOrbs("small", ORB_CONFIGS.small, currentKey, currentPalette),
        ...generateOrbs("mini", ORB_CONFIGS.mini, currentKey, themePalettes.mini),
    ];
});

watch(
    [() => props.show, currentTheme, () => props.useSeededRandom],
    ([newShow, newTheme, newUseSeeded], [oldShow, oldTheme, oldUseSeeded]) => {
        if (newTheme !== oldTheme) {
            regenerationKey.value++;
        } else if (newShow && !oldShow && !newUseSeeded) {
            regenerationKey.value++;
        } else if (newUseSeeded !== oldUseSeeded) {
            regenerationKey.value++;
        }
    },
    { immediate: false },
);
</script>

<template>
    <Transition name="orbs-fade">
        <div
            v-if="show"
            class="orbs-container fixed inset-0 opacity-25 dark:opacity-[17%] pointer-events-none saturate-250 flex items-start justify-center"
            :style="{ top: 'var(--vp-nav-height)' }"
        >
            <div class="relative w-full max-w-6xl h-full">
                <div
                    v-for="orb in randomOrbs"
                    :key="orb.id"
                    class="absolute rounded-full bg-gradient-radial orb"
                    :class="`${orb.classes} ${orb.animationClass}`"
                    :style="orb.cssVars"
                ></div>
            </div>
        </div>
    </Transition>

    <div
        v-if="show"
        class="fixed inset-0 pointer-events-none z-0 noise-overlay"
        :style="{ top: 'var(--vp-nav-height)' }"
    ></div>
</template>

<style scoped>
.bg-gradient-radial {
    background-image: radial-gradient(circle, var(--tw-gradient-stops));
}

.orbs-container {
    will-change: transform, opacity;
    transform: translateZ(0);
    contain: layout style paint;
    z-index: -1 !important;
}
.orb {
    will-change: transform, opacity;
    width: var(--orb-size);
    height: var(--orb-size);
    top: var(--orb-top);
    right: var(--orb-right);
}
.orb-animation {
    animation-duration: var(--orb-duration);
    animation-delay: var(--orb-delay);
    animation-fill-mode: both;
    animation-iteration-count: infinite;
    animation-timing-function: ease-in-out;
}
.orb-reverse {
    animation-direction: reverse;
}
.orb-glow-pulse-1 {
    animation-name: glow-pulse-1;
}
.orb-glow-pulse-2 {
    animation-name: glow-pulse-2;
}
.orb-glow-drift-1 {
    animation-name: glow-drift-1;
}
.orb-glow-drift-2 {
    animation-name: glow-drift-2;
}
.orb-glow-float-1 {
    animation-name: glow-float-1;
}
.orb-glow-float-2 {
    animation-name: glow-float-2;
}
.orb-glow-wander-1 {
    animation-name: glow-wander-1;
}
.orb-glow-wander-2 {
    animation-name: glow-wander-2;
}
.orb-glow-wander-3 {
    animation-name: glow-wander-3;
}
.orb-glow-orbit-1 {
    animation-name: glow-orbit-1;
}
.orb-glow-orbit-2 {
    animation-name: glow-orbit-2;
}
.orbs-fade-enter-active {
    transition: opacity 0.8s ease-out 0.3s;
}
.orbs-fade-leave-active {
    transition: opacity 0.4s ease-in;
}
.orbs-fade-enter-from,
.orbs-fade-leave-to {
    opacity: 0;
}

.noise-overlay {
    background-image: url("https://grainy-gradients.vercel.app/noise.svg");
    opacity: 0.1;
    filter: invert(1) contrast(300%) brightness(1000%) saturate(0);
    mask-image: linear-gradient(to bottom, var(--vp-c-bg-dark) 0%, transparent 100%);
    -webkit-mask-image: linear-gradient(to bottom, var(--vp-c-bg-dark) 0%, transparent 100%);
    z-index: -1;
    mix-blend-mode: screen;
}
</style>

<style>
/* prettier-ignore */
@keyframes glow-pulse-1 {
    0% { transform: scale3d(0.8, 0.8, 1); opacity: calc(var(--max-opacity) * 0.4); }
    25% { transform: scale3d(0.9, 0.9, 1); opacity: calc(var(--max-opacity) * 0.6); }
    50% { transform: scale3d(1.2, 1.2, 1); opacity: calc(var(--max-opacity) * 0.85); }
    75% { transform: scale3d(1.1, 1.1, 1); opacity: calc(var(--max-opacity) * 0.9); }
    100% { transform: scale3d(0.8, 0.8, 1); opacity: var(--max-opacity); }
}
/* prettier-ignore */
@keyframes glow-pulse-2 {
    0% { transform: scale3d(0.6, 0.6, 1); opacity: calc(var(--max-opacity) * 0.5); }
    30% { transform: scale3d(0.8, 0.8, 1); opacity: calc(var(--max-opacity) * 0.6); }
    60% { transform: scale3d(1.4, 1.4, 1); opacity: calc(var(--max-opacity) * 0.8); }
    85% { transform: scale3d(1.1, 1.1, 1); opacity: calc(var(--max-opacity) * 0.9); }
    100% { transform: scale3d(0.6, 0.6, 1); opacity: var(--max-opacity); }
}
/* prettier-ignore */
@keyframes glow-drift-1 {
    0% { transform: translate3d(0, 0, 0) rotate(0deg); opacity: calc(var(--max-opacity) * 0.5); }
    20% { transform: translate3d(-15px, 10px, 0) rotate(22deg); opacity: calc(var(--max-opacity) * 0.6); }
    40% { transform: translate3d(-60px, 40px, 0) rotate(90deg); opacity: calc(var(--max-opacity) * 0.7); }
    60% { transform: translate3d(-80px, -40px, 0) rotate(180deg); opacity: calc(var(--max-opacity) * 0.8); }
    80% { transform: translate3d(40px, -60px, 0) rotate(270deg); opacity: calc(var(--max-opacity) * 0.9); }
    100% { transform: translate3d(0, 0, 0) rotate(360deg); opacity: var(--max-opacity); }
}
/* prettier-ignore */
@keyframes glow-drift-2 {
    0% { transform: translate3d(0, 0, 0) rotate(0deg) scale3d(0.8, 0.8, 1); opacity: calc(var(--max-opacity) * 0.5); }
    25% { transform: translate3d(20px, -8px, 0) rotate(40deg) scale3d(0.85, 0.85, 1); opacity: calc(var(--max-opacity) * 0.6); }
    50% { transform: translate3d(80px, -30px, 0) rotate(120deg) scale3d(1.1, 1.1, 1); opacity: calc(var(--max-opacity) * 0.8); }
    75% { transform: translate3d(40px, 80px, 0) rotate(240deg) scale3d(0.9, 0.9, 1); opacity: calc(var(--max-opacity) * 0.9); }
    100% { transform: translate3d(0, 0, 0) rotate(360deg) scale3d(0.8, 0.8, 1); opacity: var(--max-opacity); }
}
/* prettier-ignore */
@keyframes glow-float-1 {
    0% { transform: translate3d(0, 0, 0) scale3d(1, 1, 1); opacity: calc(var(--max-opacity) * 0.5); }
    20% { transform: translate3d(-5px, -5px, 0) scale3d(1.02, 1.02, 1); opacity: calc(var(--max-opacity) * 0.6); }
    40% { transform: translate3d(-20px, -20px, 0) scale3d(1.1, 1.1, 1); opacity: calc(var(--max-opacity) * 0.7); }
    60% { transform: translate3d(20px, -40px, 0) scale3d(0.9, 0.9, 1); opacity: calc(var(--max-opacity) * 0.8); }
    80% { transform: translate3d(-10px, -20px, 0) scale3d(1.05, 1.05, 1); opacity: calc(var(--max-opacity) * 0.9); }
    100% { transform: translate3d(0, 0, 0) scale3d(1, 1, 1); opacity: var(--max-opacity); }
}
/* prettier-ignore */
@keyframes glow-float-2 {
    0% { transform: translate3d(0, 0, 0) scale3d(1, 1, 1); opacity: calc(var(--max-opacity) * 0.5); }
    25% { transform: translate3d(5px, -8px, 0) scale3d(1.05, 1.05, 1); opacity: calc(var(--max-opacity) * 0.6); }
    50% { transform: translate3d(15px, -25px, 0) scale3d(1.2, 1.2, 1); opacity: calc(var(--max-opacity) * 0.8); }
    75% { transform: translate3d(-15px, -50px, 0) scale3d(0.8, 0.8, 1); opacity: calc(var(--max-opacity) * 0.9); }
    100% { transform: translate3d(0, 0, 0) scale3d(1, 1, 1); opacity: var(--max-opacity); }
}
/* prettier-ignore */
@keyframes glow-wander-1 {
    0% { transform: translate3d(0, 0, 0) scale3d(0.9, 0.9, 1); opacity: calc(var(--max-opacity) * 0.85); }
    15% { transform: translate3d(-120px, 60px, 0) scale3d(0.95, 0.95, 1); opacity: calc(var(--max-opacity) * 0.9); }
    30% { transform: translate3d(-200px, 120px, 0) scale3d(1.1, 1.1, 1); opacity: var(--max-opacity); }
    45% { transform: translate3d(-80px, -150px, 0) scale3d(0.8, 0.8, 1); opacity: calc(var(--max-opacity) * 0.95); }
    60% { transform: translate3d(180px, -90px, 0) scale3d(1.2, 1.2, 1); opacity: var(--max-opacity); }
    75% { transform: translate3d(240px, 150px, 0) scale3d(0.9, 0.9, 1); opacity: calc(var(--max-opacity) * 0.9); }
    90% { transform: translate3d(-60px, 240px, 0) scale3d(1, 1, 1); opacity: calc(var(--max-opacity) * 0.95); }
    100% { transform: translate3d(0, 0, 0) scale3d(0.9, 0.9, 1); opacity: calc(var(--max-opacity) * 0.85); }
}
/* prettier-ignore */
@keyframes glow-wander-2 {
    0% { transform: translate3d(0, 0, 0) scale3d(1, 1, 1) rotate(0deg); opacity: calc(var(--max-opacity) * 0.8); }
    20% { transform: translate3d(10px, -10px, 0) scale3d(0.9, 0.9, 1) rotate(15deg); opacity: calc(var(--max-opacity) * 0.9); }
    35% { transform: translate3d(50px, -40px, 0) scale3d(0.8, 0.8, 1) rotate(45deg); opacity: var(--max-opacity); }
    50% { transform: translate3d(-30px, -80px, 0) scale3d(1.2, 1.2, 1) rotate(90deg); opacity: calc(var(--max-opacity) * 0.95); }
    70% { transform: translate3d(-70px, 30px, 0) scale3d(0.9, 0.9, 1) rotate(180deg); opacity: var(--max-opacity); }
    90% { transform: translate3d(40px, 70px, 0) scale3d(1.1, 1.1, 1) rotate(270deg); opacity: calc(var(--max-opacity) * 0.9); }
    100% { transform: translate3d(0, 0, 0) scale3d(1, 1, 1) rotate(360deg); opacity: calc(var(--max-opacity) * 0.8); }
}
/* prettier-ignore */
@keyframes glow-wander-3 {
    0% { transform: translate3d(0, 0, 0) scale3d(0.8, 0.8, 1); opacity: calc(var(--max-opacity) * 0.8); }
    25% { transform: translate3d(-25px, -12px, 0) scale3d(0.9, 0.9, 1); opacity: calc(var(--max-opacity) * 0.9); }
    40% { transform: translate3d(-100px, -50px, 0) scale3d(1.3, 1.3, 1); opacity: var(--max-opacity); }
    60% { transform: translate3d(80px, -100px, 0) scale3d(0.7, 0.7, 1); opacity: calc(var(--max-opacity) * 0.95); }
    80% { transform: translate3d(120px, 60px, 0) scale3d(1.1, 1.1, 1); opacity: var(--max-opacity); }
    100% { transform: translate3d(0, 0, 0) scale3d(0.8, 0.8, 1); opacity: calc(var(--max-opacity) * 0.8); }
}
/* prettier-ignore */
@keyframes glow-orbit-1 {
    0% { transform: translate3d(0, 0, 0) rotate(0deg) scale3d(1, 1, 1); opacity: calc(var(--max-opacity) * 0.85); }
    20% { transform: translate3d(-15px, -15px, 0) rotate(22deg) scale3d(0.9, 0.9, 1); opacity: calc(var(--max-opacity) * 0.9); }
    40% { transform: translate3d(-60px, -60px, 0) rotate(90deg) scale3d(0.8, 0.8, 1); opacity: var(--max-opacity); }
    60% { transform: translate3d(0, -120px, 0) rotate(180deg) scale3d(1.2, 1.2, 1); opacity: calc(var(--max-opacity) * 0.95); }
    80% { transform: translate3d(60px, -60px, 0) rotate(270deg) scale3d(0.9, 0.9, 1); opacity: var(--max-opacity); }
    100% { transform: translate3d(0, 0, 0) rotate(360deg) scale3d(1, 1, 1); opacity: calc(var(--max-opacity) * 0.85); }
}
/* prettier-ignore */
@keyframes glow-orbit-2 {
    0% { transform: translate3d(0, 0, 0) rotate(0deg) scale3d(0.9, 0.9, 1); opacity: calc(var(--max-opacity) * 0.8); }
    25% { transform: translate3d(12px, -12px, 0) rotate(40deg) scale3d(0.95, 0.95, 1); opacity: calc(var(--max-opacity) * 0.9); }
    50% { transform: translate3d(40px, -40px, 0) rotate(120deg) scale3d(1.1, 1.1, 1); opacity: var(--max-opacity); }
    75% { transform: translate3d(-40px, -40px, 0) rotate(240deg) scale3d(0.8, 0.8, 1); opacity: calc(var(--max-opacity) * 0.95); }
    100% { transform: translate3d(0, 0, 0) rotate(360deg) scale3d(0.9, 0.9, 1); opacity: calc(var(--max-opacity) * 0.8); }
}
</style>
