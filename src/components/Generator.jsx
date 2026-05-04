"use client";

import { useState } from "react";
import { models } from "@/lib/falModels";

export default function Generator() {
  const [selectedModel, setSelectedModel] = useState(null);
  const [selectedMode, setSelectedMode] = useState(null);
  const [files, setFiles] = useState([]);
  const [prompt, setPrompt] = useState("");

  return (
    <div style={{ padding: 20 }}>

      <h2>Choose Model</h2>

      {/* MODELS */}
      <div style={{ display: "flex", gap: 10 }}>
        {Object.keys(models.video).map((modelKey) => (
          <div
            key={modelKey}
            onClick={() => {
              setSelectedModel(modelKey);
              setSelectedMode(null);
            }}
            style={{
              padding: 20,
              border: "1px solid white",
              cursor: "pointer",
              background: selectedModel === modelKey ? "#333" : "#111"
            }}
          >
            {modelKey}
          </div>
        ))}
      </div>

      {/* MODES */}
      {selectedModel && (
        <>
          <h3 style={{ marginTop: 20 }}>Choose Mode</h3>

          <div style={{ display: "flex", gap: 10 }}>
            {Object.keys(models.video[selectedModel]).map((modeKey) => (
              <div
                key={modeKey}
                onClick={() => setSelectedMode(modeKey)}
                style={{
                  padding: 15,
                  border: "1px solid white",
                  cursor: "pointer",
                  background: selectedMode === modeKey ? "#444" : "#111"
                }}
              >
                {modeKey}
              </div>
            ))}
          </div>
        </>
      )}

      {/* INPUT AREA */}
      {selectedMode && (
        <>
          <h3 style={{ marginTop: 20 }}>Input</h3>

          <input
            type="file"
            multiple
            onChange={(e) => setFiles([...e.target.files])}
          />

          <br /><br />

          <textarea
            placeholder="Write prompt..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            style={{ width: 300, height: 100 }}
          />

          <br /><br />

          <button
            onClick={() => {
              console.log({
                endpoint: models.video[selectedModel][selectedMode],
                prompt,
                files
              });
            }}
          >
            Generate
          </button>
        </>
      )}

    </div>
  );
}
