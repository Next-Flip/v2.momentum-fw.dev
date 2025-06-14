# Protocols

The Protocols settings allow you to configure various communication protocols and hardware interfaces on your Flipper Zero. These settings can be found by pressing `UP` on the Desktop and navigating to `MNTM > Protocols`.

## [SubGHz](SubGHz.md)

Configure SubGHz radio settings:

- [`Frequency Configuration`](SubGHz.md#subghz-freqs): Manage radio frequencies
  - [`Use Defaults`](SubGHz.md#use-defaults): Toggle between default and custom frequency configuration
  - [`Static Freqs`](SubGHz.md#static-freqs): Configure static frequencies for SubGHz operation
  - [`Hopper Freqs`](SubGHz.md#hopper-freqs): Configure frequency hopping settings
- [`Advanced Settings`](SubGHz.md#bypass-region-lock): Configure advanced SubGHz options
  - [`Bypass Region Lock`](SubGHz.md#bypass-region-lock): Toggle region lock bypass for SubGHz transmission
  - [`Extend Freq Bands`](SubGHz.md#extend-freq-bands): Enable extended frequency bands. Locked**: must bypass region lock first._
- [`File Naming Prefix`](SubGHz.md#file-naming-prefix): Configure how file naming prefixes are applied

## [GPIO](GPIO.md)

Configure GPIO pin assignments for external connections:

- [`CC1101 SPI`](GPIO.md#cc1101-spi): Configure pin assignment for CC1101 SubGHz radio
- [`HRF24 SPI`](GPIO.md#hrf24-spi): Configure pin assignment for HRF24 radio module
- [`ESP32/8266 UART`](GPIO.md#esp32-8266-uart): Configure pins for ESP32 or ESP8266 WiFi modules
- [`NMEA GPS UART`](GPIO.md#nmea-gps-uart): Configure pins for GPS modules with NMEA output
