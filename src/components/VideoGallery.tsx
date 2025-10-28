import { useState } from "react";

// Ejemplo opcional de isla React para carrusel de videos
export default function VideoGallery() {
  const [active, setActive] = useState(0);
  const sources = [
    { src: "/media/pos-demo-720p.mp4", label: "Demo 1" },
    { src: "/media/pos-workflow-720p.mp4", label: "Flujo de trabajo" }
  ];
  return (
    <div style={{display:"grid", gap: 12}}>
      <video controls preload="metadata" poster="/assets/pos-poster.jpg" style={{ width: "100%", borderRadius: 12 }}>
        <source src={sources[active].src} type="video/mp4" />
      </video>
      <div style={{display:"flex", gap:8, flexWrap:"wrap"}}>
        {sources.map((s, i) => (
          <button
            key={s.src}
            onClick={() => setActive(i)}
            style={{
              padding: "8px 10px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,.15)",
              background: i === active ? "rgba(91,156,255,.2)" : "transparent",
              color: "inherit",
              cursor: "pointer"
            }}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}