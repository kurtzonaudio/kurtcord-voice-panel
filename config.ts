/*
 * KurtcordVoicePanel, a Vencord/Equicord user plugin
 * Copyright (c) 2026 Kurtzon (Kurtzon Audio)
 * SPDX-License-Identifier: MIT
 */

export interface KurtConfig {
    [key: string]: any;
}

export const CONFIG_KEY = "discord-stereo-config";

export const EQ_FREQS = [25, 40, 63, 100, 160, 250, 400, 630, 1000, 1600, 2500, 4000, 6300, 10000, 12500, 16000];

export const CAMERA_PRESETS: Record<string, { vW: number; vH: number; vFps: number; vbMin: number; vbTarget: number; vbMax: number; }> = {
    "720p60": { vW: 1280, vH: 720, vFps: 60, vbMin: 2500000, vbTarget: 6000000, vbMax: 12000000 },
    "1080p30": { vW: 1920, vH: 1080, vFps: 30, vbMin: 4000000, vbTarget: 8000000, vbMax: 16000000 },
    "1080p60": { vW: 1920, vH: 1080, vFps: 60, vbMin: 6000000, vbTarget: 12000000, vbMax: 24000000 },
    "1440p30": { vW: 2560, vH: 1440, vFps: 30, vbMin: 8000000, vbTarget: 16000000, vbMax: 40000000 },
    "1440p60": { vW: 2560, vH: 1440, vFps: 60, vbMin: 10000000, vbTarget: 20000000, vbMax: 40000000 },
    "1080p120": { vW: 1920, vH: 1080, vFps: 120, vbMin: 10000000, vbTarget: 20000000, vbMax: 40000000 },
    "2160p60": { vW: 3840, vH: 2160, vFps: 60, vbMin: 20000000, vbTarget: 40000000, vbMax: 80000000 }
};

export const SAMPLE_RATES = [
    { value: 8000, label: "8 kHz" },
    { value: 12000, label: "12 kHz" },
    { value: 16000, label: "16 kHz" },
    { value: 24000, label: "24 kHz" },
    { value: 48000, label: "48 kHz" },
    { value: 96000, label: "96 kHz" }
];

export function readKurtcordConfig(): KurtConfig {
    let raw: string | null = null;
    try {
        raw = localStorage.getItem(CONFIG_KEY);
    } catch { }
    if (raw == null) {
        try {
            const f = document.createElement("iframe");
            f.style.display = "none";
            document.documentElement.appendChild(f);
            raw = f.contentWindow?.localStorage.getItem(CONFIG_KEY) ?? null;
            f.remove();
        } catch { }
    }
    try {
        return raw ? JSON.parse(raw) || {} : {};
    } catch {
        return {};
    }
}

export function writeKurtcordConfig(patch: KurtConfig): KurtConfig {
    const merged = { ...readKurtcordConfig(), ...patch };
    const json = JSON.stringify(merged);
    try {
        localStorage.setItem(CONFIG_KEY, json);
    } catch { }
    try {
        const f = document.createElement("iframe");
        f.style.display = "none";
        document.documentElement.appendChild(f);
        f.contentWindow?.localStorage.setItem(CONFIG_KEY, json);
        f.remove();
    } catch { }
    try {
        (window as any).__kurtcord?.syncConfig?.(merged);
    } catch { }
    return merged;
}

export function applySpatial(config: KurtConfig) {
    try {
        (window as any).__kurtcord?.setSpatial?.({
            enabled: !!config.spatialEnabled,
            spread: num(config, "spatialSpread", 120),
            distance: num(config, "spatialDistance", 1.2),
            elevation: num(config, "spatialElevation", 0),
            rotation: num(config, "spatialRotation", 0),
            profile: num(config, "spatialProfile", 0),
            gain: num(config, "spatialGain", 0),
            balance: num(config, "spatialBalance", 0) / 100,
            swap: !!config.spatialSwap,
            maxObjects: num(config, "spatialMaxObjects", 8),
            order: num(config, "spatialOrder", 3),
            input: !!(config.spatialInput && config.stereo)
        });
    } catch { }
}

export function num(config: KurtConfig, key: string, fallback: number): number {
    const v = Number(config[key]);
    return Number.isFinite(v) ? v : fallback;
}

export function bool(config: KurtConfig, key: string, fallback = false): boolean {
    const v = config[key];
    return typeof v === "boolean" ? v : v === "true" ? true : v === "false" ? false : fallback;
}
