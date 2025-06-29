---
layout: home

hero:
  tagline: "Feature-rich, stable and customizable\nFirmware for Flipper Zero"
  image:
    dark: /banners/logo_dark.png
    light: /banners/logo_light.png
    alt: Momentum Firmware

features:
  - title: Asset Packs
    details: Easily install of animations, icons and font themes, without recompiling. Pick from dozens of community packs, or make your own.
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

<div class="mntm-h2">Compare to other Firmware</div>

<div class="full-width-table">

|Feature|[&nearr;&nbsp;OFW](https://github.com/flipperdevices/flipperzero-firmware)|[&nearr;&nbsp;RogueMaster](https://github.com/RogueMaster/flipperzero-firmware-wPlugins)|[&nearr;&nbsp;Unleashed](https://github.com/DarkFlippers/unleashed-firmware)|Momentum|
|-|:-:|:-:|:-:|:-:|
|Stable Updates|<span class="check">&#10003;</span>|&#10007;|<span class="check">&#10003;</span>|<span class="check-last">&#10003;</span>|
|(Some) Rolling Code Support|&#10033;<sup>1</sup>|<span class="check">&#10003;</span>|<span class="check">&#10003;</span>|<span class="check-last">&#10003;</span>|
|FindMy Flipper|&#10033;<sup>2</sup>|<span class="check">&#10003;</span>|<span class="check">&#10003;</span>|<span class="check-last">&#10003;</span>|
|BLE Spam|&#10007;|<span class="check">&#10003;</span>|<span class="check">&#10003;</span>|<span class="check-last">&#10003;</span>|
|Bad Keyboard (Extra Options)|&#10007;|<span class="check">&#10003;</span><sup>3</sup>|<span class="check">&#10003;</span><sup>2</sup>|<span class="check-last">&#10003;</span>|
|Subdriving (Saving coordinates for subghz)|&#10007;|<span class="check">&#10003;</span>|&#10007;|<span class="check-last">&#10003;</span>|
|Full Customization (Layouts, Menus, Keybinds, etc.)|&#10007;|&#10007;|&#10007;|<span class="check-last">&#10003;</span>|
|Management App (For easy configuration)|&#10007;|&#10033;<sup>4</sup>|&#10007;|<span class="check-last">&#10003;</span>|
|Enhanced RGB Backlight modes (Full customization & Rainbow mode)|&#10007;|<span class="check">&#10003;</span>|&#10007;|<span class="check-last">&#10003;</span>|
|Spoofing (Name, Mac, Serial)|&#10007;|<span class="check">&#10003;</span>|<span class="check">&#10003;</span>|<span class="check-last">&#10003;</span>|
|Improved Security (Lock on Boot, reset on false pins, etc.)|&#10007;|&#10007;|&#10007;|<span class="check-last">&#10003;</span>|
|Asset Packs|&#10007;|&#10033;<sup>5</sup>|&#10007;|<span class="check-last">&#10003;</span>|
|VGM Color Options|&#10007;|<span class="check">&#10003;</span>|&#10007;|<span class="check-last">&#10003;</span>|
|Enhanced Level System|&#10007;|<span class="check">&#10003;</span>|&#10007;|<span class="check-last">&#10003;</span>|
|File Search|&#10007;|&#10007;|&#10007;|<span class="check-last">&#10003;</span>|
|Disk Image Management|&#10007;|<span class="check">&#10003;</span>|&#10007;|<span class="check-last">&#10003;</span>|
|Improved Error Messages (Showing source path)|&#10007;|&#10007;|&#10007;|<span class="check-last">&#10003;</span>|
|Preinstalled External Apps (As of 04.2025)|3|421|226 (with [e] pack)|183|

</div>

<div class="footnotes-container">

<sup>1: Official Firmware can pair to some rolling code receivers (less than Custom Firmwares), and it does not allow sending rolling code signals captured in the wild (Custom Firmwares listed above allow it at your own risk of de-synchronizing the original remote).</sup>

<sup>2: Official Firmware can use FindMy Flipper by installing the app from the App Catalog, but it will not automatically enable at startup. Custom Firmwares can enable it automatically every time Flipper turns on, so it is always being tracked while turned on.</sup>

<sup>3: These Firmwares include Bad KB as an additional external app, found in Apps > Tools > Bad KB, instead of replacing the default Bad USB app with Bad KB.</sup>

<sup>4: Partional functionality, less options in the "CFW Settings" management app.</sup>

<sup>5: Different format (manifest_xyz.txt) that only supports animations, not icons and fonts</sup>

</div>