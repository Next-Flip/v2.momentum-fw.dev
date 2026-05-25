---
title: Installation
description: "Installation methods for Momentum Firmware on your Flipper Zero"
head:
    - - meta
      - name: "description"
        content: "Installation methods for Momentum Firmware on your Flipper Zero"
    - - meta
      - property: "og:title"
        content: "Installation | Momentum Firmware"
    - - meta
      - property: "og:description"
        content: "Installation methods for Momentum Firmware on your Flipper Zero"
    - - meta
      - property: "og:image"
        content: "https://momentum-fw.dev/og.png"
    - - meta
      - property: "og:url"
        content: "https://momentum-fw.dev/wiki/Installation"
    - - meta
      - name: "twitter:title"
        content: "Installation | Momentum Firmware"
    - - meta
      - name: "twitter:description"
        content: "Installation methods for Momentum Firmware on your Flipper Zero"
    - - meta
      - name: "twitter:image"
        content: "https://momentum-fw.dev/og.png"
prev:
    text: FAQ
    link: /wiki/FAQ
next:
    text: Asset Packs
    link: /wiki/Assets
---

# Installation

This page covers the different methods for installing Momentum firmware on your Flipper Zero.

> [!WARNING]
> Make sure [qFlipper](https://github.com/flipperdevices/qFlipper) is closed when using [Web Updater](https://momentum-fw.dev/update/) or [Flipper Lab/App](https://lab.flipper.net/), and vice versa. Only use one installation method at a time.

### Back up your data

No, you will not lose any data installing Momentum or any other firmware on your Flipper Zero. Your data is stored *externally* on the `SD card`, not on the Flipper Zero's internal storage. However, it's always a good idea to back up your data before installing a new firmware, just in case.

> [!CAUTION]
> The `Backup` and `Restore` options in [qFlipper](https://github.com/flipperdevices/qFlipper)'s `Advanced Controls` tab DO NOT backup your saved files! They only backup the settings contained in the (hidden) `.int` folder. See below for viable alternatives to save what you actually care about.

There are multiple ways you could backup your important files from Flipper's SD card:
1. Open [qFlipper](https://github.com/flipperdevices/qFlipper), switch to the `File manager` tab, go through folders manually and save files/folders you want to keep to your computer.
2. Take out the SD card from Flipper, plug it into your computer, copy some/all files from the SD to the computer.
3. Any other method of "imaging" the FatFs partition from the SD card (Google it!).

## Installation Methods

There are 4 methods to install Momentum. We recommend using the **Web Updater**, but you can choose whichever method you prefer.

### [Web Updater](Installation#Web-Updater-Browser)

1. Open the [Web Updater](https://momentum-fw.dev/update) (https://momentum-fw.dev/update)
2. Click `Connect` (or `Web Serial` / `Bluetooth` if both are available) Select your Flipper from the list if needed.
3. Select the `Channel` and `Version` you want to install, or upload a `.tgz` file
3. Click `Install` and wait for the update to complete (do not disconnect your Flipper)

#### Browser Compatibility

The Web Updater requires your browser to support the [Web Serial API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API) (for USB) or [Web Bluetooth API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API) (for Bluetooth). Below is a simplified compatibility overview.

<table>
<thead>
<tr>
    <th>Browser</th>
    <th>Web Serial (USB)</th>
    <th>Web Bluetooth</th>
    <th>Notes</th>
</tr>
</thead>
<tbody>
<tr>
    <td>Chrome (desktop)</td>
    <td align="left"><span class="check">&#10003;</span> (89+)</td>
    <td align="left"><span class="warn">&#9888;</span> (56+, partial)</td>
    <td>On Linux, Bluetooth requires enabling experimental features in <code>chrome://flags</code></td>
</tr>
<tr>
    <td>Edge</td>
    <td align="left"><span class="check">&#10003;</span> (89+)</td>
    <td align="left"><span class="warn">&#9888;</span> (79+, partial)</td>
    <td></td>
</tr>
<tr>
    <td>Opera</td>
    <td align="left"><span class="check">&#10003;</span> (75+)</td>
    <td align="left"><span class="warn">&#9888;</span> (43+, partial)</td>
    <td></td>
</tr>
<tr>
    <td>Firefox</td>
    <td align="left"><span class="check">&#10003;</span> (151+)</td>
    <td align="left" class="x-dim">&#10007;</td>
    <td>Web Bluetooth not implemented — use USB</td>
</tr>
<tr>
    <td>Safari (macOS)</td>
    <td align="left" class="x-dim">&#10007;</td>
    <td align="left" class="x-dim">&#10007;</td>
    <td>Neither API implemented — use qFlipper or the Flipper Mobile App</td>
</tr>
<tr>
    <td>Chrome (Android)</td>
    <td align="left"><span class="warn">&#9888;</span> (138+, partial)</td>
    <td align="left"><span class="check">&#10003;</span> (56+)</td>
    <td>Serial only works via Bluetooth RFCOMM emulation — not USB. Use <b>Bluetooth</b> mode on Android</td>
</tr>
<tr>
    <td>Samsung Internet</td>
    <td align="left" class="x-dim">&#10007;</td>
    <td align="left"><span class="check">&#10003;</span> (6.0+)</td>
    <td>Mirrors Chrome for Android — Bluetooth only, no USB Serial</td>
</tr>
<tr>
    <td>Opera (Android)</td>
    <td align="left"><span class="warn">&#9888;</span> (91+, partial)</td>
    <td align="left"><span class="check">&#10003;</span> (43+)</td>
    <td>Mirrors Chrome for Android — Bluetooth only, partial USB Serial</td>
</tr>
<tr>
    <td>Firefox (Android)</td>
    <td align="left" class="x-dim">&#10007;</td>
    <td align="left" class="x-dim">&#10007;</td>
    <td>Neither API implemented</td>
</tr>
<tr>
    <td>Any browser (iOS)</td>
    <td align="left" class="x-dim">&#10007;</td>
    <td align="left" class="x-dim">&#10007;</td>
    <td>Apple requires all iOS browsers to use WebKit — neither API is available on iOS</td>
</tr>
</tbody>
</table>

> <sup>_Last updated: 2026-05-24_</sup>
>
> For the most up-to-date and detailed compatibility information, see the [MDN Web Serial API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API#browser_compatibility) and [MDN Web Bluetooth API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API#browser_compatibility) documentation, or [Can I use](https://caniuse.com/).

<br/>

> [!TIP]
> **USB Serial is strongly recommended over Bluetooth** for firmware updates. USB transfers firmware in a fraction of the time — Bluetooth can take significantly longer, particularly for larger releases, because of how the browser communicates over BLE.
>
> **Why is Web Bluetooth slow?** Every write goes through the browser's internal process boundary before it reaches the OS Bluetooth stack, adding overhead on top of what's already a low-bandwidth radio link. This is why the [Flipper Mobile App](#flipper-lab-app) is noticeably faster for Bluetooth updates — it talks to the Bluetooth stack natively, without the browser in between. Use the Web Updater over Bluetooth only when USB isn't available and the mobile app isn't an option.

<br/>

_**If you are having trouble connecting, pay attention to the messages shown:**_

<table>
<tbody>
<tr>
    <td><b>Flipper Locked</b><br><br>You may have <b>Allow USB RPC While Locked</b> option <b>OFF</b> in <b>MNTM > Interface > Lockscreen</b>.</td>
    <td><img src="/wiki/flipper-locked.png" width="600" /></td>
</tr>
<tr>
    <td><b>Not Connected</b><br><br>Click <b>Connect</b> and make sure that nothing else is using your Flipper.</td>
    <td><img src="/wiki/not-connected.png" width="600" /></td>
</tr>
<tr>
    <td><b>Connection Error</b><br><br>You have something open that's blocking the serial connection, you need to close it!</td>
    <td><img src="/wiki/connection-error.png" width="600" /></td>
</tr>
<tr>
    <td><b>Unsupported Browser</b><br><br>Your browser does not support Web Serial, you need to switch to one that does.</td>
    <td><img src="/wiki/unsupported-browser.png" width="600" /></td>
</tr>
</tbody>
</table>

---

### [Flipper Lab/App](Installation#Flipper-LabApp-BrowserMobile)

#### Browser

1. Open the [latest release page](https://github.com/Next-Flip/Momentum-Firmware/releases/latest)
2. Click the `☁️ Flipper Lab/App (chrome/mobile)` link
3. Click `Connect` and select your Flipper from the list
4. Click `Install` and wait for the update to complete

#### Mobile

1. Make sure you have the [Flipper Mobile App](https://docs.flipper.net/mobile-app) installed and paired
2. Open the [latest release page](https://github.com/Next-Flip/Momentum-Firmware/releases/latest)
3. Click the `☁️ Flipper Lab/App (chrome/mobile)` link
4. Accept the prompt to open the link in the Flipper Mobile App
5. Confirm to proceed with the install and wait for the update to complete

> [!TIP]
> If you need to install over Bluetooth and don't have access to a USB connection, the **mobile app is the better choice** over the Web Updater's Bluetooth mode. The app uses your phone's native Bluetooth stack directly, making it noticeably faster than Web Bluetooth in the browser.

---

### [qFlipper Package (.tgz)](Installation#qFlipper-Package-tgz)

Install using the official qFlipper application:

1. Download the qFlipper package (.tgz) from the [latest release page](https://github.com/Next-Flip/Momentum-Firmware/releases/latest)
2. Open [qFlipper](https://flipperzero.one/update) and connect your Flipper
3. Click `Install from file`
4. Select the .tgz you downloaded and wait for the update to complete

---

### [Zipped Archive (.zip)](Installation#Zipped-Archive-zip)

Manual installation via SD card:

1. Download the zipped archive (.zip) from the [latest release page](https://github.com/Next-Flip/Momentum-Firmware/releases/latest)
2. Extract the archive. This is now your new Firmware folder
3. Open [qFlipper](https://flipperzero.one/update), head to `SD/update` and simply move the firmware folder there
4. On the Flipper, hit the `Arrow Down` button, this will get you to the file menu. In there simply search for your updates folder
5. Inside that folder, select the Firmware you just moved onto it, and run the file that's simply called `Update`


<style scoped>
.dark .vp-doc tbody tr:nth-child(2n) {
    background-color: transparent !important;
}
.warn {
    color: var(--vp-c-warning-1, #d97706);
    font-weight: bold;
}
</style>