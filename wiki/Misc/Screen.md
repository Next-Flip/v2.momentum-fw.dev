---
title: Screen
description: "Settings for the Flipper Zero's screen (Display Mode, RGB Backlight, LCD LEDs, etc.)"
head:
    - - meta
      - name: "description"
        content: "Settings for the Flipper Zero's screen (Display Mode, RGB Backlight, LCD LEDs, etc.)"
    - - meta
      - property: "og:title"
        content: "Screen | Momentum Firmware"
    - - meta
      - property: "og:description"
        content: "Settings for the Flipper Zero's screen (Display Mode, RGB Backlight, LCD LEDs, etc.)"
    - - meta
      - property: "og:image"
        content: "https://momentum-fw.dev/og.png"
    - - meta
      - property: "og:url"
        content: "https://momentum-fw.dev/wiki/Misc/Screen"
    - - meta
      - name: "twitter:title"
        content: "Screen | Momentum Firmware"
    - - meta
      - name: "twitter:description"
        content: "Settings for the Flipper Zero's screen (Display Mode, RGB Backlight, LCD LEDs, etc.)"
    - - meta
      - name: "twitter:image"
        content: "https://momentum-fw.dev/og.png"
---

# Screen

The Screen settings allow you to customize the visual properties of your Flipper Zero display. These settings can be found by pressing `UP` on the Desktop and navigating to `MNTM > Misc > Screen`.

## Display Mode

### [Dark Mode](Screen#Dark-Mode)

Toggle dark mode. Complete inversion of the UI colors.

- `OFF`<sup><em id="default"> Default </em></sup>: Light mode
- `ON`: Dark mode

### [Left Handed](Screen#Left-Handed)

Toggle left handed mode. Flips the entire UI 180 degrees clockwise.

- `OFF`<sup><em id="default"> Default </em></sup>: Right handed
- `ON`: Left handed

## RGB Settings

> [!WARNING]
> These settings require a backlight hardware mod to your Flipper Zero. We do not have a guide for that here but you can find them elsewhere. Only attempt this if you know what you are doing.

### [RGB Backlight](Screen#RGB-Backlight)

<br/>

<ScreenColorImage src="https://github.com/user-attachments/assets/805bfd6b-34ba-4d24-b769-e6c24207b4e5" width="200" align="right"/>

Toggle the RGB backlight on your Flipper Zero. Enabling it without an RGB backlight hardware mod installed will not damage Flipper, but it will cause confusion as the brightness control will not work and the screen will not be illuminated anymore until disabled; for this reason this setting is initially locked and a warning message will be shown when attempting to enable it:

- `OFF`<sup><em id="default"> Default </em></sup>: Disabled
- `ON`: Enabled

### [LCD LED 1](Screen#LCD-LED-1)

### [LCD LED 2](Screen#LCD-LED-2)

### [LCD LED 3](Screen#LCD-LED-3)

### [Rainbow LCD](Screen#Rainbow-LCD)

### [Rainbow Speed](Screen#Rainbow-Speed)

### [Rainbow Interval](Screen#Rainbow-Interval)

### [Rainbow Saturation](Screen#Rainbow-Saturation)

<style scoped>
img {
    filter: saturate(0) brightness(200%) contrast(200%);
}
.dark img {
    filter: saturate(100%) brightness(100%) contrast(100%);
}
</style>