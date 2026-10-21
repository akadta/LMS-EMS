import { useMemo } from "react";
import { AlertTriangle } from "lucide-react";
import { contrastLabel } from "../../utils/contrast";

const colors = {
  text: "#111318",
  textMuted: "#6b7280",
  textFaint: "#9ca3af",
  border: "#e2e4e8",
  card: "#f9fafb",
  amberBg: "#fffbeb",
  amberBorder: "#fde68a",
  amberText: "#92400e",
};

// Curated presets — real products offer these alongside raw pickers so
// results still look intentional even without a design background.
const PRESETS = [
  { name: "Indigo", accent: "#6366f1", sidebar: "#0e1220", header: "#0a0d16" },
  { name: "Emerald", accent: "#059669", sidebar: "#0b1f18", header: "#081712" },
  { name: "Amber", accent: "#d97706", sidebar: "#1f1608", header: "#171006" },
  { name: "Rose", accent: "#e11d48", sidebar: "#1f0d12", header: "#17090c" },
  { name: "Slate", accent: "#334155", sidebar: "#0f172a", header: "#0a101f" },
];

export default function ThemeCustomizer({ value, onChange }) {
  // value = { accent, sidebar, header }
  const set = (key) => (e) => onChange({ ...value, [key]: e.target.value });
  const applyPreset = (preset) =>
    onChange({
      accent: preset.accent,
      sidebar: preset.sidebar,
      header: preset.header,
    });

  // Contrast checks that actually matter for this UI:
  // 1. Accent text/icons on white content background
  // 2. White text on sidebar background
  // 3. White text on header background
  const checks = useMemo(
    () => ({
      accentOnWhite: contrastLabel(value.accent, "#ffffff"),
      whiteOnSidebar: contrastLabel("#ffffff", value.sidebar),
      whiteOnHeader: contrastLabel("#ffffff", value.header),
    }),
    [value],
  );

  const warnings = Object.entries(checks).filter(([, c]) => !c.ok);

  return (
    <div>
      <label style={styles.label}>Dashboard theme</label>

      <div style={styles.presetRow}>
        {PRESETS.map((p) => (
          <button
            key={p.name}
            type="button"
            title={p.name}
            onClick={() => applyPreset(p)}
            style={{
              ...styles.presetSwatch,
              background: p.accent,
              border:
                value.accent === p.accent &&
                value.sidebar === p.sidebar &&
                value.header === p.header
                  ? `2px solid ${colors.text}`
                  : "2px solid transparent",
            }}
          />
        ))}
      </div>

      <div style={styles.grid}>
        <ColorField
          label="Accent"
          value={value.accent}
          onChange={set("accent")}
        />
        <ColorField
          label="Sidebar"
          value={value.sidebar}
          onChange={set("sidebar")}
        />
        <ColorField
          label="Header"
          value={value.header}
          onChange={set("header")}
        />
      </div>

      {warnings.length > 0 && (
        <div style={styles.warningBox}>
          <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <div style={{ fontWeight: 600, fontSize: 12.5 }}>
              Low contrast detected
            </div>
            <div style={{ fontSize: 12, marginTop: 2 }}>
              {warnings.map(([key, c]) => contrastMessage(key, c)).join(" ")}
            </div>
          </div>
        </div>
      )}

      <PreviewMockup
        accent={value.accent}
        sidebar={value.sidebar}
        header={value.header}
      />
    </div>
  );
}

function contrastMessage(key, c) {
  const ratio = c.ratio.toFixed(1);
  if (key === "accentOnWhite")
    return `Accent color has ${ratio}:1 contrast on white — may be hard to read for buttons/links.`;
  if (key === "whiteOnSidebar")
    return `Sidebar color has ${ratio}:1 contrast with white text — sidebar labels may be hard to read.`;
  if (key === "whiteOnHeader")
    return `Header color has ${ratio}:1 contrast with white text — header icons/text may be hard to read.`;
  return "";
}

function ColorField({ label, value, onChange }) {
  return (
    <div>
      <label style={styles.subLabel}>{label}</label>
      <div style={styles.colorFieldRow}>
        <input
          type="color"
          value={value}
          onChange={onChange}
          style={styles.colorInput}
        />
        <input
          type="text"
          value={value}
          onChange={onChange}
          style={styles.hexInput}
          maxLength={7}
        />
      </div>
    </div>
  );
}

