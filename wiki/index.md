---
title: Wiki
description: "Comprehensive guide to the features and settings specific to Momentum Firmware"
head:
    - - meta
      - name: "description"
        content: "Comprehensive guide to the features and settings specific to Momentum Firmware"
    - - meta
      - property: "og:title"
        content: "Wiki | Momentum Firmware"
    - - meta
      - property: "og:description"
        content: "Comprehensive guide to the features and settings specific to Momentum Firmware"
    # - - meta
    #   - property: "og:image"
    #     content: "https://momentum-fw.dev/og/wiki.png"
    - - meta
      - property: "og:url"
        content: "https://momentum-fw.dev/wiki/"
    - - meta
      - name: "twitter:title"
        content: "Wiki | Momentum Firmware"
    - - meta
      - name: "twitter:description"
        content: "Comprehensive guide to the features and settings specific to Momentum Firmware"
    # - - meta
    #   - name: "twitter:image"
    #     content: "https://momentum-fw.dev/og/wiki.png"
next:
    text: Frequently Asked Questions
    link: /wiki/faq.md
---

<img src="/banners/wiki_light.png" alt="banner" class="dark:hidden banner" />
<img src="/banners/wiki_dark.png" alt="banner" class="hidden dark:block banner_dark" />

<!-- TODO: Commented out because we don't need the translations for now -->
<!-- <div class="mntm custom-block"> -->

