---
layout: home
title: Momentum Firmware
description: "Feature-rich, stable and customizable\nFirmware for Flipper Zero"

head:
    - - meta
      - name: "description"
        content: "Feature-rich, stable and customizable\nFirmware for Flipper Zero"

hero:
    tagline: "Feature-rich, stable and customizable\nFirmware for Flipper Zero"

features:
    - title: Asset Packs
      details: Easily install animations, icons and font themes, without recompiling. Pick from dozens of community packs, or make your own.
      icon:
          src: "/svg/palette.svg"
    - title: FindMy, Bad KB & BLE Spam
      details: The most complete and advanced suite of Bluetooth tools to run payloads remotely, prank others nearby, or track your lost Flipper.
      icon:
          src: "/svg/bluetooth.svg"
    - title: Countless Protocols
      details: Many protocols integrated into SubGHz (weather, pocsag, tpms, ...), GPS SubDriving, and some rolling code support. NFC cards too.
      icon:
          src: "/svg/wave.svg"
    - title: New Interface
      details: Largely redesigned interface with 8 main menu styles, control center with quick toggles, and most advanced file browser/manager.
      icon:
          src: "/svg/interface.svg"
    - title: Momentum Settings
      details: A powerful app to tweak just about everything. You can configure Asset Packs, Main Menu, File Browser, GPIO Pins, VGM Options and more.
      icon:
          src: "/svg/toggle.svg"
    - title: Enhanced JS Scripting
      details: The largest JavaScript module set (USBDisk, Storage, GUI, BLE, SubGHz) to create workflows and scripts. No C programming required.
      icon:
          src: "/svg/js.svg"
---

<div class="mntm-h3">Compare to other Firmware</div>

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

<sup id="fn1">1. Official Firmware supports some rolling code receivers, but can't send captured signals. Custom Firmwares can (at your own risk).</sup>

<sup id="fn2">2. Official Firmware needs manual setup for FindMy Flipper; Custom Firmwares enable it automatically at startup.</sup>

<sup id="fn3">3. These Firmwares add extra Bad KB options in Bad USB, as proposed to Official Firmware in PR <a href="https://github.com/flipperdevices/flipperzero-firmware/pull/4136" target="_blank" rel="noopener noreferrer">4136</a>.</sup>

<sup id="fn4">4. Partional functionality, less options in the "CFW Settings" management app.</sup>

<sup id="fn5">5. Different format (manifest_xyz.txt) that only supports animations, not icons and fonts.</sup>

</div>
