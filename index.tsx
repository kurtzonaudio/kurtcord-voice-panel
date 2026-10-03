/*
 * KurtcordVoicePanel, a Vencord/Equicord user plugin
 * Copyright (c) 2026 Kurtzon (Kurtzon Audio)
 * SPDX-License-Identifier: MIT
 */

import { UserAreaButton, UserAreaRenderProps } from "@api/UserArea";
import { identity } from "@utils/misc";
import definePlugin from "@utils/types";
import { findByPropsLazy } from "@webpack";
import { createRoot, MediaEngineStore, React, Select, useEffect, useState, useStateFromStores } from "@webpack/common";

import { Divider, Section, SelectRow, SliderRow, SmallButton, SwitchRow } from "./components";
import { applySpatial, bool, CAMERA_PRESETS, KurtConfig, num, readKurtcordConfig, SAMPLE_RATES, writeKurtcordConfig } from "./config";
import { EqCard } from "./eq";
import { SpatialSection } from "./spatial";
import { VstSection } from "./vst";

const MediaEngineActions = findByPropsLazy("setEchoCancellation", "setInputDevice", "setVideoDevice");

const CODECS = [
    { value: "opus", label: "Opus (Default)" },
    { value: "speex", label: "Speex (2009 Xbox Live)" },
    { value: "xma", label: "XMA (2009 Modern Warfare 2)" }
];

const cardStyle: React.CSSProperties = {
    position: "fixed",
    left: 8,
    bottom: 86,
    zIndex: 1000,
    width: 560,
    maxHeight: "calc(100vh - 170px)",
    display: "flex",
    flexDirection: "column",
    padding: "0 14px 16px",
    borderRadius: 16,
    background: "linear-gradient(180deg, rgba(175,227,127,.08), rgba(175,227,127,0) 150px), var(--background-floating, #111214)",
    border: "1px solid rgba(175,227,127,.22)",
    boxShadow: "0 18px 48px rgba(0,0,0,.55)",
    color: "var(--text-normal)"
};

const bodyStyle: React.CSSProperties = {
    flex: "1 1 auto",
    minHeight: 0,
    overflowY: "auto",
    overflowX: "hidden",
    overscrollBehavior: "contain"
};

function round1(v: number) {
    return Math.round(v * 10) / 10;
}

function deviceOptions(devices: any) {
    return Object.values(devices ?? {}).map((d: any) => ({ value: d.id, label: d.name }));
}

