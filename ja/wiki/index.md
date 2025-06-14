---
next:
    text: Wiki
    link: Installation.md
---

![バナー](https://github.com/user-attachments/assets/c9957bc7-3cc8-45aa-b0a7-33d654f2c284)

<div class="mntm custom-block">

このWikiは以下の言語で利用できます。ローカライズのお手伝いをしていただける場合は、[Next-Flip/Momentum-Website](https://github.com/Next-Flip/Momentum-Website)をご覧ください。

[English](/wiki) · [日本語](/ja/wiki) · [한국어](/ko/wiki) · [简体中文](/zh/wiki)

</div>

<br/>

# Momentum ファームウェア Wiki

これは、Momentum に固有の機能と設定についての包括的で解説的なガイドです。[OFW](https://github.com/flipperdevices/flipperzero-firmware) に存在し、*ほとんど*同じままの設定についてはここでは触れない場合があります。個別の機能とそれぞれのページの詳細な一覧については、[比較表](#他のファームウェアとの比較)を参照してください。

### クイックリンク

- [`インストール方法`](Installation.md)：Momentum をインストールする様々な方法
- [`アセットパックガイド`](Assets/Asset-Packs.md)：アセットパックとは何か、それらのインストール方法
- [`コミュニティ製アセットパック一覧`](Assets/Community-Asset-Packs.md)：コミュニティ作成のアセットパックの全リスト
- [`よくある質問`](Frequently-Asked-Questions.md)：一般的な問題とその解決策

### Momentum の設定

Momentum 固有の全設定項目の概要です。これらの設定は `デスクトップ` 上で `UP` を押し、`MNTM` アプリ（**M**ロゴ）を開くことでアクセスできます。

- [`インターフェース`](Interface/Interface.md)：インターフェース（デスクトップ、メインメニュー、ロック画面など）のカスタマイズ
- [`プロトコル`](Protocols/Protocols.md)：対応プロトコル（SubGHz や GPIO ピンなど）の設定
- [`その他`](Misc/Misc.md)：その他のデバイス識別に関する設定

## なぜ Momentum なのか？

Momentum は [Flipper Zero](https://flipperzero.one/) 向けの [公式ファームウェア](https://github.com/flipperdevices/flipperzero-firmware) をベースにしており、[Unleashed](https://github.com/DarkFlippers/unleashed-firmware) の優れた機能の多くを含んでいます。これは Xtreme ファームウェアの直接的な後継であり、同じ開発者（唯一の開発者）によって構築されています。

このファームウェアの目標は、Flipper Zero の可能性の限界を押し広げることであり、新機能の革新を推進するとともに、他のどのファームウェアよりも簡単でカスタマイズ可能なユーザー体験を提供することです。不具合の迅速な修正や、安定かつ互換性のあるシステムの維持も最重要課題としています。

### 他のファームウェアとの比較

|機能|[&nearr;&nbsp;OFW](https://github.com/flipperdevices/flipperzero-firmware)|[&nearr;&nbsp;RogueMaster](https://github.com/RogueMaster/flipperzero-firmware-wPlugins)|[&nearr;&nbsp;Unleashed](https://github.com/DarkFlippers/unleashed-firmware)|Momentum|
|-|:-:|:-:|:-:|:-:|
|安定したアップデート|&#10003;|&#10007;|&#10003;|&#10003;|
|ローリングコードの一部対応|&#10033;<sup>1</sup>|&#10003;|&#10003;|&#10003;|
|FindMy Flipper 対応|&#10033;<sup>2</sup>|&#10003;|&#10003;|&#10003;|
|BLE スパム|&#10007;|&#10003;|&#10003;|&#10003;|
|Bad Keyboard<br>（追加オプション）|&#10007;|&#10003;<sup>3</sup>|&#10003;<sup>2</sup>|&#10003;|
|Subdriving<br>（SubGHz の座標保存）|&#10007;|&#10003;|&#10007;|&#10003;|
|完全カスタマイズ<br>（レイアウト、メニュー、キーバインド等）|&#10007;|&#10007;|&#10007;|&#10003;|
|管理アプリ<br>（簡易設定用）|&#10007;|&#10033;<sup>4</sup>|&#10007;|&#10003;|
|強化された RGB バックライトモード<br>（フルカスタマイズ & 虹色モード）|&#10007;|&#10003;|&#10007;|&#10003;|
|なりすまし機能<br>（名前、MAC、シリアル）|&#10007;|&#10003;|&#10003;|&#10003;|
|セキュリティ強化<br>（起動時ロック、PIN ミス時リセット等）|&#10007;|&#10007;|&#10007;|&#10003;|
|アセットパック対応|&#10007;|&#10033;<sup>5</sup>|&#10007;|&#10003;|
|VGM カラーオプション|&#10007;|&#10003;|&#10007;|&#10003;|
|強化されたレベルシステム|&#10007;|&#10003;|&#10007;|&#10003;|
|ファイル検索機能|&#10007;|&#10007;|&#10007;|&#10003;|
|ディスクイメージ管理|&#10007;|&#10003;|&#10007;|&#10003;|
|エラーメッセージの改善<br>（ソースパスの表示）|&#10007;|&#10007;|&#10007;|&#10003;|
|外部アプリのプリインストール<br>（2025年4月時点）|3|421|226（[e]パック込み）|183|

<sup>1: 公式ファームウェアは一部のローリングコード受信機にペアリングできますが（カスタムファームウェアより少ない）、野外でキャプチャしたローリングコード信号の送信はできません（上記のカスタムファームウェアは自己責任で可能）。</sup>

<sup>2: 公式ファームウェアでも App Catalog からアプリをインストールすれば FindMy Flipper を使用できますが、起動時に自動有効にはなりません。カスタムファームウェアでは Flipper の起動時に自動有効となり、常に追跡されます。</sup>

<sup>3: これらのファームウェアでは Bad KB が追加の外部アプリ（Apps > Tools > Bad KB）として含まれており、デフォルトの Bad USB アプリは置き換えられません。</sup>

<sup>4: 機能が一部制限された「CFW 設定」管理アプリ。</sup>

<sup>5: アニメーションのみ対応の別形式（manifest_xyz.txt）。アイコンやフォントは非対応。</sup>
