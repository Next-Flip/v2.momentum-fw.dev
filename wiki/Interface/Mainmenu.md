# Main Menu

The Main Menu settings allow you to customize the appearance and functionality of your Flipper Zero's main menu. These settings can be found by pressing `UP` on the Desktop and navigating to `MNTM > Interface > Mainmenu`.

## [Menu Style](Mainmenu#Menu-Style)

Main menus are custom made interfaces that are used for launching apps or files, and potentially showing useful info like time, battery, or the flipper's device name.

Momentum Firmware comes with 9 different styles to choose from, but anyone can design their own and create a [PR](https://github.com/Next-Flip/Momentum-Firmware/pulls) to have it included in the firmware!

<table>
<thead>
<tr>
    <th>Style</th>
    <th>Info</th>
    <th>Preview</th>
    <th>Author</th>
</tr>
</thead>
<tbody>
<tr>
    <td><b>List</b><br>Traditional list view of Flipper Zero with simple navigation</td>
    <td align="center" class="x-dim">&#10007;</td>
    <td><ScreenColorImage src="https://github.com/user-attachments/assets/959945e2-1a53-4cde-b8df-9db1c50a67f4" width="200" /></td>
    <td>-</td>
</tr>
<tr>
    <td><b>Wii</b><br>Nintendo Wii inspired horizontal menu</td>
    <td align="center" class="x-dim">&#10007;</td>
    <td><ScreenColorImage src="https://github.com/user-attachments/assets/67a460b2-3cbf-4941-bdad-f3c850a815a5" width="200" /></td>
    <td><a href="https://github.com/Next-Flip/Momentum-Firmware/commit/f1ec78deb3c03a8ab1c27a7a8c6e9222241ab48d">Willy-JL</a></td>
</tr>
<tr>
    <td><b>DSi <sup><em id="default"> Default </em></sup> </b><br>Nintendo DSi inspired grid layout</td>
    <td align="center" class="x-dim">&#10007;</td>
    <td><ScreenColorImage src="https://github.com/user-attachments/assets/86a2c6f4-3caf-4e59-b25a-814cb9131105" width="200" /></td>
    <td><a href="https://github.com/Next-Flip/Momentum-Firmware/commit/49e4f4f24697efb6f56da90b2d104636852aa05b">Willy-JL</a></td>
</tr>
<tr>
    <td><b>PS4</b><br>PlayStation 4 inspired horizontal menu</td>
    <td align="center"><span class="check">&#10003;</span></td>
    <td><ScreenColorImage src="https://github.com/user-attachments/assets/bc489f0b-ebaa-4366-adea-1439429c6bd6" width="200" /></td>
    <td><a href="https://github.com/Next-Flip/Momentum-Firmware/commit/cef4a004f74fecca7556ea7aeb947897a1f392b5">Willy-JL</a></td>
</tr>
<tr>
    <td><b>Vertical</b><br>The only vertical scrolling menu</td>
    <td align="center" class="x-dim">&#10007;</td>
    <td><ScreenColorImage src="https://github.com/user-attachments/assets/0a46c4bd-2e6f-4f1b-963d-0ef98468e09a" width="200" /></td>
    <td><a href="https://github.com/Next-Flip/Momentum-Firmware/commit/ae86e6b6379e795d4fa45d7b4229f355b6933968">Willy-JL</a></td>
</tr>
<tr>
    <td><b>C64</b><br>Commodore 64 retro inspired menu</td>
    <td align="center"><span class="check">&#10003;</span></td>
    <td><ScreenColorImage src="https://github.com/user-attachments/assets/1d636ef1-6dbb-4322-a48b-8af8b2e5b6db" width="200" /></td>
    <td><a href="https://github.com/Next-Flip/Momentum-Firmware/commit/01dcf16c05e57de001d9db4610024ee03315dcd0">Sil333033</a></td>
</tr>
<tr>
    <td><b>Compact</b><br>Minimal compact style with tiny text</td>
    <td align="center" class="x-dim">&#10007;</td>
    <td><ScreenColorImage src="https://github.com/user-attachments/assets/29f9be7c-afa2-467d-8b42-5a469ff00156" width="200" /></td>
    <td><a href="https://github.com/Next-Flip/Momentum-Firmware/commit/09986b33a7ff1912a1167f2427eddc8adfe82e6f">MatthewKuKanich</a></td>
</tr>
<tr>
    <td><b>MNTM</b><br>The MNTM style menu</td>
    <td align="center"><span class="check">&#10003;</span></td>
    <td><ScreenColorImage src="https://github.com/user-attachments/assets/92550158-ca27-4566-b03c-52a53055625e" width="200" /></td>
    <td><a href="https://github.com/Next-Flip/Momentum-Firmware/pull/18/commits/0b814717403c3e1920cd98173cb9cb511142fb0b">MatthewKuKanich</a></td>
</tr>
<tr>
    <td><b>CoverFlow</b><br>Horizontal CoverFlow style</td>
    <td align="center" class="x-dim">&#10007;</td>
    <td><ScreenColorImage src="https://github.com/user-attachments/assets/baa4cee4-f70b-42e1-9c1c-f1a947afeb72" width="200" /></td>
    <td><a href="https://github.com/Next-Flip/Momentum-Firmware/pull/314">CodyTolene</a></td>
</tr>
</tbody>
</table>

## [Reset Menu](Mainmenu#Reset-Menu)

Restores the main menu to it's default set of apps.

## App Management

Add, remove, and rearrange the content of your main menu (apps/files/folders). There are 8 apps by default: `SubGHz`, `RFID`, `NFC`, `Infrared`, `GPIO`, `iButton`, `Bad KB`, `U2F`.

### [Add App](Mainmenu#Add-App)

Add new items to your menu:

- `Main App`: System applications
- `External App`: Apps from SD card that you install yourself

### [Move App](Mainmenu#Move-App)

Rearrange the order of apps in your menu:

- Select app to move (1/8)
- Use `LEFT/RIGHT` to position

### [Remove App](Mainmenu#Remove-App)

Delete apps from your menu:

- Select app to remove (1/8)
- Confirm removal by pressing `OK`

<style scoped>
img {
    image-rendering: pixelated;
}
</style>