---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  tagline: "功能丰富、稳定且可定制的\nFlipper Zero 固件"
  image:
    dark: /banners/logo_dark_zh.png
    light: /banners/logo_light_zh.png
    alt: Momentum Firmware

features:
  - title: 资源包
    details: 轻松安装动画、图标和字体主题，无需重新编译。从数十个社区资源包中选择，或制作自己的资源包。
    icon:
      src: "/svg/palette.svg"
  - title: FindMy、Bad KB 和 BLE 垃圾信息
    details: 最完整和先进的蓝牙工具套件，可远程运行负载、恶搞附近的人或追踪丢失的 Flipper。
    icon:
      src: "/svg/bluetooth.svg"
  - title: 无数协议
    details: 许多协议集成到 SubGHz（天气、pocsag、tpms 等）、GPS SubDriving 和一些滚动码支持。还有 NFC 卡。
    icon:
      src: "/svg/wave.svg"
  - title: 新界面
    details: 大幅重新设计的界面，具有 8 种主菜单样式、带快速切换的控制中心，以及最先进的文件浏览器/管理器。
    icon:
      src: "/svg/interface.svg"
  - title: Momentum 设置
    details: 一个强大的应用程序，可以调整几乎所有内容。您可以配置资源包、主菜单、文件浏览器、GPIO 引脚、VGM 选项等。
    icon:
      src: "/svg/toggle.svg"
  - title: 增强的 JS 脚本
    details: 最大的 JavaScript 模块集（USBDisk、Storage、GUI、BLE、SubGHz）用于创建工作流和脚本。无需 C 编程。
    icon:
      src: "/svg/js.svg"
---

<div class="mntm-h2">与其他固件比较</div>

<div class="full-width-table">

|功能|[&nearr;&nbsp;OFW](https://github.com/flipperdevices/flipperzero-firmware)|[&nearr;&nbsp;RogueMaster](https://github.com/RogueMaster/flipperzero-firmware-wPlugins)|[&nearr;&nbsp;Unleashed](https://github.com/DarkFlippers/unleashed-firmware)|Momentum|
|-|:-:|:-:|:-:|:-:|
|稳定更新|<span class="check">&#10003;</span>|&#10007;|<span class="check">&#10003;</span>|<span class="check-last">&#10003;</span>|
|（部分）滚动码支持|&#10033;<sup>1</sup>|<span class="check">&#10003;</span>|<span class="check">&#10003;</span>|<span class="check-last">&#10003;</span>|
|FindMy Flipper|&#10033;<sup>2</sup>|<span class="check">&#10003;</span>|<span class="check">&#10003;</span>|<span class="check-last">&#10003;</span>|
|BLE 垃圾信息|&#10007;|<span class="check">&#10003;</span>|<span class="check">&#10003;</span>|<span class="check-last">&#10003;</span>|
|Bad Keyboard（额外选项）|&#10007;|<span class="check">&#10003;</span><sup>3</sup>|<span class="check">&#10003;</span><sup>2</sup>|<span class="check-last">&#10003;</span>|
|Subdriving（保存 subghz 坐标）|&#10007;|<span class="check">&#10003;</span>|&#10007;|<span class="check-last">&#10003;</span>|
|完全自定义（布局、菜单、按键绑定等）|&#10007;|&#10007;|&#10007;|<span class="check-last">&#10003;</span>|
|管理应用（用于简单配置）|&#10007;|&#10033;<sup>4</sup>|&#10007;|<span class="check-last">&#10003;</span>|
|增强的 RGB 背光模式（完全自定义和彩虹模式）|&#10007;|<span class="check">&#10003;</span>|&#10007;|<span class="check-last">&#10003;</span>|
|欺骗（名称、Mac、序列号）|&#10007;|<span class="check">&#10003;</span>|<span class="check">&#10003;</span>|<span class="check-last">&#10003;</span>|
|改进的安全性（启动锁定、错误密码重置等）|&#10007;|&#10007;|&#10007;|<span class="check-last">&#10003;</span>|
|资源包|&#10007;|&#10033;<sup>5</sup>|&#10007;|<span class="check-last">&#10003;</span>|
|VGM 颜色选项|&#10007;|<span class="check">&#10003;</span>|&#10007;|<span class="check-last">&#10003;</span>|
|增强的等级系统|&#10007;|<span class="check">&#10003;</span>|&#10007;|<span class="check-last">&#10003;</span>|
|文件搜索|&#10007;|&#10007;|&#10007;|<span class="check-last">&#10003;</span>|
|磁盘镜像管理|&#10007;|<span class="check">&#10003;</span>|&#10007;|<span class="check-last">&#10003;</span>|
|改进的错误消息（显示源路径）|&#10007;|&#10007;|&#10007;|<span class="check-last">&#10003;</span>|
|预装外部应用（截至 04.2025）|3|421|226（带 [e] 包）|183|

</div>

<div class="footnotes-container">

<sup>1：官方固件可以配对一些滚动码接收器（比自定义固件少），并且不允许发送在野外捕获的滚动码信号（上面列出的自定义固件允许这样做，但您需要承担使原始遥控器不同步的风险）。</sup>

<sup>2：官方固件可以通过从应用目录安装应用来使用 FindMy Flipper，但它不会在启动时自动启用。自定义固件可以在每次 Flipper 开机时自动启用它，因此只要开机就会一直被追踪。</sup>

<sup>3：这些固件将 Bad KB 作为额外的外部应用，位于应用 > 工具 > Bad KB 中，而不是用 Bad KB 替换默认的 Bad USB 应用。</sup>

<sup>4：部分功能，"CFW 设置"管理应用中的选项较少。</sup>

<sup>5：不同格式（manifest_xyz.txt），仅支持动画，不支持图标和字体</sup>

</div>
