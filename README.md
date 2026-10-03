# Kurtcord Voice Panel

Kurtcord Voice Panel adds a button to the Discord user area that opens a compact, always-available Voice & Video panel. Everything in Kurtcord's Voice & Video settings page is here, changeable live in the middle of a call, without opening user settings.

## What it does

The panel covers the whole voice chain, from the microphone to the codec to the output device:

**Voice codec**

- Codec selector. Current builds run Opus. The Speex and XMA entries are legacy labels for the 2009 console voice paths and are locked when selected.

**Microphone**

- Input device.
- Second microphone and third microphone, each with its own device and gain, mixed into your outgoing voice.
- Discord input volume.
- Pre-encoder microphone gain from 1x to 10x.
- Microphone reverb: amount, tail size, and tone.
- Mic engine rate: follow the device, or force 48, 96, or 192 kHz.

**Equalizer**

- 16-band parametric EQ on the outgoing voice, from 25 Hz to 16 kHz.
- Per-band gain with a live response curve and a width (Q) control.
- Double-click a band to reset it.
- Presets: Flat, Bass, Treble, Warm, Podcast, V-Shape, Telephone.

**Voice processing**

- Echo cancellation, noise suppression, and automatic gain control.
- Bypass system input processing, which requests the raw microphone and skips the browser AEC, NS, and AGC.
- Voice volume meter toggle and a no push-to-talk option.

**Opus codec**

- One-click presets: High bitrate, Optimised bitrate, and Anti packet loss.
- Stereo, the experimental QEXT quality-extension layer, audio bitrate up to 530 kbps, sample rate, capture rate hint, minimum and maximum packet time, complexity, adaptive packet time, DTX, constant bitrate, and inband FEC.

**Spatial audio**

- Binaural rendering controls, width, direction, distance, elevation, room profile, maximum sources, ambisonic order, output gain, balance, and left/right swap. The panel writes these to the client's spatial engine.

**Output**

- Output device and speaker volume.

**Video**

- Camera device, quality presets from 720p60 to 2160p60, advanced camera controls that lift Discord's 720p cap, and advanced hardware acceleration.

**Plugins**

- VST3 and VST2 effect chains on the outgoing voice, with add, remove, reorder, enable, and a button that opens the plugin's real editor window.

## How it works

- A button is added to the user area through the UserArea API. Clicking it mounts the panel as a fixed card above the user area, and Escape closes it.
- Settings are stored in a single config object under the `discord-stereo-config` key. The panel reads it on open, writes changes back immediately, and syncs the config to the desktop client through the `window.__kurtcord` bridge so the userscript and the native audio engine agree.
- Sliders, switches, and selects write to that config. Changes apply live: the client reads the config on each voice setup, and live audio settings such as mic gain, EQ, reverb, and VST chains are rebuilt into the running mic chain.
- The EQ draws its response curve on a canvas from the band gains and Q.
- The VST cards talk to the desktop client's VST host. VST3 runs before VST2, and both run after the EQ and before Opus. When the bridge is not there, the cards say so instead of failing.

## Settings

This plugin has no settings of its own. Everything is in the panel, and the panel stores its config in the client's shared voice config.

## Installation

Kurtcord Voice Panel is a user plugin for Vencord or Equicord, and it is built into Kurtcord, where the button is always available in the user area.

For Vencord or Equicord:

1. Clone the plugin into the userplugins folder:
   ```
   git clone https://github.com/kurtzonaudio/kurtcord-voice-panel src/userplugins/KurtcordVoicePanel
   ```
2. Build the client:
   ```
   pnpm build
   ```
3. Restart Discord and open the Voice & Video quick panel from the button in the user area.

## Notes and limits

- The panel is designed around the Kurtcord desktop client. Most controls render anywhere, but the ones that need the client bridge (spatial audio, VST chains, camera presets, codec tuning, hardware acceleration) need Kurtcord to apply.
- Some controls are locked while a legacy codec label is selected, and unlocking them returns the panel to Opus.
- VST editors open in their own windows and need the desktop VST service to be running.
- The panel is a control surface. It does not process audio itself. The audio work happens in the client's mic chain, codec setup, spatial engine, and VST service.

## Kurtzon's Discord plugins

This plugin is part of the Kurtzon's Discord plugins set, which ships with [Kurtcord](https://github.com/kurtzonaudio/kurtcord) and also works in Vencord and Equicord:

- [Stereo Guard](https://github.com/kurtzonaudio/stereo-guard): locally mutes anyone whose audio is not fully mono.
- [Mic Spam Guard](https://github.com/kurtzonaudio/mic-spam-guard): locally mutes anyone who gets too loud or spams their mic.
- [Voice State Fix](https://github.com/kurtzonaudio/voice-state-fix): corrects stuck mute and deafen states on Discord's side.
- [Voice VU Meters](https://github.com/kurtzonaudio/voice-vu-meters): live volume meters next to everyone in a call.
- [Kurtcord Voice Panel](https://github.com/kurtzonaudio/kurtcord-voice-panel): a live Voice & Video panel in the user area.
- [Kurtcord Theme](https://github.com/kurtzonaudio/kurtcord-theme): the Kurtcord wallpaper theme.
- [Camera Unlock](https://github.com/kurtzonaudio/camera-unlock): unlocks the camera and Go Live buttons without the Stream permission.
- [Click To Unmute](https://github.com/kurtzonaudio/click-to-unmute): click a locally muted user's mute icon to unmute them.
- [Auto Cam Off](https://github.com/kurtzonaudio/auto-cam-off): turns your camera off when a staff member joins.

## License

MIT. Copyright (c) 2026 Kurtzon (Kurtzon Audio). See [LICENSE](LICENSE).

Built and maintained by Kurtzon.
