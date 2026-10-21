import { Plus, X } from "lucide-react";

const colors = {
  border: "#e2e4e8",
  text: "#111318",
  textMuted: "#6b7280",
};

export default function AddressListInput({ addresses, onChange }) {
  const update = (i, value) => {
    const next = [...addresses];
    next[i] = value;
    onChange(next);
  };

  const add = () => onChange([...addresses, ""]);
  const remove = (i) => onChange(addresses.filter((_, idx) => idx !== i));

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
        Address
      </label>
      {addresses.map((line, i) => (
        <div key={i} style={{ display: "flex", gap: 6, marginBottom: 6 }}>
          <input
            value={line}
            onChange={(e) => update(i, e.target.value)}
            placeholder={`Address line ${i + 1}`}
            style={{
              flex: 1,
              border: `1px solid ${colors.border}`,
              borderRadius: 7,
              padding: "8px 10px",
              fontSize: 13,
              boxSizing: "border-box",
            }}
          />
          {addresses.length > 1 && (
            <button type="button" onClick={() => remove(i)} style={btnStyle}>
              <X size={14} />
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        style={{
          ...btnStyle,
          width: "auto",
          padding: "6px 12px",
          fontSize: 12,
          gap: 6,
        }}
      >
        <Plus size={13} /> Add address
      </button>
    </div>
  );
}

const btnStyle = {
  width: 36,
  height: 36,
  borderRadius: 7,
  border: `1px solid ${colors.border}`,
  background: "none",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: colors.textMuted,
  flexShrink: 0,
};
