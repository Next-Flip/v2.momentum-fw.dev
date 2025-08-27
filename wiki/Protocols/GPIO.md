---
title: GPIO
description: "Assignment of GPIO pins for external connections"
head:
    - - meta
      - name: "description"
        content: "Assignment of GPIO pins for external connections"
    - - meta
      - property: "og:title"
        content: "GPIO | Momentum Firmware"
    - - meta
      - property: "og:description"
        content: "Assignment of GPIO pins for external connections"
    - - meta
      - property: "og:image"
        content: "https://momentum-fw.dev/og.png"
    - - meta
      - property: "og:url"
        content: "https://momentum-fw.dev/wiki/Protocols/GPIO"
    - - meta
      - name: "twitter:title"
        content: "GPIO | Momentum Firmware"
    - - meta
      - name: "twitter:description"
        content: "Assignment of GPIO pins for external connections"
    - - meta
      - name: "twitter:image"
        content: "https://momentum-fw.dev/og.png"
---

# GPIO Pins

The GPIO settings allow you to configure pin assignments for various external protocols and connections. These settings can be found by pressing `UP` on the Desktop and navigating to `MNTM > Protocols > GPIO Pins`.

## [CC1101 SPI](GPIO#CC1101-SPI)

Pin assignment for CC1101 SubGHz radio communication via SPI.

- `Default 4`<sup><em id="default"> Default </em></sup>: Pin 4
- `Extra 7`: Pin 7

## [HRF24 SPI](GPIO#HRF24-SPI)

Pin assignment for HRF24 radio module communication via SPI.

- `Default 4`<sup><em id="default"> Default </em></sup>: Pin 4
- `Extra 7`: Pin 7

## [ESP32/8266 UART](GPIO#ESP32/8266-UART)

Pin assignment for ESP32 or ESP8266 WiFi modules via UART.

- `Default 13,14`<sup><em id="default"> Default </em></sup>: Pins 13 and 14
- `Extra 15,16`: Pins 15 and 16

## [NMEA GPS UART](GPIO#NMEA-GPS-UART)

Pin assignment for GPS modules that output NMEA data via UART.

- `Default 13,14`<sup><em id="default"> Default </em></sup>: Pins 13 and 14
- `Extra 15,16`: Pins 15 and 16
