---
title: File Browser
description: "Customization of the file browser (Archive)"
head:
    - - meta
      - name: "description"
        content: "Customization of the file browser (Archive)"
    - - meta
      - property: "og:title"
        content: "File Browser | Momentum Firmware"
    - - meta
      - property: "og:description"
        content: "Customization of the file browser (Archive)"
    # - - meta
    #   - property: "og:image"
    #     content: "https://momentum-fw.dev/og/file-browser.png"
    - - meta
      - property: "og:url"
        content: "https://momentum-fw.dev/wiki/Interface/File-Browser"
    - - meta
      - name: "twitter:title"
        content: "File Browser | Momentum Firmware"
    - - meta
      - name: "twitter:description"
        content: "Customization of the file browser (Archive)"
    # - - meta
    #   - name: "twitter:image"
    #     content: "https://momentum-fw.dev/og/file-browser.png"
---

# File Browser

The File Browser settings allow you to customize how files and folders are displayed and interacted with on your Flipper Zero. These settings can be found by pressing `UP` on the Desktop and navigating to `MNTM > Interface > File Browser`.

---

### [Display Options](File-Browser#Display-Options)

Configure how files are displayed:

### [Folders Above Files](File-Browser#Folders-Above-Files)

- `OFF`: Mix folders and files by name
- `ON` <sup><em id="default"> Default </em></sup> : Show directories at the top of the list

### [Show Hidden Files](File-Browser#Show-Hidden-Files)

- `OFF` <sup><em id="default"> Default </em></sup> : Hide files starting with "."
- `ON`: Display files starting with "."

### [Show Internal Tab](File-Browser#Show-Internal-Tab)

- `OFF` <sup><em id="default"> Default </em></sup> : Hide internal storage tab
- `ON`: Show internal storage tab

### [Show Path](File-Browser#Show-Path)

Display current directory path in the statusbar:

- `OFF` <sup><em id="default"> Default </em></sup> : Hide path
- `Current`: Show current folder name
- `Brief`: Show abbreviated path (e.g. `/ext/a/e/...`)
- `Full`: Show full path (e.g. `/ext/apps_data/esp_flasher/...`)

## [Favorite Timeout](File-Browser#Favorite-Timeout)

Set how long the favorite items will be emulated / sent for when clicked:

- `OFF` <sup><em id="default"> Default </em></sup> : Disable timeout, emulate forever
- Configurable timeout in seconds
- Only affects the quick-access Favorites menu in Archive (press DOWN from Desktop)
