---
layout: home

hero:
  tagline: "機能豊富で安定性が高く、カスタマイズ可能な\nFlipper Zero 用ファームウェア"
  image:
    dark: /banners/logo_dark_jp.png
    light: /banners/logo_light_jp.png
    alt: Momentum Firmware

features:
  - title: アセットパック
    details: 再コンパイルなしでアニメーション、アイコン、フォントテーマを簡単にインストールできます。コミュニティ製パックから選ぶか、自作も可能です。
    icon:
      src: "/svg/palette.svg"
  - title: FindMy、Bad KB、BLEスパム
    details: ペイロードの遠隔実行、周囲へのいたずら、Flipperの追跡などに使える、最も高度なBluetoothツール群です。
    icon:
      src: "/svg/bluetooth.svg"
  - title: 多数のプロトコル対応
    details: SubGHz に多くのプロトコル（天気、POCSAG、TPMSなど）、GPSサブドライビング、ローリングコード対応、NFCカードなどを統合。
    icon:
      src: "/svg/wave.svg"
  - title: 新しいインターフェース
    details: 8つのメインメニュースタイル、クイックトグル付きコントロールセンター、進化したファイルブラウザ／マネージャを備えた大幅なUI再設計。
    icon:
      src: "/svg/interface.svg"
  - title: Momentum 設定
    details: アセットパック、メインメニュー、ファイルブラウザ、GPIOピン、VGMオプションなど、あらゆる設定を調整できる強力なアプリ。
    icon:
      src: "/svg/toggle.svg"
  - title: 強化されたJSスクリプト
    details: USBDisk、Storage、GUI、BLE、SubGHzなど最大規模のJavaScriptモジュールで、C言語不要のワークフローやスクリプト作成が可能。
    icon:
      src: "/svg/js.svg"
---

<div class="mntm-h2">他のファームウェアとの比較</div>

<div class="full-width-table">

|機能|[&nearr;&nbsp;OFW](https://github.com/flipperdevices/flipperzero-firmware)|[&nearr;&nbsp;RogueMaster](https://github.com/RogueMaster/flipperzero-firmware-wPlugins)|[&nearr;&nbsp;Unleashed](https://github.com/DarkFlippers/unleashed-firmware)|Momentum|
|-|:-:|:-:|:-:|:-:|
|安定したアップデート|&#10003;|&#10007;|&#10003;|&#10003;|
|（一部）ローリングコード対応|&#10033;<sup>1</sup>|&#10003;|&#10003;|&#10003;|
|FindMy Flipper|&#10033;<sup>2</sup>|&#10003;|&#10003;|&#10003;|
|BLEスパム|&#10007;|&#10003;|&#10003;|&#10003;|
|Bad Keyboard（追加オプション）|&#10007;|&#10003;<sup>3</sup>|&#10003;<sup>2</sup>|&#10003;|
|Subdriving（SubGHz座標の保存）|&#10007;|&#10003;|&#10007;|&#10003;|
|完全なカスタマイズ（レイアウト、メニュー、キー設定など）|&#10007;|&#10007;|&#10007;|&#10003;|
|管理アプリ（簡単な設定）|&#10007;|&#10033;<sup>4</sup>|&#10007;|&#10003;|
|強化されたRGBバックライトモード（完全カスタマイズ & レインボーモード）|&#10007;|&#10003;|&#10007;|&#10003;|
|スプーフィング（名前、MAC、シリアル）|&#10007;|&#10003;|&#10003;|&#10003;|
|セキュリティ強化（起動時ロック、PINミス時リセットなど）|&#10007;|&#10007;|&#10007;|&#10003;|
|アセットパック|&#10007;|&#10033;<sup>5</sup>|&#10007;|&#10003;|
|VGMカラオプション|&#10007;|&#10003;|&#10007;|&#10003;|
|レベルシステム強化|&#10007;|&#10003;|&#10007;|&#10003;|
|ファイル検索|&#10007;|&#10007;|&#10007;|&#10003;|
|ディスクイメージ管理|&#10007;|&#10003;|&#10007;|&#10003;|
|エラーメッセージ改善（元パスを表示）|&#10007;|&#10007;|&#10007;|&#10003;|
|外部アプリ事前インストール済み（2025年4月時点）|3|421|226（[e] パック込み）|183|
  
</div>

<div class="footnotes-container">

<sup>1: 公式ファームウェアは一部のローリングコード受信機とペアリング可能ですが、野外でキャプチャしたコードの送信は不可です（上記のカスタムファームウェアは自己責任で対応）。</sup>

<sup>2: 公式ファームウェアでもApp CatalogからFindMy Flipperをインストール可能ですが、起動時に自動有効にはなりません。カスタムファームウェアではFlipperの起動ごとに自動追跡を有効にできます。</sup>

<sup>3: これらのファームウェアはBad KBをApps > Tools > Bad KBに外部アプリとして追加しています（既定のBad USBアプリを置き換えるのではありません）。</sup>

<sup>4: 一部機能のみ。「CFW設定」アプリでのオプションは制限されています。</sup>

<sup>5: 異なる形式（manifest_xyz.txt）で、アニメーションのみ対応（アイコンやフォントは不可）。</sup>

</div>
