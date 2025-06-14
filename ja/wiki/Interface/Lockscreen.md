# Lockscreen

The Lockscreen settings allow you to configure security and display options for your Flipper Zero's lock screen. These settings can be found by pressing `UP` on the Desktop and navigating to `MNTM > Interface > Lockscreen`.

<sup>Default Option: `*`</sup>

## [Lock on Boot](Lockscreen#Lock-on-Boot)

Controls whether your Flipper locks automatically when powered on:

- `OFF`: Boot directly to Desktop even if PIN code is configured
- `ON`<sup>*</sup>: Require PIN on startup if PIN code is configured

## [Format on Bad PINs](Lockscreen#Format-on-Bad-PINs)

Automatically formats device after 10 incorrect PIN attempts:

- `OFF`<sup>*</sup>: Unlimited PIN attempts
- `ON`: Format after 10 failed attempts

## [Allow USB RPC while locked](Lockscreen#Allow-USB-RPC-while-locked)

Control USB connectivity while locked:

- `OFF`<sup>*</sup>: Block USB communication
- `ON`: Allow USB RPC access

## [Allow BLE RPC while locked](Lockscreen#Allow-BLE-RPC-while-locked)

Control Bluetooth connectivity while locked:

- `OFF`<sup>*</sup>: Block BLE communication
- `ON`: Allow BLE RPC access

## [Allow Poweroff](Lockscreen#Allow-Poweroff)

Control power options while locked:

- `OFF`: Prevent device shutdown
- `ON`<sup>*</sup>: Allow power off while locked

## [Lockscreen Elements](Lockscreen#Lockscreen-Elements)

<sup>`ON`/`OFF` toggles</sup>

### Info

Configure info on the lockscreen:

- `Show Time`: Toggle time display
- `Show Seconds`: Include seconds in time display
- `Show Date`: Display current date

### Visual

Customize lockscreen appearance:

- `Show Statusbar`: Toggle visibility of entire statusbar
- `Unlock Prompt`: Show the `Press UP to unlock!` prompt
- `Transparent`: Allow asset pack animation visibility through lockscreen

> Note: The Transparent option lets you see the Desktop animations while the screen is locked, which may overlap with the lockscreen info. Check the asset pack you are using to see if it works with this setting.
