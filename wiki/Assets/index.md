---
title: Asset Packs
description: "Guide on what asset packs are and how to install or create them"
head:
    - - meta
      - name: "description"
        content: "Guide on what asset packs are and how to install or create them"
    - - meta
      - property: "og:title"
        content: "Asset Packs | Momentum Firmware"
    - - meta
      - property: "og:description"
        content: "Guide on what asset packs are and how to install or create them"
    - - meta
      - property: "og:image"
        content: "https://momentum-fw.dev/og.png"
    - - meta
      - property: "og:url"
        content: "https://momentum-fw.dev/wiki/Assets"
    - - meta
      - name: "twitter:title"
        content: "Asset Packs | Momentum Firmware"
    - - meta
      - name: "twitter:description"
        content: "Guide on what asset packs are and how to install or create them"
    - - meta
      - name: "twitter:image"
        content: "https://momentum-fw.dev/og.png"
prev:
    text: Installation
    link: /wiki/Installation
next:
    text: Community Asset Packs
    link: /wiki/Assets/Community-Asset-Packs
---

# What are Asset Packs?

Asset Packs are a feature exclusive to Momentum Firmware (and its predecessor Xtreme Firmware) that allows you to load custom Animation and Icon sets without recompiling the firmware or messing with manifest.txt files (as a user). Here you can find info on how to install Asset Packs and also how to make your own.

