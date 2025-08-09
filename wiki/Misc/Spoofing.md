---
title: Spoofing
description: "Settings for the Flipper Zero's name and shell color"
head:
    - - meta
      - name: "description"
        content: "Settings for the Flipper Zero's name and shell color"
    - - meta
      - property: "og:title"
        content: "Spoofing | Momentum Firmware"
    - - meta
      - property: "og:description"
        content: "Settings for the Flipper Zero's name and shell color"
    # - - meta
    #   - property: "og:image"
    #     content: "https://momentum-fw.dev/og/spoofing.png"
    - - meta
      - property: "og:url"
        content: "https://momentum-fw.dev/wiki/Misc/Spoofing"
    - - meta
      - name: "twitter:title"
        content: "Spoofing | Momentum Firmware"
    - - meta
      - name: "twitter:description"
        content: "Settings for the Flipper Zero's name and shell color"
    # - - meta
    #   - name: "twitter:image"
    #     content: "https://momentum-fw.dev/og/spoofing.png"
---

# Spoofing

The Spoofing settings allow you to customize your Flipper Zero's display name and shell color shown in the [Flipper app](https://github.com/flipperdevices/Flipper-iOS-App). These settings can be found by pressing `UP` on the Desktop and navigating to `MNTM > Misc > Spoofing`.

## [Flipper Name](Spoofing#Flipper-Name)

How your Flipper Zero is identified, such as in the Flipper mobile app, [Flipper Lab](https://lab.flipper.net/), web serial and on the device itself. (e.g. Name: `"MNTM"`, Linux Serial: `"/dev/serial/by-id/usb-Flipper_Devices_Inc._MNTM_flip_MNTM-if00"`, macOS Serial: `"/dev/cu.usbmodemflip_MNTM1"`)

Currently it affects:
- Bluetooth device name
- Bluetooth MAC address (3 bytes of Flipper ID + 3 bytes of ASCII from custom name)
- USB device name
- Serial number (8 bytes of ASCII from custom name)

Because of this, when changing Flipper Name you will typically need to unpair and reconnect in the Flipper mobile app.

`8` characters max.

<sup>Leave blank for real name unique to your Flipper</sup>

## [Shell Color](Spoofing#Shell-Color)

The displayed shell color of your Flipper Zero in the Flipper app and [Flipper Lab](https://lab.flipper.net/):

- `Real`<sup><em id="default"> Default </em></sup>: The default color of your Flipper Zero
- `Black`: Black shell
- `White`: White shell
- `Transparent`: Limited Transparent shell

The shell color is also advertised publicly over Bluetooth, any nearby device can detect it without connecting (for example [Wall Of Flippers](https://github.com/K3YOMI/Wall-of-Flippers)).
