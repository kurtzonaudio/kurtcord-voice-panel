/*
 * KurtcordVoicePanel, a Vencord/Equicord user plugin
 * Copyright (c) 2026 Kurtzon (Kurtzon Audio)
 * SPDX-License-Identifier: MIT
 */

import { Switch } from "@components/Switch";
import { React, useEffect, useState } from "@webpack/common";

import { descStyle, Text } from "./components";
import { bool, KurtConfig } from "./config";

interface VstItem {
    id: string;
    p: string;
    n: string;
    b: boolean;
    k?: string;
}

type VstKind = "vst3" | "vst2";

function dvx(): any {
    try {
        return (window as any).__dvx ?? null;
    } catch {
        return null;
    }
}

function bridge(): any {
    try {
        return (window as any).__kurtcord ?? null;
    } catch {
        return null;
    }
}

function parseChain(config: KurtConfig, key: string): VstItem[] {
    let parsed: any = null;
    try {
        parsed = JSON.parse(String(config[key] || ""));
    } catch { }
    if (!Array.isArray(parsed)) return [];
    const out: VstItem[] = [];
    for (let i = 0; i < parsed.length; i++) {
        const item = parsed[i];
        if (!item || typeof item.p !== "string" || !item.p) continue;
        out.push({ id: String(item.id || "v" + i), p: item.p, n: String(item.n || item.p), b: !!item.b, k: item.k });
    }
    return out;
}

function baseName(path: string, ext: RegExp): string {
    let name = String(path).replace(/[\\/]+$/, "");
    name = name.split(/[\\/]/).pop() || name;
    return name.replace(ext, "");
}

function openEditor(item: VstItem, kind: VstKind) {
    try {
        dvx()?.openEditor?.({ ...item, k: item.k || (kind === "vst2" ? "v2" : "vst3") });
    } catch { }
}

function pickPaths(kind: VstKind, mode: "files" | "folder", onPaths: (paths: string[]) => void) {
    try {
        const p = bridge()?.vstPick?.({ mode, kind, multi: mode === "files" });
        if (!p || typeof p.then !== "function") return;
        p.then((paths: any) => {
            if (Array.isArray(paths) && paths.length) onPaths(paths.map(String));
        }).catch(() => { });
    } catch { }
}

function TinyButton({ label, title, onClick }: { label: string; title?: string; onClick(): void; }) {
    return (
        <button
            type="button"
            title={title}
            onClick={onClick}
            style={{
                padding: "3px 7px",
                border: "1px solid rgba(255,255,255,.14)",
                borderRadius: 5,
                background: "var(--background-tertiary,#1e1f22)",
                color: "var(--text-normal)",
                fontSize: 10,
                fontWeight: 700,
                cursor: "pointer",
                flex: "0 0 auto"
            }}
        >
            {label}
        </button>
    );
}

