import { useRef, useState } from "react";

interface ZoomImageProps {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
}

export function ZoomImage({ src, alt, className, style }: ZoomImageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [lens, setLens] = useState<{ x: number; y: number; visible: boolean }>({
    x: 0,
    y: 0,
    visible: false,
  });

  const LENS_SIZE = 150;
  const ZOOM_FACTOR = 2;

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setLens({ x, y, visible: true });
  }

  function handleMouseLeave() {
    setLens((prev) => ({ ...prev, visible: false }));
  }

  const bgX = lens.x * ZOOM_FACTOR - LENS_SIZE / 2;
  const bgY = lens.y * ZOOM_FACTOR - LENS_SIZE / 2;

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden select-none ${className ?? ""}`}
      style={{ ...style, cursor: lens.visible ? "crosshair" : "default" }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover"
        draggable={false}
      />
      {/* Zoom lens */}
      <div
        style={{
          position: "absolute",
          left: lens.x - LENS_SIZE / 2,
          top: lens.y - LENS_SIZE / 2,
          width: LENS_SIZE,
          height: LENS_SIZE,
          borderRadius: "50%",
          border: "2px solid rgba(212,175,55,0.7)",
          boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
          backgroundImage: `url(${src})`,
          backgroundRepeat: "no-repeat",
          backgroundSize: `${ZOOM_FACTOR * 100}%`,
          backgroundPosition: `-${bgX}px -${bgY}px`,
          opacity: lens.visible ? 1 : 0,
          transition: "opacity 0.15s ease",
          pointerEvents: "none",
          zIndex: 10,
        }}
      />
    </div>
  );
}
