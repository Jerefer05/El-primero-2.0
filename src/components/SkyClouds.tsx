"use client";

import { useEffect, useRef } from "react";
import Sun from "@/components/Sun";

// Nubes decorativas del fondo: formas suaves con bordes esponjosos (filtro SVG),
// repartidas a lo largo de la página detrás del contenido. Con el mouse cerca,
// se corren suavemente y después vuelven a su lugar.

type Cloud = {
  top: string;
  left: string;
  width: string;
  opacity: number;
  flip?: boolean;
};

const clouds: Cloud[] = [
  // En la portada (medido en alto de pantalla para que no dependa del largo de la página)
  { top: "6vh", left: "-12%", width: "clamp(360px, 52vw, 860px)", opacity: 0.9 },
  { top: "14vh", left: "62%", width: "clamp(320px, 44vw, 760px)", opacity: 0.8, flip: true },
  { top: "62vh", left: "30%", width: "clamp(380px, 60vw, 980px)", opacity: 0.85 },
  // A lo largo del resto de la página
  { top: "17%", left: "-18%", width: "clamp(380px, 62vw, 980px)", opacity: 0.95 },
  { top: "27%", left: "58%", width: "clamp(340px, 54vw, 860px)", opacity: 0.85, flip: true },
  { top: "43%", left: "-22%", width: "clamp(360px, 58vw, 920px)", opacity: 0.75 },
  { top: "56%", left: "52%", width: "clamp(360px, 60vw, 940px)", opacity: 0.7, flip: true },
  { top: "72%", left: "-14%", width: "clamp(340px, 52vw, 840px)", opacity: 0.55 },
  { top: "84%", left: "60%", width: "clamp(320px, 50vw, 800px)", opacity: 0.45, flip: true },
];

// Círculos que forman un cúmulo: base ancha y plana, copos más altos en el centro
const puffs = [
  { cx: 90, cy: 150, r: 48 },
  { cx: 150, cy: 120, r: 62 },
  { cx: 225, cy: 95, r: 78 },
  { cx: 305, cy: 115, r: 64 },
  { cx: 365, cy: 145, r: 46 },
  { cx: 190, cy: 150, r: 55 },
  { cx: 270, cy: 150, r: 58 },
];

function CloudShape({ fill, filter, dy = 0 }: { fill: string; filter: string; dy?: number }) {
  return (
    <g fill={fill} filter={`url(#${filter})`} transform={`translate(0 ${dy})`}>
      {puffs.map((puff, index) => (
        <circle key={index} cx={puff.cx} cy={puff.cy} r={puff.r} />
      ))}
      <ellipse cx="228" cy="172" rx="170" ry="30" />
    </g>
  );
}

// Cada nube se dibuja en tres capas (fondo difuso, sombra y brillo), cada una
// deformada con ruido para que los bordes queden esponjosos como un cúmulo real.
function softFilter(id: string, seed: number, scale: number, blur: number) {
  return (
    <filter id={id} x="-40%" y="-60%" width="180%" height="220%">
      <feTurbulence type="fractalNoise" baseFrequency="0.011" numOctaves="5" seed={seed} result="ruido" />
      <feDisplacementMap in="SourceGraphic" in2="ruido" scale={scale} />
      <feGaussianBlur stdDeviation={blur} />
    </filter>
  );
}

const PUSH_RADIUS = 320; // px alrededor del mouse donde las nubes reaccionan
const MAX_PUSH = 100; // px máximos que se corre una nube
const EASE = 0.06; // suavidad del movimiento (más chico = más lento)

export default function SkyClouds() {
  const cloudRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    // Solo en compu con mouse y si la persona no pidió menos movimiento
    const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!canHover || reducedMotion) return;

    const offsets = clouds.map(() => ({ x: 0, y: 0 }));
    let pointer: { x: number; y: number } | null = null;
    let frameId = 0;

    const step = () => {
      let moving = false;

      cloudRefs.current.forEach((el, index) => {
        if (!el) return;
        const offset = offsets[index];
        const rect = el.getBoundingClientRect();
        // Centro de la nube en su lugar original (sin el corrimiento actual)
        const cx = rect.left + rect.width / 2 - offset.x;
        const cy = rect.top + rect.height / 2 - offset.y;

        let targetX = 0;
        let targetY = 0;
        if (pointer) {
          const dx = cx - pointer.x;
          const dy = cy - pointer.y;
          const distance = Math.hypot(dx, dy) || 1;
          const reach = PUSH_RADIUS + rect.width * 0.25;
          if (distance < reach) {
            const strength = (1 - distance / reach) ** 2 * MAX_PUSH;
            targetX = (dx / distance) * strength;
            targetY = (dy / distance) * strength * 0.6;
          }
        }

        offset.x += (targetX - offset.x) * EASE;
        offset.y += (targetY - offset.y) * EASE;
        if (Math.abs(targetX - offset.x) > 0.1 || Math.abs(targetY - offset.y) > 0.1) {
          moving = true;
        }
        el.style.transform = `translate3d(${offset.x}px, ${offset.y}px, 0)`;
      });

      // Cuando todo quedó quieto, se frena la animación hasta el próximo movimiento
      frameId = moving ? window.requestAnimationFrame(step) : 0;
    };

    const start = () => {
      if (!frameId) frameId = window.requestAnimationFrame(step);
    };
    const onMove = (event: PointerEvent) => {
      pointer = { x: event.clientX, y: event.clientY };
      start();
    };
    const onLeave = () => {
      pointer = null;
      start();
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("scroll", start, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", start);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      window.cancelAnimationFrame(frameId);
    };
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      <svg width="0" height="0" className="absolute">
        <defs>
          {softFilter("nube-fondo", 3, 120, 14)}
          {softFilter("nube-sombra", 5, 90, 8)}
          {softFilter("nube-brillo", 9, 70, 5)}
        </defs>
      </svg>

      {/* El sol va antes que las nubes para que quede detrás de ellas */}
      <Sun />

      {clouds.map((cloud, index) => (
        <div
          key={index}
          ref={(el) => {
            cloudRefs.current[index] = el;
          }}
          className="absolute will-change-transform"
          style={{
            top: cloud.top,
            left: cloud.left,
            width: cloud.width,
            opacity: cloud.opacity,
          }}
        >
          <svg
            viewBox="-40 -40 540 300"
            className="block h-auto w-full"
            style={{ transform: cloud.flip ? "scaleX(-1)" : undefined }}
          >
            <CloudShape fill="rgba(255, 255, 255, 0.55)" filter="nube-fondo" />
            <CloudShape fill="#c3d0e8" filter="nube-sombra" dy={14} />
            <CloudShape fill="#ffffff" filter="nube-brillo" dy={-6} />
          </svg>
        </div>
      ))}
    </div>
  );
}
