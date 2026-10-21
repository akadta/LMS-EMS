const colors = {
  text: "#111318",
};

const PRESETS = [
  "#1d4ed8",
  "#0f172a",
  "#059669",
  "#d97706",
  "#dc2626",
  "#7c3aed",
];

export default function ColorThemePicker({ value, onChange }) {
  return (
    <div>
      <label
        style={{
          fontSize: 12.5,
          fontWeight: 600,
          color: colors.text,
          marginBottom: 6,
          display: "block",
        }}
      >
        Dashboard Theme Color
      </label>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        {PRESETS.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            style={{
              width: 26,
              height: 26,
              borderRadius: "50%",
              background: color,
              cursor: "pointer",
              border:
                value === color
                  ? `2px solid ${colors.text}`
                  : "2px solid transparent",
              boxShadow: "0 0 0 1px rgba(0,0,0,0.08)",
              padding: 0,
            }}
          />
        ))}
        <input
          type="color"
          value={value || "#1d4ed8"}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: 30,
            height: 30,
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            background: "none",
          }}
        />
      </div>
    </div>
  );
}