> [!TIP]
> Edits to this page have been pieced together by [pr3's changes](https://github.com/the1anonlypr3/flipper-community-wiki/commit/df844239b118c72918a375e367c7edc17c3b3f1b) to the "[Flipper Zero Asset Creation Tools Guide](https://flipper.wiki/tutorials/asset_creation/asset_creation_guide/)" on the [Flipper Community Wiki](https://flipper.wiki/), and more detailed information can be found there.

## [How to install Asset Packs](/wiki/Assets#how-to-install-asset-packs)

Installing Asset Packs is quite easy and straightforward. First, make sure you're on an updated version of Momentum before you begin, Asset Packs were added in v40! Then, find some packs to install (we have a channel in our [Discord](https://discord.gg/afTC8Eenr4) where you can find some) or make your own (see below). Once you have some packs to install:

1. Open [qFlipper](https://github.com/flipperdevices/qFlipper) and navigate to `SD Card` and into `asset_packs`; if you do not see this folder, try [reinstalling the firmware](/wiki/Installation), or create it yourself.
2. `SD/asset_packs` (or `/ext/asset_packs`) is where all Asset Packs are stored. Simply unzip your packs and upload the folders here.
&nbsp;&nbsp;&nbsp;&nbsp;<sub>If you did this correctly, you should see `SD/asset_packs/PackName/Anims` and/or
`SD/asset_packs/PackName/Icons`.</sub>
3. Now simply open the Momentum Settings app (from the home screen press `UP` and then `Momentum Settings`) and select the asset pack you want. When you back out, Flipper will restart and your animations and icons will use the ones from the selected pack!

## [How Asset Packs Work](/wiki/Assets#how-asset-packs-work)

Before we begin, it's better to understand a little on how they work. Asset Packs are made of 2 parts: `Anims` and `Icons`.

### Animations

Animations use the standard and already well documented animation format, so this will be just a quick recap with the key differences mentioned.

The basic animation structure is:

```bash
SD/ (or /ext in File Browser)
    |-asset_packs/
        |-PackName/
            |-Anims/
                |-ExampleAnim/
                    |-frame_0.bm
                    |-frame_1.bm
                    |...
                    |-meta.txt
                |-AlsoExample/
                    |-frame_0.bm
                    |-frame_1.bm
                    |...
                    |-meta.txt
                |...
                |-manifest.txt
            |-Icons/
                |...
```

`ExampleAnim` and `AlsoExample` are the individual animations, they contain the animation frames compiled as `frame_x.bm` (this is a special format Flipper uses, it can't understand `.png` but only raw pixel data which is what `.bm` is). Each animation has its own `meta.txt`, which contains information such as image width and height, frame rate, duration and so on. Next to all the animations you have `manifest.txt` which tells Flipper when and how to show each animation with values like level and butthurt (mood) constraints and weight (random chance weight).

Again, this is all fairly standard Flipper animation stuff, there are plenty of tutorials on YouTube. The key differences with the Asset Pack animation system are:

- They go in `SD/asset_packs/PackName/Anims` instead of `SD/dolphin`.
- Momentum has up to level 30, so make sure to update your manifest.txt accordingly!

#### meta.txt

The `meta.txt` file controls how individual animations behave:

```bash
Filetype: Flipper Animation
Version: 1

Width: 128
Height: 64
Passive frames: 5
Active frames: 0
Frames order: 0 1 2 3 4
Active cycles: 0
Frame rate: 1
Duration: 3600
Active cooldown: 0

Bubble slots: 0
```

- <sup><em id="required"></em></sup> **Filetype**: The filetype of the file. (Always `Flipper Animation`)
- <sup><em id="required"></em></sup> **Version**: The version of the file. (Always `1`)
- <sup><em id="required"></em></sup> **Width**: The width of the animation.
- <sup><em id="required"></em></sup> **Height**: The height of the animation.
- <sup><em id="required"></em></sup> **Passive frames**: Frames that loop continuously when the animation is idle
- <sup><em id="optional"></em></sup> **Active frames**: Frames that play when Flipper is interacted with (less commonly used)
- <sup><em id="required"></em></sup> **Frames order**: The sequence in which frames play. If a frame appears multiple times (e.g., `0 0 1 1 2 2`), count each instance in your passive/active frames count
- <sup><em id="optional"></em></sup> **Active cycles**: The number of times the animation can play before it stops.
- <sup><em id="required"></em></sup> **Frame rate**: Frames per second (typically 1-2 for Flipper animations)
- <sup><em id="required"></em></sup> **Duration**: How long the animation can play in seconds (3600 = 1 hour)
- <sup><em id="optional"></em></sup> **Active cooldown**: The amount of time in seconds before the animation can play again (0 = no cooldown)
- <sup><em id="optional"></em></sup> **Bubble slots**: Number of speech bubbles (most people draw these manually instead)

> [!TIP]
> For more in depth information on passive vs. active frames and the `meta.txt` file in general, see [Kuronons' meta settings guide](https://flipper.wiki/tutorials/Animation_guide_meta/Meta_settings_guide/).

#### manifest.txt

The `manifest.txt` file controls when and how often animations appear:

```bash
Filetype: Flipper Animation Manifest
Version: 1

Name: ExampleAnim
Min butthurt: 0
Max butthurt: 14
Min level: 1
Max level: 3
Weight: 8

Name: AlsoExample
Min butthurt: 0
Max butthurt: 14
Min level: 1
Max level: 3
Weight: 8
```

- <sup><em id="required"></em></sup> **Filetype**: The filetype of the file. (Always `Flipper Animation Manifest`)
- <sup><em id="required"></em></sup> **Version**: The version of the file. (Always `1`)
- <sup><em id="required"></em></sup> **Name**: The name of the animation. (Must match the animation names in `Anims/`)
- <sup><em id="required"></em></sup> **Min/Max butthurt**: Controls which mood states the animation appears in:
  - `0-4`: Happy mood
  - `5-9`: Okay mood  
  - `10-14`: Angry mood
- <sup><em id="required"></em></sup> **Min/Max level**: Controls which Flipper levels the animation appears at. For Momentum, you can use up to level 30! -> [Misc/Dolphin](/wiki/Misc/Dolphin)
- <sup><em id="required"></em></sup> **Weight**: The relative probability of this animation playing compared to others. Higher weight = more frequent. Use the same weight for all animations if you want equal chances.

You can list multiple animations in one `manifest.txt` by repeating the Name/Min/Max/Weight block.

### Icons

With icons there are quite a few differences and issues we had to solve. In particular, they are usually compiled along with the firmware, so loading them dynamically required a special system. Also, for the same reason, some metadata for the icons now has to be stored along with them, since it's not in the firmware itself. And finally, icons can both be static and animated, both with different solutions to the above problems.

##### Static icons

The `.bm` format does not include image width and height, with animations that is stored in `meta.txt`, so for static icons we made a special format: `.bmx`, which is `[ int32 width ] + [ int32 height ] + [ standard .bm pixel data ]`, but this is handled by the packer (see [below](#cool-i-read-all-that-but-how-do-i-make-one)), so don't worry about it.

##### Animated icons

Animated icons are structured similarly to animations, but are used like icons. They live next to other static icons, but are stored as `.bm` sequences. To avoid storing redundant data with `.bmx`, we kept the frames as `.bm` and instead opted for a `meta` file (no extension), which consists of `[ int32 width ] + [ int32 height ] + [ int32 frame_rate ] + [ int32 frame_count ]`, but once again don't fret as this is handled by the packer (see below).

#### Structure

Other than those few differences above, we kept the same icon naming scheme and structure, so this should look familiar otherwise.

The basic icon structure is:

```bash
SD/ (or /ext in File Browser)
    |-asset_packs/
        |-PackName/
            |-Anims/
                |...
            |-Icons/
                |-Animations/
                    |-Levelup_128x64/
                        |-frame_0.bm
                        |-frame_1.bm
                        |...
                        |-meta
                    |...
                |-Passport/
                    |-passport_happy_46x49.bmx
                    |-passport_128x64.bmx
                    |...
                |-RFID/
                    |-RFIDDolphinReceive_97x61.bmx
                    |-RFIDDolphinSend_97x61.bmx
                    |...
                |...
```

Which is the same you can find in the firmware source code, in [`assets/icons`](https://github.com/Next-Flip/Momentum-Firmware/tree/dev/assets/icons). The key differences/things to remember with the Asset Pack icon system are:

- Not all icons are supported (see below).
- The pixel numbers in the filename are ignored, they are there purely because of the original Flipper icon names and for a hint as to how you should size your icons, but they are not enforced.
- We kept the original naming scheme and file structure for compatibility, but the original setup is quite bad, so bear with us. Some icons in subfolders (like `SubGhz/Scanning_123x52`) are used in other unrelated apps/places.
- Some icons in the official firmware have different versions with different numbers to indicate the flipper level they target. Since our system has so many levels, we decided to keep it simple and remove the level progression from icons. For example `Passport/passport_happy1_46x49` becomes `Passport/passport_happy_46x49` and `Animations/Levelup1_128x64` becomes `Animations/Levelup_128x64`.

This system supports **all** internal assets!

## [Create your own Asset Packs](/wiki/Assets#create-your-own-asset-packs)

All the .bm and .bmx struggles are dealt with by the packer system, which is in `scripts/asset_packer.py`; when making your Asset Pack you will only be working with .png images and meta.txt/manifest.txt/frame_rate files. As explained above, packs are made of 2 parts, Anims and Icons, but you don't have to include both - if you only include Anims, then the default SFW Icons will be used, and viceversa. You have 2 options: make standalone Asset Packs (recommended), or build them along with the firmware.

### Recommended Software

Before creating your Asset Pack, you'll need pixel art software. Popular choices include:

- **[Aseprite](https://aseprite.org)** - The community favorite for pixel art and animation. Built-in tools for frames, keybinds, and exporting.
- **[Piskel](https://www.piskelapp.com/)** - Free web-based option with good animation tools and frame management.
- **[EzGIF](https://ezgif.com)** - Web tool for converting GIFs to Flipper animations. Great for beginners.
- **[GIMP](https://www.gimp.org/downloads/)** - Free open-source alternative to Photoshop.

For detailed comparisons, see [pr3's asset creation tools guide](https://flipper.wiki/tutorials/asset_creation/asset_creation_guide/#i-need-software).

### Compilation Tools

Several tools can compile your PNG frames to Flipper's `.bm` format:

- **[Flipper Animation Manager](https://github.com/Ooggle/FlipperAnimationManager)** - GUI tool with previewer and one-click compiling. Easiest option for beginners.
- **[asset_packer.py](https://github.com/Next-Flip/Momentum-Firmware/blob/dev/scripts/asset_packer.py)** - Our command-line script detailed below in the [Standalone Asset Packs](#standalone-asset-packs) section. Fast and efficient once set up.
- **[Flipper Build Tool (FBT)](https://github.com/flipperdevices/flipperzero-firmware/blob/dev/documentation/fbt.md)** - Required for Official Firmware development.

> [!WARNING]
> Avoid using `img2fbm` - it's unreliable and can create corrupt frames.

#### Standalone Packs

- (First time only) Install Python (3.10 recommended, but not required), then open a terminal/console and run `pip3 install Pillow heatshrink2`.
- Make a NEW folder anywhere on your system where you'll put all your source asset packs. If you're not sure, the Desktop is always a good place, so make the NEW folder there.
- Inside the NEW folder make ANOTHER folder with the name of your Asset Pack (less than 32 characters). Inside THAT one, make the Anims and/or Icons folders.
&nbsp;&nbsp;&nbsp;&nbsp;<sub>If you used the desktop, you should have `Desktop/AssetPacks/PackName/Anims` and/or `Desktop/AssetPacks/PackName/Icons`.</sub>
- Fill those folders appropriately, referring to the information and structure above, BUT:
    - Images should **ALL** be `.png`.
    - For animations you add `manifest.txt` and `meta.txt` files.
    - For animated icons you add `frame_rate` files.
    - Static icons don't need extra configuration.

    <sub>Here is an example of what it should look like:</sub>

  ![Asset Pack Example Structure](https://user-images.githubusercontent.com/49810075/218661220-cdc750bf-1eee-488e-a194-47371529112c.png)

- Copy the `scripts/asset_packer.py` file into your source packs folder, right next to your asset packs.
- Run the [asset_packer.py](https://github.com/Next-Flip/Momentum-Firmware/blob/dev/scripts/asset_packer.py) script. You might be able to double click it, if not run in console with `python asset_packer.py`.
- It will explain and ask for confirmation, so press Enter.
- When it's done (it's usually quite quick) you will have a `asset_packs` folder right next to your source packs. Inside it you will see your Asset Pack, but in compiled form (.png images swapped for .bm and .bmx).
- Now upload the packed packs from that folder onto your flipper in `SD/asset_packs`.
- Done! Just select it from the Momentum Settings app now. And if you're generous share your (packed) asset pack in #asset-packs on discord.

#### Build with Firmware

- Follow the steps above, but use `assets/packs` as your source packs folder.
- Packing is integrated with fbt, so just run `./fbt flash_usb_full` or `./fbt updater_package` to compile the firmware, pack the packs and update your Flipper.

## [Troubleshooting](/wiki/Assets#troubleshooting)

If your animations aren't working, you can debug them using [lab.flipper.net's CLI](https://lab.flipper.net/cli) (make sure qFlipper is closed first). Enter one of these commands to view logs:

- `log error` - Shows only errors (lowest verbosity)
- `log debug` - Recommended, shows a good amount of detail
- `log trace` - Shows everything (can be overwhelming)

### Error Messages

**"Can't upload animation described in manifest: PackName"**:

- Incorrect file structure (double-check folder names and paths)
- Corrupt or incorrectly formatted `.bm` frames (try recompiling with a different tool)
- Issues in your `meta.txt` or `manifest.txt` files (verify all required fields are present)

**"Error loading animation: frames order"**:

- Check your `meta.txt` frame order field
- If you list a frame more than once (e.g., `0 0 1 1 2 2`), count each instance in your `Passive frames:` or `Active frames:` count - that's 6 frames, not 3
- Use [Ant Renamer](https://www.antp.be/software/renamer) for bulk renaming if your frame numbering is incorrect

**"Failed to load animation bubbles"**:

- Verify bubble settings in your `meta.txt` file
- Most creators manually draw dialogue instead of using bubbles
- See [Kuronons' guide](https://flipper.wiki/tutorials/Animation_guide_meta/Meta_settings_guide/) for detailed bubble usage
