"use client";

import { useEffect, useRef } from "react";

const CONFETTI_COLORS = ["#ff3d7f", "#f2b705", "#ef5b25", "#f4efe6"];
const PARTICLE_COUNT = 90;
const CONFETTI_MS = 2400;
const TOTAL_MS = 3300;

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  vr: number;
  size: number;
  color: string;
  shape: "rect" | "circle";
};

function createParticles(width: number): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, () => ({
    x: width / 2 + (Math.random() - 0.5) * width * 0.7,
    y: -20 - Math.random() * 100,
    vx: (Math.random() - 0.5) * 3.2,
    vy: 2 + Math.random() * 3,
    rotation: Math.random() * 360,
    vr: (Math.random() - 0.5) * 12,
    size: 6 + Math.random() * 6,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    shape: Math.random() > 0.5 ? "rect" : "circle",
  }));
}

/**
 * Confeti en canvas (sin dependencias externas) + tarjeta con el mensaje.
 * No bloquea la interacción (pointer-events: none) y se autodestruye sola.
 */
export function MilestoneCelebration({
  message,
  onDone,
}: {
  message: string;
  onDone: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    const particles = createParticles(canvas.width);
    const start = performance.now();
    let frame = 0;

    function tick(now: number) {
      const elapsed = now - start;
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      const fade = Math.max(0, 1 - elapsed / CONFETTI_MS);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.05;
        p.rotation += p.vr;

        ctx!.save();
        ctx!.globalAlpha = fade;
        ctx!.translate(p.x, p.y);
        ctx!.rotate((p.rotation * Math.PI) / 180);
        ctx!.fillStyle = p.color;
        if (p.shape === "rect") {
          ctx!.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        } else {
          ctx!.beginPath();
          ctx!.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx!.fill();
        }
        ctx!.restore();
      }

      if (elapsed < CONFETTI_MS) {
        frame = requestAnimationFrame(tick);
      }
    }
    frame = requestAnimationFrame(tick);

    const timeout = setTimeout(() => onDoneRef.current(), TOTAL_MS);

    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timeout);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div className="milestone-overlay">
      <canvas ref={canvasRef} className="milestone-canvas" />
      <div className="milestone-toast">
        <p className="milestone-toast-text">{message}</p>
      </div>
    </div>
  );
}
