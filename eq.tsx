/*
 * KurtcordVoicePanel, a Vencord/Equicord user plugin
 * Copyright (c) 2026 Kurtzon (Kurtzon Audio)
 * SPDX-License-Identifier: MIT
 */

import { Switch } from "@components/Switch";
import { React, Slider, useEffect, useMemo, useRef, useState } from "@webpack/common";

import { descStyle, labelStyle, Text, valueStyle } from "./components";
import { bool, EQ_FREQS, KurtConfig, num } from "./config";

interface EqBand {
    f: number;
    g: number;
}

const EQ_PRESETS: [string, number[]][] = [
    ["Flat", [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]],
    ["Bass", [4, 3.5, 3, 2.5, 2, 1.5, 1, 0.5, 0, 0, 0, 0, 0, 0, 0, 0]],
    ["Treble", [0, 0, 0, 0, 0, 0, 0, 0, 0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5]],
    ["Warm", [2.5, 2, 1.5, 0.5, -0.5, -0.5, 0, 0, 0, 0, 0.5, 1, 1.5, 2, 2, 2]],
    ["Podcast", [-2, -2, -1.5, -1, 0, 0.5, 1, 1.5, 1.5, 1, 0.5, 0, 0, 0, 0, 0]],
    ["V-Shape", [3, 3, 2.5, 1.5, 0, -1, -1.5, -1, 0, 1, 1.5, 2, 2.5, 3, 3, 3]],
    ["Telephone", [-6, -6, -4, -2, 0, 2, 3, 3, 2, 1, 0, -2, -4, -6, -6, -6]]
];

function parseBands(config: KurtConfig): EqBand[] {
    let parsed: any = null;
    try {
        parsed = JSON.parse(String(config.eqBands || ""));
    } catch { }
    if (!Array.isArray(parsed) || parsed.length !== 16) parsed = null;
    return EQ_FREQS.map((f, i) => {
        const b = parsed?.[i];
        let bf = Number(b?.f);
        if (!Number.isFinite(bf)) bf = f;
        bf = Math.round(Math.min(20000, Math.max(20, bf)));
        let bg = Number(b?.g);
        if (!Number.isFinite(bg)) bg = 0;
        bg = Math.round(Math.min(12, Math.max(-12, bg)) * 10) / 10;
        return { f: bf, g: bg };
    });
}

function drawCurve(canvas: HTMLCanvasElement | null, bands: EqBand[], enabled: boolean, q: number) {
    if (!canvas) return;
    const W = canvas.clientWidth || 360;
    const H = 84;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    const g = canvas.getContext("2d");
    if (!g) return;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, W, H);

    const fmin = 20, fmax = 20000, dbMax = 12;
    const Xp = (f: number) => Math.log(f / fmin) / Math.log(fmax / fmin) * W;
    const Yp = (db: number) => H / 2 - db / dbMax * (H / 2 - 6);

    g.strokeStyle = "rgba(255,255,255,.07)";
    g.lineWidth = 1;
    [30, 100, 300, 1000, 3000, 10000].forEach(f => {
        g.beginPath();
        g.moveTo(Xp(f), 0);
        g.lineTo(Xp(f), H);
        g.stroke();
    });
    [12, 6, 0, -6, -12].forEach(db => {
        g.beginPath();
        g.moveTo(0, Yp(db));
        g.lineTo(W, Yp(db));
        g.stroke();
    });

    const co: { b0: number; b1: number; b2: number; a0: number; a1: number; a2: number; }[] = [];
    for (let i = 0; i < 16; i++) {
        const b = bands[i];
        const A = Math.pow(10, b.g / 40);
        const w0 = 2 * Math.PI * b.f / 48000;
        const c0 = Math.cos(w0);
        const s0 = Math.sin(w0);
        const al = s0 / (2 * q);
        co.push({ b0: 1 + al * A, b1: -2 * c0, b2: 1 - al * A, a0: 1 + al / A, a1: -2 * c0, a2: 1 - al / A });
    }

    g.beginPath();
    for (let px = 0; px <= W; px++) {
        const f = fmin * Math.pow(fmax / fmin, px / W);
        const w = 2 * Math.PI * f / 48000;
        const cw = Math.cos(w), sw = Math.sin(w), cw2 = Math.cos(2 * w), sw2 = Math.sin(2 * w);
        let db = 0;
        if (enabled) {
            for (let ci = 0; ci < 16; ci++) {
                const c = co[ci];
                const nr = c.b0 + c.b1 * cw + c.b2 * cw2, nim = -(c.b1 * sw + c.b2 * sw2);
                const dr = c.a0 + c.a1 * cw + c.a2 * cw2, dim = -(c.a1 * sw + c.a2 * sw2);
                const m = (nr * nr + nim * nim) / (dr * dr + dim * dim);
                db += 10 * Math.log10(m > 0 ? m : 1e-7);
            }
        }
        const yy = Yp(db);
        px === 0 ? g.moveTo(px, yy) : g.lineTo(px, yy);
    }
    g.strokeStyle = enabled ? "#AFE37F" : "rgba(255,255,255,.45)";
    g.lineWidth = enabled ? 2 : 1.5;
    g.stroke();
    if (enabled) {
        g.fillStyle = "rgba(175,227,127,.07)";
        g.lineTo(W, H / 2);
        g.lineTo(0, H / 2);
        g.closePath();
        g.fill();
    }
}