function PreviewMockup({ accent, sidebar, header }) {
  return (
    <div style={{ marginTop: 14 }}>
      <div style={styles.previewLabel}>Live preview</div>
      <div style={styles.previewFrame}>
        <div style={{ ...styles.previewSidebar, background: sidebar }}>
          <div style={{ ...styles.previewLogo, background: accent }} />
          <div style={styles.previewNavLine(0.28)} />
          <div style={styles.previewNavLine(0.16)} />
          <div style={styles.previewNavLine(0.16)} />
        </div>
        <div style={styles.previewMain}>
          <div style={{ ...styles.previewHeader, background: header }}>
            <div style={{ ...styles.previewAvatar, background: accent }} />
          </div>
          <div style={styles.previewContent}>
            <div style={styles.previewTitleBar} />
            <div style={{ display: "flex", gap: 8 }}>
              <div
                style={{
                  ...styles.previewCard,
                  background: `${accent}1a`,
                  borderLeft: `3px solid ${accent}`,
                }}
              />
              <div style={styles.previewCardAlt} />
            </div>
            <div style={{ ...styles.previewButton, background: accent }} />
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  label: {
    fontSize: 12.5,
    fontWeight: 600,
    color: colors.text,
    marginBottom: 8,
    display: "block",
  },
  subLabel: {
    fontSize: 11.5,
    fontWeight: 600,
    color: colors.textMuted,
    marginBottom: 4,
    display: "block",
  },
  presetRow: { display: "flex", gap: 8, marginBottom: 12 },
  presetSwatch: {
    width: 26,
    height: 26,
    borderRadius: "50%",
    cursor: "pointer",
    boxShadow: "0 0 0 1px rgba(0,0,0,0.08)",
    padding: 0,
  },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 },
  colorFieldRow: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    border: `1px solid ${colors.border}`,
    borderRadius: 7,
    padding: 4,
  },
  colorInput: {
    width: 28,
    height: 28,
    border: "none",
    borderRadius: 5,
    cursor: "pointer",
    background: "none",
    padding: 0,
    flexShrink: 0,
  },
  hexInput: {
    border: "none",
    outline: "none",
    fontSize: 12,
    width: "100%",
    color: colors.text,
    fontFamily: "monospace",
  },
  warningBox: {
    display: "flex",
    gap: 8,
    marginTop: 10,
    padding: "8px 10px",
    background: colors.amberBg,
    border: `1px solid ${colors.amberBorder}`,
    borderRadius: 8,
    color: colors.amberText,
  },
  previewLabel: { fontSize: 11.5, color: colors.textMuted, marginBottom: 6 },
  previewFrame: {
    display: "flex",
    height: 130,
    borderRadius: 10,
    overflow: "hidden",
    border: `1px solid ${colors.border}`,
  },
  previewSidebar: {
    width: 42,
    padding: "8px 6px",
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  previewLogo: { width: 14, height: 14, borderRadius: 4 },
  previewNavLine: (opacity) => ({
    height: 4,
    width: "70%",
    borderRadius: 2,
    background: `rgba(255,255,255,${opacity})`,
  }),
  previewMain: { flex: 1, display: "flex", flexDirection: "column" },
  previewHeader: {
    height: 22,
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    padding: "0 8px",
  },
  previewAvatar: { width: 12, height: 12, borderRadius: "50%" },
  previewContent: {
    flex: 1,
    background: "#ffffff",
    padding: 10,
    display: "flex",
    flexDirection: "column",
    gap: 7,
  },
  previewTitleBar: {
    height: 6,
    width: "35%",
    background: colors.text,
    borderRadius: 2,
  },
  previewCard: { flex: 1, height: 28, borderRadius: 5 },
  previewCardAlt: {
    flex: 1,
    height: 28,
    borderRadius: 5,
    background: colors.card,
    border: `1px solid ${colors.border}`,
  },
  previewButton: { width: 46, height: 12, borderRadius: 3 },
};
