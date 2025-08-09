---
title: Statusbar
description: "Customization of the statusbar (Desktop and Lockscreen)"
head:
    - - meta
      - name: "description"
        content: "Customization of the statusbar (Desktop and Lockscreen)"
    - - meta
      - property: "og:title"
        content: "Statusbar | Momentum Firmware"
    - - meta
      - property: "og:description"
        content: "Customization of the statusbar (Desktop and Lockscreen)"
    # - - meta
    #   - property: "og:image"
    #     content: "https://momentum-fw.dev/og/statusbar.png"
    - - meta
      - property: "og:url"
        content: "https://momentum-fw.dev/wiki/Interface/Statusbar"
    - - meta
      - name: "twitter:title"
        content: "Statusbar | Momentum Firmware"
    - - meta
      - name: "twitter:description"
        content: "Customization of the statusbar (Desktop and Lockscreen)"
    # - - meta
    #   - name: "twitter:image"
    #     content: "https://momentum-fw.dev/og/statusbar.png"
---

# Statusbar

The Statusbar settings allow you to customize the appearance of your Flipper Zero's status bar (Desktop and Lockscreen). These settings can be found by pressing `UP` on the Desktop and navigating to `MNTM > Interface > Statusbar`.

## [Battery Icon](Statusbar#Battery-Icon)

Choose how battery level is displayed:

<table id="battery-styles">
<tr>
    <th>Setting · Desc</th>
    <th>Preview</th>
</tr>
<tr>
    <td><b>OFF</b><br>Hide battery indicator</td>
    <td><ScreenColorImage src="https://github.com/user-attachments/assets/d3fdd7cc-1773-4a8a-b14a-e3b8a50edbe9" height="43"/></td>
</tr>
<tr>
    <td><b>Bar</b><br>Simple battery bar</td>
    <td><ScreenColorImage src="https://github.com/user-attachments/assets/01b27c75-c130-453b-9908-b7e4a013ad4d" height="43"/></td>
</tr>
<tr>
    <td><b>%</b><br>Percentage only</td>
    <td><ScreenColorImage src="https://github.com/user-attachments/assets/b1e444a1-347f-492c-a9a3-67d8d06021c8" height="43"/></td>
</tr>
<tr>
    <td><b>Inv. %</b><br>Inverted percentage</td>
    <td><ScreenColorImage src="https://github.com/user-attachments/assets/719228f9-8837-4bab-bb10-c6975355ea3f" height="43"/></td>
</tr>
<tr>
    <td><b>Retro 3</b><br>3-segment retro style</td>
    <td><ScreenColorImage src="https://github.com/user-attachments/assets/22c983dd-7cce-45ee-9892-e909063d94de" height="43"/></td>
</tr>
<tr>
    <td><b>Retro 5</b><br>5-segment retro style</td>
    <td><ScreenColorImage src="https://github.com/user-attachments/assets/9308cad3-5d1b-4640-8ef0-c3af69f0e11a" height="43"/></td>
</tr>
<tr>
    <td><b>Bar %</b><sup><em id="default"> Default </em></sup><br>Bar with percentage</td>
    <td><ScreenColorImage src="https://github.com/user-attachments/assets/d0fc4e96-58d1-4464-94bd-cbd3e775b85c" height="43"/></td>
</tr>
</table>

## [Show Clock](Statusbar#Show-Clock)

Toggle time display in statusbar:

- `OFF`<sup><em id="default"> Default </em></sup>: Hide clock
- `ON`: Show clock

## [Show Icons](Statusbar#Show-Icons)

Toggle visibility of status icons:

- `OFF`: Hide all status icons
- `ON`<sup><em id="default"> Default </em></sup>: Show status icons

<table id="status-icons">
<tr>
    <th>Icon · Desc</th>
    <th>Preview</th>
</tr>
<tr>
    <td><b>SD Card Mounted</b><br>SD card is properly mounted</td>
    <td><ScreenColorImage src="https://github.com/user-attachments/assets/63cbd6f9-311b-47d8-98be-5635c59ff3cc" height="43"/></td>
</tr>
<tr>
    <td><b>SD Card Fail</b><br>Not mounted · NoFS · Not accessible · Internal Error </td>
    <td><ScreenColorImage src="https://github.com/user-attachments/assets/bfa0d5d7-2509-4b07-8582-d55b32bf47c8" height="43"/></td>
</tr>
<tr>
    <td><b>Rpc Active (USB)</b><br>Remote Procedure Protocol connection active</td>
    <td><ScreenColorImage src="https://github.com/user-attachments/assets/29b34e79-b951-4721-9b9e-9765ccd0d12a" height="43"/></td>
</tr>
<tr>
    <td><b>Muted</b><br>Stealth mode enabled (sound off)</td>
    <td><ScreenColorImage src="https://github.com/user-attachments/assets/b9444b75-99f4-4721-a3f9-63037413e870" height="43"/></td>
</tr>
<tr>
    <td><b>Hidden Window</b><br>A notification requires attention</td>
    <td><ScreenColorImage src="https://github.com/user-attachments/assets/85153ccf-cdda-45a7-ae5c-4c6f3d3acb8d" height="43"/></td>
</tr>
<tr>
    <td><b>EXP Module Connected</b><br>External module connected via UART</td>
    <td><ScreenColorImage src="https://github.com/user-attachments/assets/3e5036fe-0122-4172-bfda-52f5fdad6381" height="43"/></td>
</tr>
<tr>
    <td><b>Bluetooth Idle</b><br>Bluetooth in advertising state</td>
    <td><ScreenColorImage src="https://github.com/user-attachments/assets/3952090a-bc7f-491c-800a-31a4c93194f8" height="43"/></td>
</tr>
<tr>
    <td><b>Bluetooth Connected</b><br>Successful BT connection to device</td>
    <td><ScreenColorImage src="https://github.com/user-attachments/assets/2f28f74b-ad79-462a-9377-83ce0396574f" height="43"/></td>
</tr>
<tr>
    <td><b>BLE Beacon</b><br>Bluetooth Low Energy beacon active</td>
    <td><ScreenColorImage src="https://github.com/user-attachments/assets/ece52169-e235-4d30-8f4e-0cb3a909b4b9" height="43"/></td>
</tr>
</table>

## [Bar Borders](Statusbar#Bar-Borders)

Toggle border around statusbar elements:

- `OFF`: No borders
- `ON`<sup><em id="default"> Default </em></sup>: Show borders

## [Bar Background](Statusbar#Bar-Background)

Toggle statusbar "ribbon cable" design background:

- `OFF`<sup><em id="default"> Default </em></sup>: Hide background
- `ON`: Show background

<style scoped>
img {
    image-rendering: pixelated;
}
</style>