function FreqInput({ value, onCommit }: { value: number; onCommit(v: number): void; }) {
    const [text, setText] = useState(String(value));
    useEffect(() => setText(String(value)), [value]);
    const commit = () => {
        let v = Number(text);
        if (!Number.isFinite(v)) v = value;
        v = Math.round(Math.min(20000, Math.max(20, v)));
        setText(String(v));
        if (v !== value) onCommit(v);
    };
    return (
        <input
            type="text"
            inputMode="numeric"
            value={text}
            onChange={e => setText(e.currentTarget.value)}
            onBlur={commit}
            onKeyDown={e => {
                if (e.key === "Enter") commit();
            }}
            title={`${value} Hz`}
            style={{
                width: "100%",
                minWidth: 0,
                background: "var(--background-tertiary,#1e1f22)",
                border: "1px solid rgba(255,255,255,.08)",
                color: "var(--text-normal,#dbdee1)",
                fontSize: 9,
                lineHeight: "14px",
                textAlign: "center",
                borderRadius: 4,
                padding: "1px 0",
                outline: "none"
            }}
        />
    );
}

export function EqCard({ config, setKc }: { config: KurtConfig; setKc(patch: KurtConfig): void; }) {
    const bands = useMemo(() => parseBands(config), [config.eqBands]);
    const enabled = bool(config, "eqEnabled", false);
    const q = Math.min(6, Math.max(0.3, num(config, "eqQ", 1)));
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        drawCurve(canvasRef.current, bands, enabled, q);
    }, [bands, enabled, q]);

    const writeBands = (next: EqBand[]) => setKc({ eqBands: JSON.stringify(next) });
    const setBand = (idx: number, patch: Partial<EqBand>) => writeBands(bands.map((b, i) => i === idx ? { ...b, ...patch } : b));
    const applyPreset = (gains: number[]) => writeBands(bands.map((b, i) => ({ f: b.f, g: Math.round(Math.min(12, Math.max(-12, gains[i])) * 10) / 10 })));

    return (
        <div style={{ marginTop: 12, padding: "12px 12px 10px", border: "1px solid rgba(175,227,127,.22)", borderRadius: 12, background: "rgba(0,0,0,.14)" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                <Text
                    label="16-Band Parametric EQ"
                    desc="Sixteen peaking bands on your outgoing voice before Opus. Applies live."
                />
                <Switch checked={enabled} onChange={v => setKc({ eqEnabled: v })} />
            </div>

            <canvas
                ref={canvasRef}
                style={{ width: "100%", height: 84, display: "block", borderRadius: 6, background: "rgba(0,0,0,.25)", border: "1px solid rgba(255,255,255,.06)", margin: "10px 0" }}
            />

            <div style={{ display: "grid", gridTemplateColumns: "repeat(16,minmax(0,1fr))", gap: 4, alignItems: "end" }}>
                {bands.map((b, i) => (
                    <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, minWidth: 0 }}>
                        <div style={{ fontSize: 10, lineHeight: "12px", height: 12, fontVariantNumeric: "tabular-nums", color: b.g > 0 ? "#23a55a" : b.g < 0 ? "#ed4245" : "var(--text-muted,#949ba4)" }}>
                            {b.g > 0 ? "+" : ""}{b.g === 0 ? 0 : b.g}
                        </div>
                        <input
                            type="range"
                            min={-12}
                            max={12}
                            step={0.5}
                            value={b.g}
                            onChange={e => setBand(i, { g: Number(e.currentTarget.value) })}
                            onDoubleClick={e => {
                                (e.currentTarget as HTMLInputElement).value = "0";
                                setBand(i, { g: 0 });
                            }}
                            title={`Band ${i + 1} gain in dB (double-click to reset)`}
                            style={{ writingMode: "vertical-lr", direction: "rtl", width: 18, height: 90, accentColor: "#AFE37F", cursor: "pointer", margin: "0 auto" }}
                        />
                        <FreqInput value={b.f} onCommit={f => setBand(i, { f })} />
                    </div>
                ))}
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                {EQ_PRESETS.map(([name, gains]) => (
                    <button
                        key={name}
                        type="button"
                        onClick={() => applyPreset(gains)}
                        style={{ padding: "4px 10px", border: "1px solid rgba(175,227,127,.28)", borderRadius: 6, background: "rgba(175,227,127,.06)", color: "var(--text-normal)", fontSize: 11, fontWeight: 600, cursor: "pointer" }}
                    >
                        {name}
                    </button>
                ))}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12 }}>
                <span style={labelStyle}>Band width (Q)</span>
                <div style={{ flex: "1 1 auto" }}>
                    <Slider
                        minValue={0.3}
                        maxValue={6}
                        initialValue={q}
                        keyboardStep={0.1}
                        onValueRender={(v: number) => v.toFixed(1)}
                        asValueChanges={v => setKc({ eqQ: Math.round(v * 10) / 10 })}
                    />
                </div>
                <span style={{ ...valueStyle, flex: "0 0 auto" }}>{q.toFixed(1)}</span>
            </div>

            <div style={{ ...descStyle, marginTop: 8 }}>Presets set the band gains; frequencies and Q stay as they are.</div>
        </div>
    );
}