function VstCard({ kind, config, setKc }: { kind: VstKind; config: KurtConfig; setKc(patch: KurtConfig): void; }) {
    const v2 = kind === "vst2";
    const enabledKey = v2 ? "vst2Enabled" : "vstEnabled";
    const chainKey = v2 ? "vst2Chain" : "vstChain";
    const title = v2 ? "VST2 Plugins" : "VST3 Plugins";
    const desc = v2
        ? "Run VST2 .dll effects on your outgoing voice, after the EQ and before Opus. Runs after the VST3 chain."
        : "Run VST3 effects on your outgoing voice, after the EQ and before Opus.";
    const empty = v2
        ? "No VST2 plugins yet. Use Add VST2 to pick .dll or .vst files."
        : "No plugins in the chain yet. Use Add VST3 to pick .vst3 files or scan a folder.";

    const enabled = bool(config, enabledKey, false);
    const list = parseChain(config, chainKey);
    const [status, setStatus] = useState<{ line: string; err: boolean; }>({ line: "", err: false });

    useEffect(() => {
        const update = () => {
            const vst = dvx()?.vst;
            const active = enabled && list.length > 0;
            let line: string;
            if (!vst) line = "";
            else if (vst.error) line = `Engine: ${vst.error}`;
            else if (!active) line = "Engine: off";
            else if (!vst.ready) line = "Engine: starting…";
            else if (vst.stats) line = `Engine: running | ${vst.stats.processed} blocks, ${vst.stats.avgUs} µs each`;
            else line = "Engine: running";
            setStatus(prev => prev.line === line && prev.err === !!vst?.error ? prev : { line, err: !!vst?.error });
        };
        update();
        const id = setInterval(update, 1000);
        return () => clearInterval(id);
    }, [enabled, list.length]);

    const save = (next: VstItem[]) => setKc({ [chainKey]: JSON.stringify(next) });
    const patchItem = (idx: number, patch: Partial<VstItem>) => save(list.map((it, i) => i === idx ? { ...it, ...patch } : it));
    const move = (idx: number, dir: -1 | 1) => {
        const to = idx + dir;
        if (to < 0 || to >= list.length) return;
        const next = list.slice();
        const tmp = next[idx];
        next[idx] = next[to];
        next[to] = tmp;
        save(next);
    };
    const addPaths = (paths: string[]) => {
        const stamp = Date.now();
        const next = list.slice();
        for (let i = 0; i < paths.length && i < 512; i++) {
            next.push({
                id: (v2 ? "w" : "v") + (stamp + i),
                p: paths[i],
                n: baseName(paths[i], v2 ? /\.(dll|vst)$/i : /\.vst3$/i),
                b: false,
                ...(v2 ? { k: "v2" } : {})
            });
        }
        save(next);
    };

    return (
        <div style={{ marginTop: 12, padding: "12px 12px 10px", border: "1px solid rgba(175,227,127,.22)", borderRadius: 12, background: "rgba(0,0,0,.14)" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                <Text label={title} desc={desc} />
                <Switch checked={enabled} onChange={v => setKc({ [enabledKey]: v })} />
            </div>

            <div style={{ marginTop: 6 }}>
                {list.length === 0
                    ? <div style={descStyle}>{empty}</div>
                    : list.map((item, idx) => (
                        <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 0" }}>
                            <div
                                title={item.p}
                                style={{ flex: "1 1 auto", minWidth: 0, fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--text-normal)" }}
                            >
                                {idx + 1}. {item.n}
                            </div>
                            <TinyButton label={item.b ? "Bypassed" : "Active"} title="Toggle this plugin" onClick={() => patchItem(idx, { b: !item.b })} />
                            <TinyButton label="↑" title="Move up" onClick={() => move(idx, -1)} />
                            <TinyButton label="↓" title="Move down" onClick={() => move(idx, 1)} />
                            <TinyButton label="Editor" title="Open the plugin window" onClick={() => openEditor(item, kind)} />
                            <TinyButton label="Remove" onClick={() => save(list.filter((_, i) => i !== idx))} />
                        </div>
                    ))
                }
            </div>

            <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                <button
                    type="button"
                    onClick={() => pickPaths(kind, "files", addPaths)}
                    style={{ flex: "1 1 0", padding: "6px 8px", border: "1px solid rgba(255,255,255,.14)", borderRadius: 6, background: "rgba(175,227,127,.06)", color: "var(--text-normal)", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                >
                    {v2 ? "Add VST2…" : "Add VST3…"}
                </button>
                <button
                    type="button"
                    onClick={() => pickPaths(kind, "folder", addPaths)}
                    style={{ flex: "1 1 0", padding: "6px 8px", border: "1px solid rgba(255,255,255,.14)", borderRadius: 6, background: "rgba(175,227,127,.06)", color: "var(--text-normal)", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                >
                    Add folder…
                </button>
            </div>

            {status.line ? <div style={{ ...descStyle, marginTop: 8, color: status.err ? "var(--status-danger,#ed4245)" : undefined }}>{status.line}</div> : null}
        </div>
    );
}

export function VstSection({ config, setKc }: { config: KurtConfig; setKc(patch: KurtConfig): void; }) {
    return (
        <>
            <VstCard kind="vst3" config={config} setKc={setKc} />
            <VstCard kind="vst2" config={config} setKc={setKc} />
        </>
    );
}
