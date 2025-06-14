---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  tagline: "기능이 풍부하고 안정적이며 사용자 정의 가능한\nFlipper Zero용 펌웨어"
  image:
      dark: /banners/logo_dark_ko.png
      light: /banners/logo_light_ko.png
      alt: Momentum Firmware

features:
  - title: 에셋 팩
    details: 애니메이션, 아이콘 및 글꼴 테마를 다시 컴파일하지 않고 쉽게 설치할 수 있습니다. 수십 개의 커뮤니티 팩 중에서 선택하거나 직접 만들 수 있습니다.
    icon:
        src: "/svg/palette.svg"
  - title: FindMy, Bad KB 및 BLE 스팸
    details: 원격으로 페이로드를 실행하거나 주변 사람들을 장난치거나 잃어버린 Flipper를 추적할 수 있는 가장 완전하고 고급 블루투스 도구 모음입니다.
    icon:
        src: "/svg/bluetooth.svg"
  - title: 수많은 프로토콜
    details: SubGHz에 통합된 다양한 프로토콜(날씨, pocsag, tpms 등), GPS SubDriving 및 일부 롤링 코드 지원. NFC 카드도 지원합니다.
    icon:
        src: "/svg/wave.svg"
  - title: 새로운 인터페이스
    details: 8가지 주요 메뉴 스타일, 빠른 토글이 가능한 제어 센터, 고급 파일 브라우저/관리자가 포함된 대폭 개편된 인터페이스.
    icon:
        src: "/svg/interface.svg"
  - title: Momentum 설정
    details: 거의 모든 것을 조정할 수 있는 강력한 앱. 에셋 팩, 메인 메뉴, 파일 브라우저, GPIO 핀, VGM 옵션 등을 구성할 수 있습니다.
    icon:
        src: "/svg/toggle.svg"
  - title: 향상된 JS 스크립팅
    details: 워크플로우 및 스크립트를 생성할 수 있는 가장 큰 JavaScript 모듈 세트 (USBDisk, Storage, GUI, BLE, SubGHz). C 프로그래밍이 필요 없습니다.
    icon:
        src: "/svg/js.svg"
---

<div class="mntm-h2">다른 펌웨어와 비교하기</div>

<div class="full-width-table">

|기능|[&nearr;&nbsp;OFW](https://github.com/flipperdevices/flipperzero-firmware)|[&nearr;&nbsp;RogueMaster](https://github.com/RogueMaster/flipperzero-firmware-wPlugins)|[&nearr;&nbsp;Unleashed](https://github.com/DarkFlippers/unleashed-firmware)|Momentum|
|-|:-:|:-:|:-:|:-:|
|안정적인 업데이트|&#10003;|&#10007;|&#10003;|&#10003;|
|(일부) 롤링 코드 지원|&#10033;<sup>1</sup>|&#10003;|&#10003;|&#10003;|
|FindMy Flipper|&#10033;<sup>2</sup>|&#10003;|&#10003;|&#10003;|
|BLE 스팸|&#10007;|&#10003;|&#10003;|&#10003;|
|Bad Keyboard<br>(추가 옵션)|&#10007;|&#10003;<sup>3</sup>|&#10003;<sup>2</sup>|&#10003;|
|서브드라이빙<br>(subghz에 좌표 저장)|&#10007;|&#10003;|&#10007;|&#10003;|
|완전한 사용자 정의<br>(레이아웃, 메뉴, 키 바인드 등)|&#10007;|&#10007;|&#10007;|&#10003;|
|관리 앱<br>(손쉬운 구성)|&#10007;|&#10033;<sup>4</sup>|&#10007;|&#10003;|
|향상된 RGB 백라이트 모드<br>(전체 사용자 정의 및 무지개 모드)|&#10007;|&#10003;|&#10007;|&#10003;|
|스푸핑<br>(이름, MAC, 시리얼)|&#10007;|&#10003;|&#10003;|&#10003;|
|향상된 보안<br>(부팅 시 잠금, 잘못된 핀 시 초기화 등)|&#10007;|&#10007;|&#10007;|&#10003;|
|에셋 팩|&#10007;|&#10033;<sup>5</sup>|&#10007;|&#10003;|
|VGM 색상 옵션|&#10007;|&#10003;|&#10007;|&#10003;|
|향상된 레벨 시스템|&#10007;|&#10003;|&#10007;|&#10003;|
|파일 검색|&#10007;|&#10007;|&#10007;|&#10003;|
|디스크 이미지 관리|&#10007;|&#10003;|&#10007;|&#10003;|
|향상된 오류 메시지<br>(소스 경로 표시)|&#10007;|&#10007;|&#10007;|&#10003;|
|사전 설치된 외부 앱<br>(2025년 4월 기준)|3|421|226 ([e] 팩 포함)|183|

</div>

<div class="footnotes-container">

<sup>1: 공식 펌웨어는 일부 롤링 코드 수신기와 페어링할 수 있으나 (커스텀 펌웨어보다는 적음), 캡처한 롤링 코드 신호를 전송하는 것은 허용하지 않습니다 (위에 나열된 커스텀 펌웨어는 이를 사용자 책임 하에 허용합니다).</sup>

<sup>2: 공식 펌웨어는 앱 카탈로그에서 FindMy Flipper 앱을 설치하여 사용할 수 있지만, 부팅 시 자동으로 활성화되지는 않습니다. 커스텀 펌웨어는 Flipper가 켜질 때마다 자동으로 활성화되어 항상 추적이 가능합니다.</sup>

<sup>3: 이 펌웨어들은 Bad KB를 기본 Bad USB 앱을 대체하는 대신 Apps > Tools > Bad KB에 추가 외부 앱으로 포함하고 있습니다.</sup>

<sup>4: 기능이 일부 제한되며, "CFW Settings" 관리 앱에서 선택 가능한 옵션이 적습니다.</sup>

<sup>5: 애니메이션만 지원하는 다른 형식 (manifest_xyz.txt), 아이콘 및 글꼴은 지원하지 않음</sup>

</div>
