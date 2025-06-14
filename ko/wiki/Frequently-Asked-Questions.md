---
next:
    text: 설치
    link: Installation.md
---

> [!WARNING]
> This documentation is still a work in progress and will contain many more answers to common questions and issues.
>
> If a question you have is not here yet, you can check the [faq](https://discord.gg/juBGZ5fP7H), [general](https://discord.gg/CyZN9JSA4j), [flipper-noobs](https://discord.gg/xJx824rDd9), [help](https://discord.gg/68jcdsPnSx) or any other channels in the [Discord](https://discord.gg/momentum) for solutions.

## Table of Contents

- [What can I do with my Flipper? Ideas?](#what-can-i-do-with-my-flipper-ideas)
- [Will I lose data installing a new version?](#will-i-lose-data-installing-a-new-version)
- [Mainline release or dev build?](#mainline-release-or-dev-build)
- [Flipper says "Update failed"?](#flipper-says-Update-failed)
- [Stuck in "infinite loop" after updating](#stuck-in-infinite-loop-after-updating)
- [Sub-GHz says "Transmission is blocked"?](#sub-ghz-says-transmission-is-blocked)

## [What can I do with my Flipper? Ideas?](#what-can-i-do-with-my-flipper-ideas)

The following are a few creators active all over the Flipper community, OFW and CFW. These content creators provide a wealth of ideas, tutorials, and inspiration for what you can do with your Flipper Zero. They cover everything from basic usage to advanced projects and hacks. And we appreciate their contributions!

1. [Talking Sasquachv](https://www.youtube.com/@TalkingSasquach): He has made Flipper zero beginer tutorials on how to use and set up the Flipper and also on how to create your own animations for the Flipper (aka Asset Packs).

2. [Derek Jamison](https://www.youtube.com/@MrDerekJamison): He is making videos on what you can do with the Flipper and how to program it to do cool things, such as running apps and experimenting with scripts.

3. [Sn0ren](https://www.youtube.com/@sn0ren): He has made a few videos about the Flipper Zero but is mainly interested in Radio signals. The content may give you an idea on what you can do with different signals available to you.

4. [JBlanked](https://www.youtube.com/channel/UC3-HckimiXzcTanzCvWGU4A): He has made videos about Flipper boards and is also the author of several high profile apps for the Flipper.

This should give you enough ideas to get you started with the Flipper and give you inspiration to make and even contribute to the community. You can also take a look around our [Discord](https://discord.gg/momentum) as there are always people sharing personal projects and getting help.

## [Will I lose data installing a new version?](#will-i-lose-data-installing-a-new-version)

No, the firmware is installed to the Flipper's internal storage and all your data is external on the SD card. Your data is unaffected by updates.

## [Mainline release or dev build?](#mainline-release-or-dev-build)

Mainline releases normally follow the update schedule of the upstream firmware ([OFW](https://github.com/flipperdevices/flipperzero-firmware)), and encompass all the features and improvements that have been added along the way. While dev builds are for incremental changes and bug fixes leading up to a full release, and give us time to try new things, they are usually just as stable as the Mainline.

If you are unsure, or want to update less often, the [Mainline release](https://github.com/Next-Flip/Momentum-Firmware/releases) will work just fine.

Release pings for both can be found in these Discord channels: [`#mainline-releases`](https://discord.com/channels/1211622338198765599/1213549820271132802) · [`#dev-builds`](https://discord.com/channels/1211622338198765599/1213020009153167390).

## [Flipper says "Update failed"?](#flipper-says-Update-failed)

Most installation errors stem from unsupported, low quality or incorrectly formatted SD cards. If you are formatting on your pc rather than the Flipper, make sure to use either `exFAT` or `FAT32`.

#### Repair in qFlipper

1. Hold `BACK` + `LEFT` for 5 seconds
2. Connect your Flipper to your computer via USB
3. Open [qFlipper](https://github.com/Next-Flip/qFlipper) and click `Repair`
4. Install Momentum again from the [usual sources](https://github.com/Next-Flip/Momentum-Firmware/wiki/Installation#installation-methods)

#### Format your SD card through the Flipper

1. On the Desktop click `UP`
2. Open `Settings > Storage`
3. Click `Format SD card` <sup><a href="#format-warning">1</a></sup>

## [Stuck in "infinite loop" after updating](#stuck-in-infinite-loop-after-updating)

If your Flipper is stuck in an infinite loop after updating, it may be due to a corrupted SD card or an incompatible files due to a previous installation of another firmware. The bug is still not very well understood at this time, but a simple reformatting should do the trick.

1. Remove the SD card from your Flipper Zero and let it boot
2. Reinsert the SD card
3. Navigate to and run `Settings > Storage > Format SD card` <sup><a href="#format-warning">1</a></sup>
4. Reinstall Momentum from any of our [installation methods](https://github.com/Next-Flip/Momentum-Firmware/wiki/Installation)

## [Sub-GHz says "Transmission is blocked"?](#sub-ghz-says-transmission-is-blocked)

This error has multiple variations, and you should look closely at which error message exactly you are getting:

1. `"Missing region file"` :
    Reinstall Momentum though one of the "online" methods, either [Web Updater](https://github.com/Next-Flip/Momentum-Firmware/wiki/Installation#web-updater-browser), [Flipper Lab/App](https://github.com/Next-Flip/Momentum-Firmware/wiki/Installation#flipper-labapp-browsermobile) or [qFlipper](https://github.com/Next-Flip/Momentum-Firmware/wiki/Installation#qflipper-package-tgz) (specifcally 'install from file'). *The zipped archive method (.tgz/.zip) is "offline", and does not install the region file needed.*

2. `"Outside region range"` :
    Getting this message means the frequency being used is __restricted in your country.__ If you are absolutely sure you are permitted to use it, then you can bypass this error with `MNTM > Protocols > Sub-GHz Bypass Region Lock`.

3. `"Outside default range"` :
    This means the frequency is not officially supported by Flipper. You can force-enable it **<u>at your own risk of potential hardware damage</u>** with `MNTM > Protocols > Sub-GHz Extend Freq Bands`.

4. `"Outside supported range"` :
    This error indicates that the frequency is not supported at all by the Flipper Zero hardware itself. In this case, you cannot bypass it, as it is a hardware limitation.

More info for all these possible errors and what to do can be found in the [SubGHzBypass&Extend documentaton](https://github.com/Next-Flip/Momentum-Firmware/blob/dev/documentation/SubGHzBypass%26Extend.md).

---

<span id="format-warning"><sup>1. **WARNING**: Formatting the SD card deletes all the data on it and you'll need to install again. Refer to the [Backup methods](https://github.com/Next-Flip/Momentum-Firmware/wiki/Installation#back-up-your-data) before proceeding.</sup></span>
