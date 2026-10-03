/*
 * KurtcordVoicePanel, a Vencord/Equicord user plugin
 * Copyright (c) 2026 Kurtzon (Kurtzon Audio)
 * SPDX-License-Identifier: MIT
 */

import { React } from "@webpack/common";

import { Section, SelectRow, SliderRow, SwitchRow } from "./components";
import { bool, KurtConfig, num } from "./config";

export function SpatialSection({ config, setKc }: { config: KurtConfig; setKc(patch: KurtConfig): void; }) {
    const stereo = bool(config, "stereo", true);
    const enabled = bool(config, "spatialEnabled", false);
    const spatialInput = bool(config, "spatialInput", false) && stereo;

    return (
        <>
            <Section label="Spatial Audio" />
            <SwitchRow
                label="Spatial Audio (Binaural)"
                desc="Positions everyone in the voice call around your head with HRTF rendering. Headphones strongly recommended."
                value={enabled}
                onChange={v => setKc({ spatialEnabled: v })}
            />
            <SwitchRow
                label="Spatialise Input"
                desc="Requires Stereo. Bakes the HRTF into your outgoing voice; peers hear fixed binaural stereo. Can sound phasey or distant."
                value={spatialInput}
                disabled={!stereo}
                onChange={v => setKc({ spatialInput: v })}
            />
            <SliderRow
                label="Width"
                desc="How wide everyone is spread across the front. 0 stacks everyone dead ahead."
                value={num(config, "spatialSpread", 120)}
                min={0}
                max={180}
                step={5}
                format={v => `${Math.round(v)}°`}
                onChange={v => setKc({ spatialSpread: Math.round(v / 5) * 5 })}
            />
            <SliderRow
                label="Direction"
                desc="Rotate the whole group left or right."
                value={num(config, "spatialRotation", 0)}
                min={-90}
                max={90}
                step={5}
                format={v => {
                    const r = Math.round(v);
                    return r === 0 ? "Center" : r < 0 ? `Left ${-r}°` : `Right ${r}°`;
                }}
                onChange={v => setKc({ spatialRotation: Math.round(v / 5) * 5 })}
            />
            <SliderRow
                label="Distance"
                desc="How far away everyone sounds. Further is also a little quieter."
                value={num(config, "spatialDistance", 1.2)}
                min={0.5}
                max={8}
                step={0.1}
                format={v => `${Number(v).toFixed(1)} m`}
                onChange={v => setKc({ spatialDistance: Math.round(v * 10) / 10 })}
            />
            <SliderRow
                label="Elevation"
                desc="Raise or lower everyone. 0° is ear height."
                value={num(config, "spatialElevation", 0)}
                min={-90}
                max={90}
                step={5}
                format={v => `${Math.round(v) > 0 ? "+" : ""}${Math.round(v)}°`}
                onChange={v => setKc({ spatialElevation: Math.round(v / 5) * 5 })}
            />
            <SelectRow
                label="Room"
                desc="Binaural HRTF profile. Changing this rebuilds the renderer briefly."
                value={num(config, "spatialProfile", 0)}
                options={[{ value: 0, label: "Direct (dry)" }, { value: 1, label: "Ambient" }, { value: 2, label: "Reverberant" }]}
                onChange={(v: number) => setKc({ spatialProfile: Number(v) || 0 })}
            />
            <SelectRow
                label="Max Spatial Sources"
                desc="How many people can be positioned at once. Larger calls fall back to flat stereo."
                value={num(config, "spatialMaxObjects", 8)}
                options={[{ value: 8, label: "8 sources" }, { value: 16, label: "16 sources" }, { value: 32, label: "32 sources" }, { value: 64, label: "64 sources" }, { value: 128, label: "128 sources" }]}
                onChange={(v: number) => setKc({ spatialMaxObjects: Number(v) || 8 })}
            />
            <SelectRow
                label="Ambisonic Order"
                desc="Spatial resolution. Higher orders localise more sharply for more CPU."
                value={num(config, "spatialOrder", 3)}
                options={[{ value: 1, label: "1st order (4ch)" }, { value: 2, label: "2nd order (9ch)" }, { value: 3, label: "3rd order (16ch)" }, { value: 4, label: "4th order (25ch)" }]}
                onChange={(v: number) => setKc({ spatialOrder: Number(v) || 3 })}
            />
            <SliderRow
                label="Output Gain"
                desc="Overall loudness of the spatialised mix. Boost is capped at +2 dB."
                value={num(config, "spatialGain", 0)}
                min={-12}
                max={2}
                step={1}
                format={v => `${Math.round(v) > 0 ? "+" : ""}${Math.round(v)} dB`}
                onChange={v => setKc({ spatialGain: Math.round(v) })}
            />
            <SliderRow
                label="Balance"
                desc="Trim left/right output loudness."
                value={num(config, "spatialBalance", 0)}
                min={-100}
                max={100}
                step={5}
                format={v => {
                    const r = Math.round(v);
                    return r === 0 ? "Center" : r < 0 ? `L ${-r}` : `R ${r}`;
                }}
                onChange={v => setKc({ spatialBalance: Math.round(v / 5) * 5 })}
            />
            <SwitchRow
                label="Swap Left/Right"
                desc="Flip the binaural output channels. Only needed if your headphones are wired in reverse."
                value={bool(config, "spatialSwap", false)}
                onChange={v => setKc({ spatialSwap: v })}
            />
        </>
    );
}