function QuickVoicePanel({ onClose }: { onClose(): void; }) {
    const [config, setConfig] = useState<KurtConfig>(readKurtcordConfig);
    const [rev, setRev] = useState(0);
    const [hwAccel, setHwAccel] = useState<boolean | null>(null);

    const inputDevices = useStateFromStores([MediaEngineStore], () => MediaEngineStore.getInputDevices());
    const outputDevices = useStateFromStores([MediaEngineStore], () => MediaEngineStore.getOutputDevices());
    const videoDevices = useStateFromStores([MediaEngineStore], () => MediaEngineStore.getVideoDevices());
    const inputDevice = useStateFromStores([MediaEngineStore], () => MediaEngineStore.getInputDeviceId());
    const outputDevice = useStateFromStores([MediaEngineStore], () => MediaEngineStore.getOutputDeviceId());
    const videoDevice = useStateFromStores([MediaEngineStore], () => MediaEngineStore.getVideoDeviceId());
    const inputVolume = useStateFromStores([MediaEngineStore], () => MediaEngineStore.getInputVolume());
    const outputVolume = useStateFromStores([MediaEngineStore], () => MediaEngineStore.getOutputVolume());
    const echoCancellation = useStateFromStores([MediaEngineStore], () => MediaEngineStore.getEchoCancellation());
    const noiseSuppression = useStateFromStores([MediaEngineStore], () => MediaEngineStore.getNoiseSuppression());
    const autoGainControl = useStateFromStores([MediaEngineStore], () => MediaEngineStore.getAutomaticGainControl());

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [onClose]);

    useEffect(() => {
        try {
            (window as any).__kurtcord?.getHwAccel?.()
                .then((r: any) => setHwAccel(!!(r && r.on)))
                .catch(() => setHwAccel(false));
        } catch {
            setHwAccel(false);
        }
    }, []);

    const cfgNum = (key: string, fallback: number) => num(config, key, fallback);
    const cfgBool = (key: string, fallback = false) => bool(config, key, fallback);

    const setKc = (patch: KurtConfig) => {
        const merged = writeKurtcordConfig(patch);
        setConfig(merged);
        if (Object.keys(patch).some(k => k.startsWith("spatial"))) applySpatial(merged);
    };

    const applyPreset = (patch: KurtConfig) => {
        setKc(patch);
        setRev(r => r + 1);
    };

    const codec = config.codec === "speex" || config.codec === "xma" ? config.codec : "opus";
    const codecStatus = codec === "speex"
        ? "Speex 2009 Xbox Live is on: the mic runs through the 8 kHz low-bitrate path and the controls below are locked."
        : codec === "xma"
            ? "XMA 2009 Modern Warfare 2 is on: the mic runs through the Xbox 360 XMA-style path and the controls below are locked."
            : "Opus (default): every control below is active.";

    const currentPreset = (() => {
        for (const [name, p] of Object.entries(CAMERA_PRESETS)) {
            if (p.vW === cfgNum("vW", 0) && p.vH === cfgNum("vH", 0) && p.vFps === cfgNum("vFps", 0)) return name;
        }
        return "1080p60";
    })();

    return (
        <div style={cardStyle}>
            <div style={{ padding: "12px 0 10px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 15, fontWeight: 800, letterSpacing: ".01em", color: "var(--header-primary)" }}>
                        <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: ".14em", padding: "3px 7px 2px", borderRadius: 5, background: "#AFE37F", color: "#11161a" }}>KURTCORD</span>
                        Voice & Video
                    </span>
                    <span onClick={onClose} style={{ cursor: "pointer", color: "var(--text-muted)", fontSize: 14, padding: "0 4px" }} title="Close (Esc)">✕</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: 9 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-normal)", flex: "0 0 auto" }}>Voice Codec</span>
                    <div style={{ width: 240 }}>
                        <Select
                            options={CODECS}
                            serialize={identity}
                            isSelected={(v: any) => v === codec}
                            select={(v: string) => setKc({ codec: v === "speex" || v === "xma" ? v : "opus" })}
                        />
                    </div>
                </div>
                <div style={{ fontSize: 10.5, lineHeight: "13px", color: "var(--text-muted)", marginTop: 5 }}>{codecStatus}</div>
            </div>

            <div style={bodyStyle}>
                <Section label="Microphone" />
                <SelectRow
                    label="Input Device"
                    desc="Microphone used for voice."
                    value={inputDevice}
                    options={deviceOptions(inputDevices)}
                    onChange={(id: string) => MediaEngineActions.setInputDevice(id)}
                />
                <SelectRow
                    label="Secondary Microphone"
                    desc="Second input device mixed into your outgoing audio. Off disables it."
                    value={cfgBool("secondaryMic") ? String(config.secondaryMicDevice ?? "") : "__off"}
                    options={[{ value: "__off", label: "Off" }, { value: "", label: "System default" }, ...deviceOptions(inputDevices)]}
                    onChange={(v: string) => setKc(v === "__off" ? { secondaryMic: false } : { secondaryMic: true, secondaryMicDevice: v })}
                />
                <SliderRow
                    label="Secondary Mic Volume"
                    desc="Level of the second mic channel. 0x mutes it. Applies live."
                    value={cfgNum("secondaryMicGain", 1)}
                    min={0}
                    max={10}
                    step={0.1}
                    format={v => `${round1(v)}x`}
                    onChange={v => setKc({ secondaryMicGain: round1(v) })}
                />
                <SelectRow
                    label="Third Microphone"
                    desc="Third input device mixed into your outgoing audio. Off disables it."
                    value={cfgBool("thirdMic") ? String(config.thirdMicDevice ?? "") : "__off"}
                    options={[{ value: "__off", label: "Off" }, { value: "", label: "System default" }, ...deviceOptions(inputDevices)]}
                    onChange={(v: string) => setKc(v === "__off" ? { thirdMic: false } : { thirdMic: true, thirdMicDevice: v })}
                />
                <SliderRow
                    label="Third Mic Volume"
                    desc="Level of the third mic channel. 0x mutes it. Applies live."
                    value={cfgNum("thirdMicGain", 1)}
                    min={0}
                    max={10}
                    step={0.1}
                    format={v => `${round1(v)}x`}
                    onChange={v => setKc({ thirdMicGain: round1(v) })}
                />
                <SliderRow
                    label="Mic Volume"
                    desc="Discord input volume. 100% is the default."
                    value={Math.round(inputVolume)}
                    min={0}
                    max={100}
                    step={1}
                    format={v => `${Math.round(v)}%`}
                    onChange={v => MediaEngineActions.setInputVolume(v)}
                />
                <SliderRow
                    label="Microphone Gain"
                    desc="Pre-encoder microphone gain (1x-10x). 1x is off. Applies live; high values can clip a loud mic."
                    value={cfgNum("micGain", 1)}
                    min={1}
                    max={10}
                    step={0.1}
                    format={v => `${round1(v)}x`}
                    onChange={v => setKc({ micGain: round1(v) })}
                />
                <SliderRow
                    label="Mic Reverb"
                    desc="How much of your voice goes through the reverb. 0 is off."
                    value={cfgNum("micReverb", 0)}
                    min={0}
                    max={100}
                    step={1}
                    format={v => `${Math.round(v)}%`}
                    onChange={v => setKc({ micReverb: Math.round(v) })}
                />
                <SliderRow
                    label="Reverb Size"
                    desc="Length of the reverb tail. Longer sounds like a bigger room."
                    value={cfgNum("micReverbSize", 2)}
                    min={0.2}
                    max={6}
                    step={0.1}
                    format={v => `${v.toFixed(1)} s`}
                    onChange={v => setKc({ micReverbSize: round1(v) })}
                />
                <SliderRow
                    label="Reverb Tone"
                    desc="Damps the reverb tail. Lower is darker and softer; higher is brighter."
                    value={cfgNum("micReverbTone", 7000)}
                    min={1500}
                    max={16000}
                    step={100}
                    format={v => `${Math.round(v / 100) / 10} kHz`}
                    onChange={v => setKc({ micReverbTone: Math.round(v / 100) * 100 })}
                />
                <SelectRow
                    label="Mic Engine Rate"
                    desc="Sample rate of the mic engine that feeds Opus. Follow device keeps your mic at its native rate."
                    value={String(cfgNum("micRate", 0))}
                    options={[{ value: "0", label: "Follow device" }, { value: "48000", label: "48 kHz" }, { value: "96000", label: "96 kHz" }, { value: "192000", label: "192 kHz" }]}
                    onChange={(v: string) => setKc({ micRate: Number(v) || 0 })}
                />
                <EqCard config={config} setKc={setKc} />

                <Divider />
                <Section label="Voice Processing" />
                <SwitchRow
                    label="Echo Cancellation"
                    desc="AEC: removes echo picked up from your speakers."
                    value={echoCancellation}
                    onChange={v => { MediaEngineActions.setEchoCancellation(v); setKc({ echoCancellation: v }); }}
                />
                <SwitchRow
                    label="Noise Suppression"
                    desc="NS: filters background noise from your mic."
                    value={noiseSuppression}
                    onChange={v => { MediaEngineActions.setNoiseSuppression(v); setKc({ noiseSuppression: v }); }}
                />
                <SwitchRow
                    label="Auto Gain Control"
                    desc="AGC: automatically adjusts your mic level."
                    value={autoGainControl}
                    onChange={v => { MediaEngineActions.setAutomaticGainControl(v); setKc({ autoGainControl: v }); }}
                />
                <SwitchRow
                    label="Bypass System Audio Input Processing"
                    desc="Requests the raw microphone and skips browser AEC, NS and AGC. Applies right away."
                    value={cfgBool("bypassInputProcessing")}
                    onChange={v => setKc({ bypassInputProcessing: v })}
                />
                <SwitchRow
                    label="Voice Volume Meter"
                    desc="Live volume bars on voice call tiles. Inbound (other) users only."
                    value={cfgBool("voiceMeter")}
                    onChange={v => setKc({ voiceMeter: v })}
                />
                <SwitchRow
                    label="No Push-to-Talk (Experimental)"
                    desc="Bypass forced push-to-talk and use voice activity instead."
                    value={cfgBool("noPushToTalk")}
                    onChange={v => setKc({ noPushToTalk: v })}
                />

                <Divider />
                <Section label="Opus Codec" />
                <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                    <SmallButton
                        label="High bitrate"
                        title="QEXT on, 10 ms min and max packet time, bitrate maxed at 530 kbps. The other person must also enable QEXT."
                        onClick={() => applyPreset({ bit24: true, opusHighBitrate: false, opusMinptime: 10, opusMaxptime: 10, opusCbr: true, opusDtx: false, maxaveragebitrate: 530000 })}
                    />
                    <SmallButton
                        label="Optimised bitrate"
                        title="248 kbps, 10/60 ms packet time, QEXT off. Balanced quality and reliability."
                        onClick={() => applyPreset({ bit24: false, opusHighBitrate: false, opusMinptime: 10, opusMaxptime: 60, maxaveragebitrate: 248000 })}
                    />
                    <SmallButton
                        label="Anti packet loss"
                        title="128 kbps, QEXT off, FEC on, variable bitrate. Tuned for lossy networks."
                        onClick={() => applyPreset({ bit24: false, opusHighBitrate: false, opusMinptime: 10, opusMaxptime: 60, maxaveragebitrate: 128000, inbandFec: true, opusDtx: false, opusCbr: false })}
                    />
                </div>
                <SwitchRow
                    label="Stereo"
                    desc="Dual-channel Opus (stereo=1, sprop-stereo=1). Required by Spatialise Input."
                    value={cfgBool("stereo", true)}
                    onChange={v => setKc(v ? { stereo: true } : { stereo: false, spatialInput: false })}
                />
                <SwitchRow
                    label="Experimental QEXT Layer"
                    desc="kurtopus 1.6 HD quality-extension layer, unlocks bitrate up to 530 kbps. Both ends need it."
                    value={cfgBool("bit24")}
                    onChange={v => setKc({ bit24: v, opusHighBitrate: false })}
                />
                <SliderRow
                    key={`bitrate-${rev}`}
                    label="Audio Bitrate"
                    desc="maxaveragebitrate. Above 248 kbps needs QEXT; force 10 ms packet time above 510 kbps."
                    value={Math.min(cfgNum("maxaveragebitrate", 510000), cfgBool("bit24") ? 530000 : 510000)}
                    min={6000}
                    max={cfgBool("bit24") ? 530000 : 510000}
                    step={1000}
                    format={v => v >= 1000 ? `${Math.round(v / 1000)} kbps` : `${v} bps`}
                    onChange={v => setKc({ maxaveragebitrate: Math.round(v / 1000) * 1000 })}
                />
                <SelectRow
                    label="Sample Rate"
                    desc="maxplaybackrate. 96 kHz needs kurtopus 1.6 HD on both ends."
                    value={cfgNum("maxplaybackrate", 48000)}
                    options={SAMPLE_RATES}
                    onChange={(v: number) => setKc({ maxplaybackrate: v })}
                />
                <SelectRow
                    label="Capture Rate Hint"
                    desc="sprop-maxcapturerate hint. 48 kHz is fullband; 96 kHz uses the high-rate path."
                    value={cfgNum("opusSpropMaxcapturerate", 48000)}
                    options={SAMPLE_RATES}
                    onChange={(v: number) => setKc({ opusSpropMaxcapturerate: v })}
                />
                <SelectRow
                    label="Minimum Packet Time"
                    desc="minptime hint. 10 ms has the lowest delay; higher values can add latency."
                    value={cfgNum("opusMinptime", 10)}
                    options={[{ value: 10, label: "10 ms" }, { value: 20, label: "20 ms" }, { value: 40, label: "40 ms" }, { value: 60, label: "60 ms" }]}
                    onChange={(v: number) => setKc({ opusMinptime: Number(v) || 10, ...(cfgNum("opusMaxptime", 60) < (Number(v) || 10) ? { opusMaxptime: Number(v) || 10 } : {}) })}
                />
                <SelectRow
                    label="Maximum Packet Time"
                    desc="maxptime SDP attribute. Higher values can add packet latency."
                    value={cfgNum("opusMaxptime", 60)}
                    options={[{ value: 10, label: "10 ms" }, { value: 20, label: "20 ms" }, { value: 40, label: "40 ms" }, { value: 60, label: "60 ms" }, { value: 120, label: "120 ms" }]}
                    onChange={(v: number) => setKc({ opusMaxptime: Math.max(Number(v) || 60, cfgNum("opusMinptime", 10)) })}
                />
                <SliderRow
                    label="Opus Complexity"
                    desc="Libopus 0-10. Stock WebRTC may ignore this unless the encoder reads complexity from Opus fmtp."
                    value={cfgNum("opusComplexity", 10)}
                    min={0}
                    max={10}
                    step={1}
                    format={v => String(Math.round(v))}
                    onChange={v => setKc({ opusComplexity: Math.round(v) })}
                />
                <SwitchRow
                    label="Adaptive Ptime"
                    desc="Allows Chromium to adapt Opus packet timing under congestion."
                    value={cfgBool("adaptivePtime")}
                    onChange={v => setKc({ adaptivePtime: v })}
                />
                <SwitchRow
                    label="Opus DTX"
                    desc="Discontinuous transmission. Sends less during silence."
                    value={cfgBool("opusDtx")}
                    onChange={v => setKc({ opusDtx: v })}
                />
                <SwitchRow
                    label="Constant Bitrate"
                    desc="Keeps Opus cbr=1 for a steadier bitrate. Off is variable bitrate."
                    value={cfgBool("opusCbr", true)}
                    onChange={v => setKc({ opusCbr: v })}
                />
                <SwitchRow
                    label="Inband FEC"
                    desc="Forward error correction in the Opus stream. Helps on lossy connections."
                    value={cfgBool("inbandFec", true)}
                    onChange={v => setKc({ inbandFec: v })}
                />

                <Divider />
                <SpatialSection config={config} setKc={setKc} />

                <Divider />
                <Section label="Output" />
                <SelectRow
                    label="Output Device"
                    desc="Speaker used for voice."
                    value={outputDevice}
                    options={deviceOptions(outputDevices)}
                    onChange={(id: string) => MediaEngineActions.setOutputDevice(id)}
                />
                <SliderRow
                    label="Speaker Volume"
                    desc="Discord output volume. 100% is the default."
                    value={Math.round(outputVolume)}
                    min={0}
                    max={200}
                    step={1}
                    format={v => `${Math.round(v)}%`}
                    onChange={v => MediaEngineActions.setOutputVolume(v)}
                />

                <Divider />
                <Section label="Video" />
                <SelectRow
                    label="Camera"
                    desc="Webcam used for video."
                    value={videoDevice}
                    options={deviceOptions(videoDevices)}
                    onChange={(id: string) => MediaEngineActions.setVideoDevice(id)}
                />
                <SelectRow
                    label="Quality Preset"
                    desc="Resolution and frame rate. Above 720p needs Advanced Camera Controls."
                    value={currentPreset}
                    options={Object.keys(CAMERA_PRESETS).map(k => ({ value: k, label: k }))}
                    onChange={(v: string) => {
                        const p = CAMERA_PRESETS[v];
                        if (p) setKc({ ...p });
                    }}
                />
                <SwitchRow
                    label="Advanced Camera Controls"
                    desc="Removes Discord's 720p camera cap so resolution is negotiated up to the preset."
                    value={cfgBool("videoHD")}
                    onChange={v => setKc({ videoHD: v, videoHDUserSet: true })}
                />
                <SwitchRow
                    label="Advanced Hardware Acceleration"
                    desc="Force GPU rasterisation, zero-copy and accelerated video decode. Applies after a restart."
                    value={!!hwAccel}
                    disabled={hwAccel === null}
                    onChange={v => {
                        setHwAccel(v);
                        try {
                            (window as any).__kurtcord?.setHwAccel?.(v)
                                .then((r: any) => {
                                    if (r && r.ok) setHwAccel(!!r.on);
                                })
                                .catch(() => { });
                        } catch { }
                    }}
                />

                <Divider />
                <Section label="Plugins" />
                <VstSection config={config} setKc={setKc} />
            </div>
        </div>
    );
}

