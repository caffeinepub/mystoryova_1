import { useCallback, useRef } from "react";

interface ZoomImageProps {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
}

export function ZoomImage({ src, alt, className, style }: ZoomImageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lensRef = useRef<HTMLDivElement>(null);

  const LENS_SIZE = 150;
  const ZOOM_FACTOR = 2.5;

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    const lens = lensRef.current;
    if (!container || !lens) return;
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const bgX = x * ZOOM_FACTOR - LENS_SIZE / 2;
    const bgY = y * ZOOM_FACTOR - LENS_SIZE / 2;
    lens.style.left = `${x - LENS_SIZE / 2}px`;
    lens.style.top = `${y - LENS_SIZE / 2}px`;
    lens.style.backgroundPosition = `-${bgX}px -${bgY}px`;
    lens.style.opacity = "1";
  }, []);

  const handleMouseLeave = useCallback(() => {
    const lens = lensRef.current;
    if (lens) lens.style.opacity = "0";
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden select-none ${className ?? ""}`}
      style={{ ...style, cursor: "crosshair" }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover"
        draggable={false}
      />
      <div
        ref={lensRef}
        style={{
          position: "absolute",
          width: LENS_SIZE,
          height: LENS_SIZE,
          borderRadius: "50%",
          border: "2px solid rgba(212,175,55,0.7)",
          boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
          backgroundImage: `url(${src})`,
          backgroundRepeat: "no-repeat",
          backgroundSize: `${ZOOM_FACTOR * 100}%`,
          opacity: 0,
          pointerEvents: "none",
          zIndex: 10,
          willChange: "left, top",
        }}
      />
    </div>
  );
}
