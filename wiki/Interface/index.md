---
title: Interface
description: "Customization of the interface (Desktop, Main Menu, Lockscreen, etc.)"
head:
    - - meta
      - name: "description"
        content: "Customization of the interface (Desktop, Main Menu, Lockscreen, etc.)"
    - - meta
      - property: "og:title"
        content: "Interface | Momentum Firmware"
    - - meta
      - property: "og:description"
        content: "Customization of the interface (Desktop, Main Menu, Lockscreen, etc.)"
    - - meta
      - property: "og:image"
        content: "https://momentum-fw.dev/og.png"
    - - meta
      - property: "og:url"
        content: "https://momentum-fw.dev/wiki/Interface"
    - - meta
      - name: "twitter:title"
        content: "Interface | Momentum Firmware"
    - - meta
      - name: "twitter:description"
        content: "Customization of the interface (Desktop, Main Menu, Lockscreen, etc.)"
    - - meta
      - name: "twitter:image"
        content: "https://momentum-fw.dev/og.png"
prev:
    text: "Community Asset Packs"
    link: "/wiki/Assets/Community-Asset-Packs"
next:
    text: "Graphics"
    link: "/wiki/Interface/Graphics"
---

# Interface

The Interface settings allow you to customize the visual appearance and behavior of your Flipper Zero. These settings can be found by pressing `UP` on the Desktop and navigating to `MNTM > Interface`.

## [Graphics](Graphics.md)

Customize animations and visual themes through Asset Packs:

- [`Asset Pack`](Graphics.md#asset-pack): Load custom animations, icons, and fonts
- [`Anim Speed`](Graphics.md#anim-speed): Control playback speed (25-300%)
- [`Cycle Anims`](Graphics.md#cycle-anims): Set animation change intervals
- [`Unlock Anims`](Graphics.md#unlock-anims): Toggle special unlock effects

## [Main Menu](Mainmenu.md)

Configure your main menu appearance and content:

- [`Menu Style`](Mainmenu.md#menu-style): Choose from 9 different menu layouts
- [`Reset Menu`](Mainmenu.md#reset-menu): Restore default configuration
- [`Add App`](Mainmenu.md#add-app): Add new items to your menu
- [`Move App`](Mainmenu.md#move-app): Rearrange the order of apps in your menu
- [`Remove App`](Mainmenu.md#remove-app): Delete apps from your menu

## [Lock Screen](Lockscreen.md)

Set up security and lock screen behavior:

- [`Lock on Boot`](Lockscreen.md#lock-on-boot): Controls whether your Flipper locks automatically when powered on
- [`Format on Bad PINs`](Lockscreen.md#format-on-bad-pins): Automatically formats device after 10 incorrect PIN attempts
- [`Allow USB RPC while locked`](Lockscreen.md#allow-usb-rpc-while-locked): Control USB connectivity while locked
- [`Allow BLE RPC while locked`](Lockscreen.md#allow-ble-rpc-while-locked): Control Bluetooth connectivity while locked
- [`Allow Poweroff`](Lockscreen.md#allow-poweroff): Control power options while locked
- [`Lockscreen Elements`](Lockscreen.md#lockscreen-elements): Configure info and visual elements on the lockscreen
    - [`Info`](Lockscreen.md#info): Configure info on the lockscreen
        - [`Show Time`](Lockscreen.md#info): Toggle time display
        - [`Show Seconds`](Lockscreen.md#info): Include seconds in time display
        - [`Show Date`](Lockscreen.md#info): Display current date
    - [`Visual`](Lockscreen.md#visual): Customize lockscreen appearance
        - [`Show Statusbar`](Lockscreen.md#visual): Toggle visibility of entire statusbar
        - [`Unlock Prompt`](Lockscreen.md#visual): Show the `Press UP to unlock!` prompt
        - [`Transparent`](Lockscreen.md#visual): Allow asset pack animation visibility through lockscreen

## [Status Bar](Statusbar.md)

Customize the top status bar:

- [`Battery Icon`](Statusbar.md#battery-icon): Choose battery display style
  - [`Battery Styles`](Statusbar.md#battery-icon): Available battery styles
- [`Show Clock`](Statusbar.md#show-clock): Toggle time display
- [`Show Icons`](Statusbar.md#show-icons): Toggle status icons
  - [`Status Icons`](Statusbar.md#show-icons): Table of all status icons and their meanings
- [`Bar Borders`](Statusbar.md#bar-borders): Toggle border around statusbar elements
- [`Bar Background`](Statusbar.md#bar-background): Toggle statusbar "ribbon cable" design background

## [File Browser](File-Browser.md)

Adjust file browsing experience:

- [`Display Options`](File-Browser.md#display-options)
  - [`Folders Above Files`](File-Browser.md#folders-above-files): Sort directory display
  - [`Show Hidden Files`](File-Browser.md#show-hidden-files): Toggle hidden file visibility
  - [`Show Internal Tab`](File-Browser.md#show-internal-tab): Toggle internal storage
  - [`Show Path`](File-Browser.md#show-path): Configure path display
- [`Favorite Timeout`](File-Browser.md#favorite-timeout): Set quick-access menu duration

## [General](General.md)

Settings that apply generally to the flippers look and feel.

- [`Text Scroll`](General.md#text-scroll): The scroll type for all overflow text (Archive, Main Menu, Settings, etc.).
- [`Clock Midnight Format`](General.md#clock-midnight-format): How the clock displays 12 AM.
- [`Popup Overlay`](General.md#popup-overlay): Toggle popup overlay
