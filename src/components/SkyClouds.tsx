// Nubes decorativas del fondo: formas suaves con bordes esponjosos (filtro SVG),
// repartidas a lo largo de la página detrás del contenido.

type Cloud = {
  top: string;
  left: string;
  width: string;
  opacity: number;
  flip?: boolean;
};

const clouds: Cloud[] = [
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

export default function SkyClouds() {
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

      {clouds.map((cloud, index) => (
        <svg
          key={index}
          viewBox="-40 -40 540 300"
          className="absolute h-auto"
          style={{
            top: cloud.top,
            left: cloud.left,
            width: cloud.width,
            opacity: cloud.opacity,
            transform: cloud.flip ? "scaleX(-1)" : undefined,
          }}
        >
          <CloudShape fill="rgba(255, 255, 255, 0.55)" filter="nube-fondo" />
          <CloudShape fill="#c3d0e8" filter="nube-sombra" dy={14} />
          <CloudShape fill="#ffffff" filter="nube-brillo" dy={-6} />
        </svg>
      ))}
    </div>
  );
}
