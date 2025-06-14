# Dolphin

The Dolphin settings allow you to customize the stats and behavior of your Flipper Zero's dolphin. These settings can be found by pressing `UP` on the Desktop and navigating to `MNTM > Misc > Dolphin`.

<sup>Default Option: `*`</sup>

These stats update as you interact with your Flipper Zero, but you can also adjust them manually here. The stats and mood of your dolphin are displayed in the Passport:

<img src="https://github.com/user-attachments/assets/05e68995-8f54-44d1-a509-b153e0b7919a" width="200"/>

<sup>`RIGHT` on the Desktop</sup>

## [Dolphin Level](Dolphin#Dolphin-Level)

Level of your Dolphin (Each level requires an increasing amount of XP).

Dolphin level can affect which animations play from your current [Asset Pack](Graphics#Asset-Pack) unless [Unlock Anims](Graphics#Unlock-Anims) is enabled.

- Min: `1`<sup>*</sup>
- Max: `30`

## [Dolphin XP](Dolphin#Dolphin-XP)

Total XP of your Dolphin.

- Min: `0`<sup>*</sup>
- Max: `9,999`

## [Dolphin Angry](Dolphin#Dolphin-Angry)

Anger/"butthurt" level of your Dolphin, which determines the mood of your dolphin.

Anger level can affect which animations play from your current [Asset Pack](Graphics#Asset-Pack) unless [Unlock Anims](Graphics#Unlock-Anims) is enabled.

- Min: `0`<sup>*</sup>
- Max: `14`

#### Moods:

- `<= 4`: Happy
- `<= 9`: Okay
- `<= 14`: Angry

## [Butthurt Timer](Dolphin#Butthurt-Timer)

Butthurt timer of your Dolphin. How quickly your Dolphin changes anger level from lack of attention (app usage).

- `OFF`: No timer
- `30M`: 30 minutes
- `1H`: 1 hour
- `2H`: 2 hours
- `4H`: 4 hours
- `6H`<sup>*</sup>: 6 hours
- `8H`: 8 hours
- `12H`: 12 hours
- `24H`: 24 hours
- `48H`: 48 hours

<style scoped>
img {
    filter: saturate(0) brightness(200%) contrast(200%);
}
.dark img {
    filter: saturate(100%) brightness(100%) contrast(100%);
}
</style>