---
title: Graphics
description: "Settings for the current Asset Pack"
head:
    - - meta
      - name: "description"
        content: "Settings for the current Asset Pack"
    - - meta
      - property: "og:title"
        content: "Graphics | Momentum Firmware"
    - - meta
      - property: "og:description"
        content: "Settings for the current Asset Pack"
    # - - meta
    #   - property: "og:image"
    #     content: "https://momentum-fw.dev/og/graphics.png"
    - - meta
      - property: "og:url"
        content: "https://momentum-fw.dev/wiki/Interface/Graphics"
    - - meta
      - name: "twitter:title"
        content: "Graphics | Momentum Firmware"
    - - meta
      - name: "twitter:description"
        content: "Settings for the current Asset Pack"
    # - - meta
    #   - name: "twitter:image"
    #     content: "https://momentum-fw.dev/og/graphics.png"
---

# Graphics

The Graphics settings allow you to customize the visual appearance of your Flipper Zero through Asset Packs and animation behaviors. These settings can be found by pressing `UP` on the Desktop and navigating to `MNTM > Interface > Graphics`.

## [Asset Pack](Graphics#Asset-Pack)

Asset Packs are a feature exclusive to Momentum Firmware that allows you to load custom Animations, Icons and Fonts without recompiling the firmware. They function as complete theme packages that can change your Flipper's appearance.

- Navigate to `Asset Pack` to select from any [pre-installed](https://github.com/momentum-firmware/asset-packs) or [community-made](https://momentum-fw.dev/asset-packs) packs.
- Packs are loaded externally from the [SD Card](../File-Browser#SD-Card) at `/ext/asset_packs/*`
- Each pack can contain (all optional):
    - Custom Animations (stored in `Anims/`)
    - Custom Icons (stored in `Icons/`)
    - Custom Fonts (stored in `Fonts/`)

## [Anim Speed](Graphics#Anim-Speed)

Controls the playback speed of all animations:

- Default: 100%
- Range: 25% to 300%
- Adjustable in 25% increments
- Affects all desktop animations

## [Cycle Anims](Graphics#Cycle-Anims)

Determines how often desktop animations change:

- `OFF`: Disable animation cycling
- `Meta.txt`<sup><em id="default"> Default </em></sup>: Use pack's defined timing (if available)
- Time intervals:
    - Short: 15S, 30S
    - Medium: 1M, 2M, 5M, 10M, 15M, 30M
    - Long: 1H, 2H, 6H, 12H, 24H

## [Unlock Anims](Graphics#Unlock-Anims)

Disable dolphin level and mood restrictions for desktop animations:

- `OFF`<sup><em id="default"> Default </em></sup>: Only show eligible animations based on current dolphin level and mood
- `ON`: Show all animations available in current asset pack regardless of level/mood

> This page is only a brief overview of the individual Graphics settings. For more detailed information about installing or creating your own Asset Packs, see our [Asset Pack Page](../Asset-Packs).
