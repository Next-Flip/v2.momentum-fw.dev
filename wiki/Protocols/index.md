---
title: Protocols
description: "Configuration of supported protocols (SubGHz and GPIO pins)"
head:
    - - meta
      - name: "description"
        content: "Configuration of supported protocols (SubGHz and GPIO pins)"
    - - meta
      - property: "og:title"
        content: "Protocols | Momentum Firmware"
    - - meta
      - property: "og:description"
        content: "Configuration of supported protocols (SubGHz and GPIO pins)"
    - - meta
      - property: "og:image"
        content: "https://momentum-fw.dev/og.png"
    - - meta
      - property: "og:url"
        content: "https://momentum-fw.dev/wiki/Protocols"
    - - meta
      - name: "twitter:title"
        content: "Protocols | Momentum Firmware"
    - - meta
      - name: "twitter:description"
        content: "Configuration of supported protocols (SubGHz and GPIO pins)"
    - - meta
      - name: "twitter:image"
        content: "https://momentum-fw.dev/og.png"
prev:
    text: "General"
    link: "/wiki/Interface/General"
next:
    text: "SubGHz"
    link: "/wiki/Protocols/SubGHz"
---

# Protocols

The Protocols settings allow you to configure various communication protocols and hardware interfaces on your Flipper Zero. These settings can be found by pressing `UP` on the Desktop and navigating to `MNTM > Protocols`.

## [SubGHz](SubGHz)

Configure SubGHz radio settings:

- [`Frequency Configuration`](SubGHz#subghz-freqs): Manage radio frequencies
  - [`Use Defaults`](SubGHz#use-defaults): Toggle between default and custom frequency configuration
  - [`Static Freqs`](SubGHz#static-freqs): Configure static frequencies for SubGHz operation
  - [`Hopper Freqs`](SubGHz#hopper-freqs): Configure frequency hopping settings
- [`Advanced Settings`](SubGHz#bypass-region-lock): Configure advanced SubGHz options
  - [`Bypass Region Lock`](SubGHz#bypass-region-lock): Toggle region lock bypass for SubGHz transmission
  - [`Extend Freq Bands`](SubGHz#extend-freq-bands): Enable extended frequency bands. _**Locked**: must bypass region lock first._
- [`File Naming Prefix`](SubGHz#file-naming-prefix): Configure how file naming prefixes are applied

## [GPIO](GPIO)

Configure GPIO pin assignments for external connections:

- [`CC1101 SPI`](GPIO#cc1101-spi): Configure pin assignment for CC1101 SubGHz radio
- [`HRF24 SPI`](GPIO#hrf24-spi): Configure pin assignment for HRF24 radio module
- [`ESP32/8266 UART`](GPIO#esp32-8266-uart): Configure pins for ESP32 or ESP8266 WiFi modules
- [`NMEA GPS UART`](GPIO#nmea-gps-uart): Configure pins for GPS modules with NMEA output
