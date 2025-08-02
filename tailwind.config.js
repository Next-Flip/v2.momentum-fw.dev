import typography from "@tailwindcss/typography";

/** @type {import('tailwindcss').Config} */
export default {
    content: ["./.vitepress/**/*.{js,ts,vue,md}", "./wiki/**/*.md", "./*.md"],
    darkMode: "class",
    safelist: [],
    plugins: [
        typography,
        function ({ addVariant }) {
            addVariant("child", "& > *");
            addVariant("child-hover", "& > *:hover");
        },
    ],
    theme: {
        extend: {
            colors: {
                "vp-warning-1": "rgb(from var(--vp-c-warning-1) r g b / <alpha-value>)",
                "vp-warning-2": "rgb(from var(--vp-c-warning-2) r g b / <alpha-value>)",
                "vp-1": "rgb(from var(--vp-c-text-1) r g b / <alpha-value>)",
                "vp-2": "rgb(from var(--vp-c-text-2) r g b / <alpha-value>)",
                "vp-3": "rgb(from var(--vp-c-text-3) r g b / <alpha-value>)",
                "vp-brand-1": "rgb(from var(--vp-c-brand-1) r g b / <alpha-value>)",
                "vp-brand-2": "rgb(from var(--vp-c-brand-2) r g b / <alpha-value>)",
                "vp-brand-3": "rgb(from var(--vp-c-brand-3) r g b / <alpha-value>)",
                "vp-alternate-1": "rgb(from var(--vp-c-alternate-1) r g b / <alpha-value>)",
                "vp-alternate-2": "rgb(from var(--vp-c-alternate-2) r g b / <alpha-value>)",
                "vp-alternate-3": "rgb(from var(--vp-c-alternate-3) r g b / <alpha-value>)",
                "vp-brand-soft": "rgb(from var(--vp-c-brand-soft) r g b / <alpha-value>)",
                "vp-border-1": "rgb(from var(--vp-input-border-color) r g b / <alpha-value>)",
                "vp-switch-1": "rgb(from var(--vp-input-switch-bg-color) r g b / <alpha-value>)",
                "mntm-yellow-1": "rgb(from var(--mntm-yellow-1) r g b / <alpha-value>)",
                "mntm-yellow-2": "rgb(from var(--mntm-yellow-2) r g b / <alpha-value>)",
                "mntm-yellow-3": "rgb(from var(--mntm-yellow-3) r g b / <alpha-value>)",
                "vp-border": "rgb(from var(--vp-c-border) r g b / <alpha-value>)",
                "vp-divider": "rgb(from var(--vp-c-divider) r g b / <alpha-value>)",
                "vp-bg": "rgb(from var(--vp-c-bg) r g b / <alpha-value>)",
                "vp-elv": "rgb(from var(--vp-c-bg-elv) r g b / <alpha-value>)",
                "vp-soft": "rgb(from var(--vp-c-bg-soft) r g b / <alpha-value>)",
                "vp-dark": "rgb(from var(--vp-c-bg-dark) r g b / <alpha-value>)",
                "vp-default-soft": "rgb(from var(--vp-c-bg-default-soft) r g b / <alpha-value>)",
                "vp-soft-mute": "rgb(from var(--vp-c-bg-soft-mute) r g b / <alpha-value>)",
                "vp-gray-soft": "rgb(from var(--vp-c-bg-gray-soft) r g b / <alpha-value>)",
                "vp-neutral": "rgb(from var(--vp-c-neutral) r g b / <alpha-value>)",
                "vp-neutral-inverse": "rgb(from var(--vp-c-neutral-inverse) r g b / <alpha-value>)",
                "flipper-fill": "#fe8a2b",
            },
        },
    },
};
