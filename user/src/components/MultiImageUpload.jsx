import { useRef } from "react";
import { Plus, X, Image as ImageIcon } from "lucide-react";

// existing: [{id, url}]  newFiles: File[]
export default function MultiImageUpload({
  existing = [],
  newFiles = [],
  onRemoveExisting,
  onAddFiles,
  onRemoveNewFile,
}) {
  const inputRef = useRef(null);

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
      {existing.map((img) => (
        <div key={`e-${img.id}`} style={tileStyle}>
          <img src={img.url} alt="" style={imgStyle} />
          <button
            type="button"
            onClick={() => onRemoveExisting(img.id)}
            style={removeBtnStyle}
          >
            <X size={12} />
          </button>
        </div>
      ))}
      {newFiles.map((file, idx) => (
        <div key={`n-${idx}`} style={tileStyle}>
          <img src={URL.createObjectURL(file)} alt="" style={imgStyle} />
          <button
            type="button"
            onClick={() => onRemoveNewFile(idx)}
            style={removeBtnStyle}
          >
            <X size={12} />
          </button>
        </div>
      ))}
      <div
        onClick={() => inputRef.current?.click()}
        style={{
          ...tileStyle,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "1.5px dashed #d1d5db",
          cursor: "pointer",
          flexDirection: "column",
          gap: 4,
          color: "#9ca3af",
        }}
      >
        <ImageIcon size={18} />
        <Plus size={12} />
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => {
            onAddFiles(Array.from(e.target.files || []));
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}

const tileStyle = {
  width: 84,
  height: 84,
  borderRadius: 10,
  overflow: "hidden",
  position: "relative",
  background: "#f3f4f6",
  flexShrink: 0,
};
const imgStyle = { width: "100%", height: "100%", objectFit: "cover" };
const removeBtnStyle = {
  position: "absolute",
  top: 3,
  right: 3,
  width: 18,
  height: 18,
  borderRadius: "50%",
  background: "rgba(0,0,0,0.6)",
  color: "#fff",
  border: "none",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
};
