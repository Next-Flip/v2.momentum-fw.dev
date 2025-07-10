---
title: Wiki
next:
    text: Installation
    link: Installation.md
---

![Banner](https://github.com/user-attachments/assets/c9957bc7-3cc8-45aa-b0a7-33d654f2c284)

<div class="mntm custom-block">

您可以在下方找到不同语言版本的维基。如果您想帮助我们进行本地化工作：[Next-Flip/v2.momentum-fw.dev](https://github.com/Next-Flip/v2.momentum-fw.dev/tree/dev/.vitepress/i18n)。

<!-- LOCALE_LINKS_START -->
[English](/wiki) · [한국어](/ko/wiki) · [日本語](/ja/wiki) · [简体中文](/zh/wiki)
<!-- LOCALE_LINKS_END -->

</div>

<br/>

# Momentum Firmware 维基

这是一份关于 Momentum 特有功能和设置的全面说明指南。在 [OFW](https://github.com/flipperdevices/flipperzero-firmware) 中存在且基本保持相同的设置可能不会在此提及。有关详细功能列表及其单独页面，请参阅[对比表](#compare-to-other-firmware)。

### 快速链接

- [`安装方法`](Installation.md)：安装 Momentum 的不同方式
- [`资源包指南`](Assets/Asset-Packs.md)：关于什么是资源包以及如何安装的指南
- [`社区资源包列表`](Assets/Community-Asset-Packs.md)：社区制作的资源包完整列表
- [`常见问题`](Frequently-Asked-Questions.md)：大多数常见问题及其解决方案

### Momentum 设置

Momentum 原生设置概览。这些设置可以通过在`桌面`上按`上`键并打开`MNTM`应用（**M**标志）找到。

- [`界面`](Interface/Interface.md)：界面自定义（桌面、主菜单、锁屏等）
- [`协议`](Protocols/Protocols.md)：支持的协议配置（SubGHz和GPIO引脚）
- [`其他`](Misc/Misc.md)：设备身份相关杂项设置

## 为什么选择 Momentum？

Momentum 基于 [Flipper Zero](https://flipperzero.one/) 的[官方固件](https://github.com/flipperdevices/flipperzero-firmware)，并包含了来自 [Unleashed](https://github.com/DarkFlippers/unleashed-firmware) 的大部分优秀功能。它是 Xtreme 固件的直接延续，由使该项目变得特别的相同（且唯一）开发者构建。

该固件的目标是不断突破 Flipper Zero 的可能性边界，推动许多突破性新功能的创新，同时保持最简单和最具可定制性的用户体验。及时修复错误并确保稳定和兼容的系统也是我们的首要任务。

### 与其他固件对比

|功能|[&nearr;&nbsp;OFW](https://github.com/flipperdevices/flipperzero-firmware)|[&nearr;&nbsp;RogueMaster](https://github.com/RogueMaster/flipperzero-firmware-wPlugins)|[&nearr;&nbsp;Unleashed](https://github.com/DarkFlippers/unleashed-firmware)|Momentum|
|-|:-:|:-:|:-:|:-:|
|稳定更新|&#10003;|&#10007;|&#10003;|&#10003;|
|（部分）滚动码支持|&#10033;<sup>1</sup>|&#10003;|&#10003;|&#10003;|
|FindMy Flipper|&#10033;<sup>2</sup>|&#10003;|&#10003;|&#10003;|
|BLE 垃圾信息|&#10007;|&#10003;|&#10003;|&#10003;|
|Bad Keyboard<br>（额外选项）|&#10007;|&#10003;<sup>3</sup>|&#10003;<sup>2</sup>|&#10003;|
|Subdriving<br>（保存subghz坐标）|&#10007;|&#10003;|&#10007;|&#10003;|
|完全自定义<br>（布局、菜单、按键绑定等）|&#10007;|&#10007;|&#10007;|&#10003;|
|管理应用<br>（便于配置）|&#10007;|&#10033;<sup>4</sup>|&#10007;|&#10003;|
|增强RGB背光模式<br>（完全自定义和彩虹模式）|&#10007;|&#10003;|&#10007;|&#10003;|
|伪装<br>（名称、Mac、序列号）|&#10007;|&#10003;|&#10003;|&#10003;|
|改进的安全性<br>（启动锁定、错误密码重置等）|&#10007;|&#10007;|&#10007;|&#10003;|
|资源包|&#10007;|&#10033;<sup>5</sup>|&#10007;|&#10003;|
|VGM颜色选项|&#10007;|&#10003;|&#10007;|&#10003;|
|增强等级系统|&#10007;|&#10003;|&#10007;|&#10003;|
|文件搜索|&#10007;|&#10007;|&#10007;|&#10003;|
|磁盘镜像管理|&#10007;|&#10003;|&#10007;|&#10003;|
|改进的错误信息<br>（显示源路径）|&#10007;|&#10007;|&#10007;|&#10003;|
|预装外部应用<br>（截至2025年4月）|3|421|226（含[e]包）|183|

<sup>1：官方固件可以配对某些滚动码接收器（少于自定义固件），并且不允许发送在野外捕获的滚动码信号（上述自定义固件允许这样做，但需要自行承担使原始遥控器不同步的风险）。</sup>

<sup>2：官方固件可以通过从应用目录安装应用来使用FindMy Flipper，但不会在启动时自动启用。自定义固件可以在每次Flipper开机时自动启用，因此只要开机就会一直处于被追踪状态。</sup>

<sup>3：这些固件将Bad KB作为额外的外部应用包含在内，位于应用 > 工具 > Bad KB中，而不是用Bad KB替换默认的Bad USB应用。</sup>

<sup>4：部分功能，在"CFW设置"管理应用中的选项较少。</sup>

<sup>5：不同格式（manifest_xyz.txt），仅支持动画，不支持图标和字体</sup>
