---
title: SubGHz
description: "Settings for the Flipper Zero's SubGHz radio"
head:
    - - meta
      - name: "description"
        content: "Settings for the Flipper Zero's SubGHz radio"
    - - meta
      - property: "og:title"
        content: "SubGHz | Momentum Firmware"
    - - meta
      - property: "og:description"
        content: "Settings for the Flipper Zero's SubGHz radio"
    # - - meta
    #   - property: "og:image"
    #     content: "https://momentum-fw.dev/og/subghz.png"
    - - meta
      - property: "og:url"
        content: "https://momentum-fw.dev/wiki/Protocols/SubGHz"
    - - meta
      - name: "twitter:title"
        content: "SubGHz | Momentum Firmware"
    - - meta
      - name: "twitter:description"
        content: "Settings for the Flipper Zero's SubGHz radio"
    # - - meta
    #   - name: "twitter:image"
    #     content: "https://momentum-fw.dev/og/subghz.png"
---

# SubGHz

The SubGHz settings allow you to configure various options for the SubGHz radio module in your Flipper Zero. These settings can be found by pressing `UP` on the Desktop and navigating to `MNTM > Protocols > SubGHz`.

## SubGHz Freqs

### [Use Defaults](SubGHz#Use-Defaults)

Toggle between default and custom frequency configuration.

- `OFF`: Use custom frequency configuration
- `ON`<sup><em id="default"> Default </em></sup>: Use factory default frequencies

### [Static Freqs](SubGHz#Static-Freqs)

Configure static frequencies for SubGHz operation.

- `Static Freq`: View list of configured static frequencies
  - `None`: No static frequencies configured
- `Remove Static Freq`: Remove a static frequency from the list
- `Add Static Freq`: Add a new static frequency to the list. Opens numeric keyboard: "Use kHz values, like `433920`".

### [Hopper Freqs](SubGHz#Hopper-Freqs)

Configure frequency hopping settings for SubGHz operation.

- `Hopper Freq`: View list of configured hopper frequencies
  - `None`: No hopper frequencies configured
- `Remove Hopper Freq`: Remove a hopper frequency from the list
- `Add Hopper Freq`: Add a new hopper frequency to the list. Opens numeric keyboard: "Use kHz values, like `433920`".

## [Bypass Region Lock](SubGHz#Bypass-Region-Lock)

<!-- TODO: path wants "/wiki/..." because the markdown files are in the wiki folder. Move these out so the path is the same for this and github wiki. -->
> [!WARNING]
> Bypassing region lock may violate regulations in your area. Refer to [Sub-GHz says "Transmission is blocked"](/wiki/Frequently-Asked-Questions#sub-ghz-says-transmission-is-blocked) in the [FAQ](/wiki/Frequently-Asked-Questions) before enabling.

Toggle region lock bypass for SubGHz transmission.

- `OFF`<sup><em id="default"> Default </em></sup>: Region lock enabled (default)
- `ON`: Unlocks [<sup>R</sup>] to 300-350, 378-467, 779-928 MHz

> Enabling this option requires confirmation:
>
> - `No`: Cancel and close dialog
> - `Yes`: Enable region lock bypass

## [Extend Freq Bands](SubGHz#Extend-Freq-Bands)

Enable extended frequency bands for SubGHz operation. _**Locked**: must bypass region lock first._ **Use at own risk, may damage Flipper.**

- `OFF`<sup><em id="default"> Default </em></sup>: Use standard frequency bands
- `ON`: Extends [<sup>R</sup>] to 281-361, 378-481, 749-996228 MHz

## [File Naming Prefix](SubGHz#File-Naming-Prefix)

Configure how file naming prefixes are applied to SubGHz captures.

- `Before`<sup><em id="default"> Default </em></sup>: Place prefix before the filename
- `After`: Place prefix after the filename
