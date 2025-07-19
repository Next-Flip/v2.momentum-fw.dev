---
title: Wiki
next:
    text: Frequently Asked Questions
    link: /wiki/FAQ.md
---

<img src="/banners/banner_light.png" alt="Banner" class="dark:hidden" />
<img src="/banners/banner_dark.png" alt="Banner" class="hidden dark:block" />

<!-- TODO: Commented out because we don't need the translations for now -->
<!-- <div class="mntm custom-block"> -->

<!-- You can find this wiki in different languages below. If you want to help us out with localization: [Next-Flip/v2.momentum-fw.dev](https://github.com/Next-Flip/v2.momentum-fw.dev/tree/dev/.vitepress/i18n). -->

<!-- LOCALE_LINKS_START -->
<!-- LOCALE_LINKS_END -->

<!-- </div> -->

<br/>
<br/>

# Momentum Firmware Wiki

This is a comprehensive and explanatory guide to the features and settings specific to Momentum. Settings that are present in [OFW](https://github.com/flipperdevices/flipperzero-firmware) and remain *mostly* the same may not be mentioned here. Refer to the [Comparison table](#compare-to-other-firmware) for a detailed list of features and their individual pages.

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

|Feature|[&nearr;&nbsp;OFW](https://github.com/flipperdevices/flipperzero-firmware)|[&nearr;&nbsp;RogueMaster](https://github.com/RogueMaster/flipperzero-firmware-wPlugins)|[&nearr;&nbsp;Unleashed](https://github.com/DarkFlippers/unleashed-firmware)|Momentum|
|-|:-:|:-:|:-:|:-:|
|Stable Updates|&#10003;|&#10007;|&#10003;|&#10003;|
|(Some) Rolling Code Support|&#10033;<sup>1</sup>|&#10003;|&#10003;|&#10003;|
|FindMy Flipper|&#10033;<sup>2</sup>|&#10003;|&#10003;|&#10003;|
|BLE Spam|&#10007;|&#10003;|&#10003;|&#10003;|
|Bad Keyboard<br>(Extra Options)|&#10007;|&#10003;<sup>3</sup>|&#10003;<sup>3</sup>|&#10003;|
|NFC Type 4<br>(NDEF on NTAG4xx/DESFire)|&#10007;|&#10007;|&#10003;|&#10003;|
|NFC EMV<br>(Only basic card info)|&#10007;|&#10003;|&#10003;|&#10003;|
|Subdriving<br>(Saving coordinates for subghz)|&#10007;|&#10003;|&#10007;|&#10003;|
|Full Customization<br>(Layouts, Menus, Keybinds, etc.)|&#10007;|&#10007;|&#10007;|&#10003;|
|Management App<br>(For easy configuration)|&#10007;|&#10033;<sup>4</sup>|&#10007;|&#10003;|
|Enhanced RGB Backlight modes<br>(Full customization & Rainbow mode)|&#10007;|&#10003;|&#10003;|&#10003;|
|Spoofing<br>(Name, Mac, Serial)|&#10007;|&#10003;|&#10003;|&#10003;|
|Improved Security<br>(Lock on Boot, reset on false pins, etc.)|&#10007;|&#10007;|&#10007;|&#10003;|
|Asset Packs|&#10007;|&#10033;<sup>5</sup>|&#10007;|&#10003;|
|VGM Color Options|&#10007;|&#10003;|&#10007;|&#10003;|
|Enhanced Level System|&#10007;|&#10003;|&#10007;|&#10003;|
|File Search|&#10007;|&#10007;|&#10007;|&#10003;|
|Disk Image Management|&#10007;|&#10003;|&#10007;|&#10003;|
|Improved Error Messages<br>(Showing source path)|&#10007;|&#10007;|&#10007;|&#10003;|
|Preinstalled External Apps<br>(As of 04.2025)|3|421|226 (with [e] pack)|183|

<sup>1: Official Firmware can pair to some rolling code receivers (less than Custom Firmwares), and it does not allow sending rolling code signals captured in the wild (Custom Firmwares listed above allow it at your own risk of de-synchronizing the original remote).</sup>

<sup>2: Official Firmware can use FindMy Flipper by installing the app from the App Catalog, but it will not automatically enable at startup. Custom Firmwares can enable it automatically every time Flipper turns on, so it is always being tracked while turned on.</sup>

<sup>3: These Firmwares include the extra Bad KB configuration options in the Bad USB app since they were proposed to OFW in PR 4136. Technically not Bad KB, but the functionality is there.</sup>

<sup>4: Partional functionality, less options in the "CFW Settings" management app.</sup>

<sup>5: Different format (manifest_xyz.txt) that only supports animations, not icons and fonts</sup>
