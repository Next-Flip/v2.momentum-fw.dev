# Installation

This page covers the different methods for installing Momentum firmware on your Flipper Zero.

> [!WARNING]
> Make sure [qFlipper](https://github.com/qFlipper/qFlipper/releases) is closed when using [Web Updater](https://momentum-fw.dev/update/) or [Flipper Lab/App](https://lab.flipper.net/), and vice versa. Only use one installation method at a time.

### Back up your data

No, you will not lose any data installing Momentum or any other firmware on your Flipper Zero. Your data is stored *externally* on the `SD card`, not on the Flipper Zero's internal storage. However, it's always a good idea to back up your data before installing a new firmware, just in case.

> [!CAUTION]
> The `Backup` and `Restore` options in [qFlipper](https://github.com/qFlipper/qFlipper/releases)'s `Advanced Controls` tab DO NOT backup your saved files! They only backup the settings contained in the (hidden) `.int` folder. See below for viable alternatives to save what you actually care about.

There are multiple ways you could backup your important files from Flipper's SD card:
1. Open [qFlipper](https://github.com/qFlipper/qFlipper/releases), switch to the `File manager` tab, go through folders manually and save files/folders you want to keep to your computer.
2. Take out the SD card from Flipper, plug it into your computer, copy some/all files from the SD to the computer.
3. Any other method of "imaging" the FatFs partition from the SD card (Google it!).

## Installation Methods

There are 4 methods to install Momentum. We recommend using the **Web Updater**, but you can choose whichever method you prefer.

### [Web Updater (Browser)](Installation#Web-Updater-Browser)

The simplest method for installing Momentum firmware:

1. Open the [Web Updater](https://momentum-fw.dev/update)
2. Click `Connect` and select your Flipper from the list
3. Click `Flash` and wait for the update to complete

---

### [Flipper Lab/App (Browser/Mobile)](Installation#Flipper-LabApp-BrowserMobile)

Install directly from your browser or mobile device:

#### Desktop

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