let container: HTMLDivElement | null = null;
let root: ReturnType<typeof createRoot> | null = null;

function openPanel() {
    if (container) return;
    container = document.createElement("div");
    container.id = "vc-quick-voice-panel";
    document.body.appendChild(container);
    root = createRoot(container);
    root.render(<QuickVoicePanel onClose={closePanel} />);
}

function closePanel() {
    try {
        root?.unmount();
    } catch { }
    root = null;
    container?.remove();
    container = null;
}

function togglePanel() {
    if (container) closePanel();
    else openPanel();
}

function PanelIcon({ className }: { className?: string; }) {
    return (
        <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h-2v6h2zM7 9v2H3v2h4v2h2V9H7zm14 4v-2H11v2h10zm-6-4h2V7h4V5h-4V3h-2v6z" />
        </svg>
    );
}

function VoicePanelButton({ iconForeground, hideTooltips, nameplate }: UserAreaRenderProps) {
    return (
        <UserAreaButton
            className="button__201d5 wrapper__201d5"
            tooltipText={hideTooltips ? void 0 : "Voice & Video quick panel"}
            onClick={togglePanel}
            plated={nameplate != null}
            icon={<PanelIcon className={iconForeground} />}
        />
    );
}

export default definePlugin({
    name: "KurtcordVoicePanel",
    description: "Adds a button in the user area that opens a compact Voice & Video panel with every mic, gain, reverb, EQ, voice processing, codec, spatial audio, output, camera and VST setting from Kurtcord's Voice & Video page, all changeable live without opening User Settings.",
    authors: [{ name: "Kurtzon Audio", id: 0n }],
    enabledByDefault: true,
    userAreaButton: {
        icon: PanelIcon,
        render: VoicePanelButton,
        priority: 10
    },
    stop() {
        closePanel();
    }
});