<!-- You can find this wiki in different languages below. If you want to help us out with localization: [Next-Flip/v2.momentum-fw.dev](https://github.com/Next-Flip/v2.momentum-fw.dev/tree/dev/.vitepress/i18n). -->

<!-- LOCALE_LINKS_START -->
<!-- LOCALE_LINKS_END -->

<!-- </div> -->

<br/>

# Momentum Firmware Wiki

This is a comprehensive and explanatory guide to the features and settings specific to Momentum. Settings that are present in [OFW](https://github.com/flipperdevices/flipperzero-firmware) and remain _mostly_ the same may not be mentioned here. Refer to the [Comparison table](#compare-to-other-firmware) for a detailed list of features and their individual pages.

### Quick Links

- [`Installation Methods`](Installation.md): Different ways to install Momentum
- [`Asset Packs Guide`](Assets/Asset-Packs.md): Guide on what asset packs are and how to install them
- [`Community Asset Packs List`](Assets/Community-Asset-Packs.md): Full list of community made asset packs
- [`Frequently Asked Questions`](FAQ.md): Most of the common issues and their solutions

### Momentum Settings

A run down of all the settings native to Momentum. These settings are found by pressing `UP` on the `Desktop` and opening the `MNTM` app (The **M** logo).

- [`Interface`](Interface/Interface.md): Customization of the interface (Desktop, Main Menu, Lockscreen, etc.)
- [`Protocols`](Protocols/Protocols.md): Configuration of supported protocols (SubGHz and GPIO pins)
- [`Misc`](Misc/Misc.md): Miscellaneous device identity settings

## Why Momentum?

Momentum is a based on the [Official Firmware](https://github.com/flipperdevices/flipperzero-firmware) for [Flipper Zero](https://flipperzero.one/), and includes most of the awesome features from [Unleashed](https://github.com/DarkFlippers/unleashed-firmware). It is a direct continuation of the Xtreme firmware, built by the same (and only) developers who made that project special.

The goal of this firmware is to constantly push the bounds of what is possible with Flipper Zero, driving the innovation of many new groundbreaking features, while maintaining the easiest and most customizable user experience of any firmware. Fixing bugs promptly and ensuring a stable and compatible system is also of our utmost importance.

### Compare to other Firmware

<br/>

<div class="full-width-table">

<!-- prettier-ignore-start -->
|Feature|[OFW](https://github.com/flipperdevices/flipperzero-firmware)|[RogueMaster](https://github.com/RogueMaster/flipperzero-firmware-wPlugins)|[Unleashed](https://github.com/DarkFlippers/unleashed-firmware)|Momentum|
|-|:-:|:-:|:-:|:-:|
|Stable Updates|<span class="check">&#10003;</span>|&#10007;|<span class="check">&#10003;</span>|<span class="check-last">&#10003;</span>|
|(Some) Rolling Code Support|&#10033;<sup><a href="#fn1" id="ref1">1</a></sup>|<span class="check">&#10003;</span>|<span class="check">&#10003;</span>|<span class="check-last">&#10003;</span>|
|FindMy Flipper|&#10033;<sup><a href="#fn2" id="ref2">2</a></sup>|<span class="check">&#10003;</span>|<span class="check">&#10003;</span>|<span class="check-last">&#10003;</span>|
|BLE Spam|&#10007;|<span class="check">&#10003;</span>|<span class="check">&#10003;</span>|<span class="check-last">&#10003;</span>|
|Bad Keyboard (Extra Options)|&#10007;|<span class="check">&#10003;</span><sup><a href="#fn3" id="ref3">3</a></sup>|<span class="check">&#10003;</span><sup><a href="#fn3" id="ref3b">3</a></sup>|<span class="check-last">&#10003;</span>|
|NFC Type 4 (NDEF on NTAG4xx/DESFire)|&#10007;|&#10007;|<span class="check">&#10003;</span>|<span class="check-last">&#10003;</span>|
|NFC EMV (Only basic card info)|&#10007;|<span class="check">&#10003;</span>|<span class="check">&#10003;</span>|<span class="check-last">&#10003;</span>|
|Subdriving (Saving coordinates for subghz)|&#10007;|<span class="check">&#10003;</span>|&#10007;|<span class="check-last">&#10003;</span>|
|Full Customization (Layouts, Menus, Keybinds, etc.)|&#10007;|&#10007;|&#10007;|<span class="check-last">&#10003;</span>|
|Management App (For easy configuration)|&#10007;|&#10033;<sup><a href="#fn4" id="ref4">4</a></sup>|&#10007;|<span class="check-last">&#10003;</span>|
|Enhanced RGB Backlight modes (Full customization & Rainbow mode)|&#10007;|<span class="check">&#10003;</span>|<span class="check">&#10003;</span>|<span class="check-last">&#10003;</span>|
|Spoofing (Name, Mac, Serial)|&#10007;|<span class="check">&#10003;</span>|<span class="check">&#10003;</span>|<span class="check-last">&#10003;</span>|
|Improved Security (Lock on Boot, reset on false pins, etc.)|&#10007;|&#10007;|&#10007;|<span class="check-last">&#10003;</span>|
|Asset Packs|&#10007;|&#10033;<sup><a href="#fn5" id="ref5">5</a></sup>|&#10007;|<span class="check-last">&#10003;</span>|
|VGM Color Options|&#10007;|<span class="check">&#10003;</span>|&#10007;|<span class="check-last">&#10003;</span>|
|Enhanced Level System|&#10007;|<span class="check">&#10003;</span>|&#10007;|<span class="check-last">&#10003;</span>|
|File Search|&#10007;|&#10007;|&#10007;|<span class="check-last">&#10003;</span>|
|Disk Image Management|&#10007;|<span class="check">&#10003;</span>|&#10007;|<span class="check-last">&#10003;</span>|
|Improved Error Messages (Showing source path)|&#10007;|&#10007;|&#10007;|<span class="check-last">&#10003;</span>|
|Preinstalled External Apps (As of 04.2025)|3|421|226 (with [e] pack)|183|
<!-- prettier-ignore-end -->

</div>

<div class="footnotes-container">

<sup id="fn1">1. OFW supports some rolling code receivers, but can't send captured signals. Custom Firmwares can (at your own risk).</sup>

<sup id="fn2">2. OFW needs manual setup for FindMy Flipper; Custom Firmwares enable it automatically at startup.</sup>

<sup id="fn3">3. These Firmwares add extra Bad KB options in Bad USB, as proposed to OFW in PR <a href="https://github.com/flipperdevices/flipperzero-firmware/pull/4136" target="_blank" rel="noopener noreferrer">4136</a>.</sup>

<sup id="fn4">4. Partional functionality, less options in the "CFW Settings" management app.</sup>

<sup id="fn5">5. Different format (manifest_xyz.txt) that only supports animations, not icons and fonts.</sup>

</div>