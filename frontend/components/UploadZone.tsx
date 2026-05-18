"use client";
import { useCallback, useState } from "react";
import { Upload, FileText } from "lucide-react";

interface UploadZoneProps {
  onFile: (file: File) => void;
  disabled?: boolean;
}

export default function UploadZone({ onFile, disabled }: UploadZoneProps) {
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState("");

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) { setFileName(file.name); onFile(file); }
  }, [onFile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setFileName(file.name); onFile(file); }
  };

  return (
    <label
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      style={{
        display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
        gap:10, padding:"24px 16px", borderRadius:12, cursor: disabled ? "not-allowed" : "pointer",
        border: `2px dashed ${dragging ? "rgba(220,38,38,0.6)" : "rgba(255,255,255,0.12)"}`,
        background: dragging ? "rgba(220,38,38,0.06)" : "rgba(255,255,255,0.02)",
        transition:"all 0.2s", opacity: disabled ? 0.5 : 1,
      }}
    >
      <input type="file" accept=".pdf,.docx" style={{ display:"none" }} onChange={handleChange} disabled={disabled} />
      {fileName ? (
        <>
          <FileText size={22} color="#f87171" />
          <span style={{ fontSize:13, color:"#f87171", fontWeight:500, textAlign:"center", wordBreak:"break-all" }}>{fileName}</span>
          <span style={{ fontSize:11, color:"rgba(255,255,255,0.4)" }}>Click to change file</span>
        </>
      ) : (
        <>
          <Upload size={22} color="rgba(255,255,255,0.4)" />
          <span style={{ fontSize:13, color:"rgba(255,255,255,0.5)", fontWeight:500 }}>Drop PDF or DOCX here</span>
          <span style={{ fontSize:11, color:"rgba(255,255,255,0.3)" }}>or click to browse</span>
        </>
      )}
    </label>
  );
}
