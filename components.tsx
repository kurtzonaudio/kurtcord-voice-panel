/*
 * KurtcordVoicePanel, a Vencord/Equicord user plugin
 * Copyright (c) 2026 Kurtzon (Kurtzon Audio)
 * SPDX-License-Identifier: MIT
 */

import { Switch } from "@components/Switch";
import { identity } from "@utils/misc";
import { React, Select, Slider } from "@webpack/common";

export const labelStyle: React.CSSProperties = { fontSize: 13, fontWeight: 600, color: "var(--text-normal)", lineHeight: "16px" };
export const descStyle: React.CSSProperties = { fontSize: 11, color: "var(--text-muted)", lineHeight: "14px", marginTop: 1 };
export const valueStyle: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: "#AFE37F", fontVariantNumeric: "tabular-nums", flex: "0 0 auto" };
export const sectionStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 8,
    margin: "16px 0 4px",
    fontSize: 10.5,
    fontWeight: 800,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: "#AFE37F"
};
export const dividerStyle: React.CSSProperties = {
    height: 1,
    background: "linear-gradient(90deg, rgba(175,227,127,.35), rgba(175,227,127,0))",
    margin: "12px 0"
};
export const rowStyle: React.CSSProperties = { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, minHeight: 30, padding: "3px 0" };

export function Section({ label }: { label: string; }) {
    return <div style={sectionStyle}>{label}</div>;
}

export function Divider() {
    return <div style={dividerStyle} />;
}

export function Text({ label, desc }: { label: string; desc?: string; }) {
    return (
        <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
            <span style={labelStyle}>{label}</span>
            {desc ? <span style={descStyle}>{desc}</span> : null}
        </div>
    );
}

export function SliderRow({ label, desc, value, min, max, step, format, onChange }: {
    label: string;
    desc?: string;
    value: number;
    min: number;
    max: number;
    step?: number;
    format(v: number): string;
    onChange(v: number): void;
}) {
    return (
        <div style={{ padding: "5px 0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                <Text label={label} desc={desc} />
                <span style={valueStyle}>{format(value)}</span>
            </div>
            <Slider
                minValue={min}
                maxValue={max}
                initialValue={value}
                keyboardStep={step}
                onValueRender={(v: number) => format(v)}
                asValueChanges={onChange}
            />
        </div>
    );
}

export function SwitchRow({ label, desc, value, disabled, onChange }: {
    label: string;
    desc?: string;
    value: boolean;
    disabled?: boolean;
    onChange(v: boolean): void;
}) {
    return (
        <div style={{ ...rowStyle, opacity: disabled ? 0.5 : 1 }}>
            <Text label={label} desc={desc} />
            <Switch checked={value} disabled={disabled} onChange={onChange} />
        </div>
    );
}

export function SelectRow({ label, desc, value, options, onChange }: {
    label: string;
    desc?: string;
    value: string | number;
    options: { value: string | number; label: string; }[];
    onChange(v: any): void;
}) {
    return (
        <div style={{ padding: "5px 0" }}>
            <Text label={label} desc={desc} />
            <div style={{ marginTop: 6 }}>
                <Select
                    options={options}
                    serialize={identity}
                    isSelected={(v: any) => v === value}
                    select={onChange}
                />
            </div>
        </div>
    );
}

export function SmallButton({ label, title, disabled, onClick }: {
    label: string;
    title?: string;
    disabled?: boolean;
    onClick(): void;
}) {
    return (
        <button
            type="button"
            title={title}
            disabled={disabled}
            onClick={onClick}
            style={{
                flex: "1 1 0",
                padding: "7px 8px",
                border: "1px solid rgba(175,227,127,.28)",
                borderRadius: 7,
                background: "rgba(175,227,127,.08)",
                color: disabled ? "var(--text-muted)" : "var(--text-normal)",
                fontSize: 11,
                fontWeight: 700,
                cursor: disabled ? "not-allowed" : "pointer"
            }}
        >
            {label}
        </button>
    );
}
