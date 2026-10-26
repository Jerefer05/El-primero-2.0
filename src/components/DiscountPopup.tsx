"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

const SIZE = 96; // diámetro del popup en px
const SPEED = 55; // velocidad en px/segundo (suave)

export default function DiscountPopup() {
  const [visible, setVisible] = useState(false);
  const [closed, setClosed] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);
  // En el checkout ya eligen la forma de pago: el globo solo distrae.
  const onCheckout = usePathname().startsWith("/checkout");

  // Aparece después de 3 segundos
  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(true), 3000);
    return () => window.clearTimeout(timer);
  }, []);

  // Movimiento rebotando con requestAnimationFrame
  useEffect(() => {
    if (!visible || closed) return;

    const el = popupRef.current;
    if (!el) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let x = Math.max(0, window.innerWidth - SIZE - 20);
    let y = Math.max(0, window.innerHeight - SIZE - 20);
    let vx = -SPEED;
    let vy = -SPEED * 0.8;
    let lastTime: number | null = null;
    let frameId = 0;

    el.style.transform = `translate3d(${x}px, ${y}px, 0)`;

    // Si el usuario pidió menos movimiento, queda fijo en la esquina
    if (prefersReducedMotion) return;

    const step = (time: number) => {
      if (lastTime === null) lastTime = time;
      // Limitamos el delta para evitar saltos si la pestaña estuvo en segundo plano
      const delta = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;

      const maxX = Math.max(0, window.innerWidth - SIZE);
      const maxY = Math.max(0, window.innerHeight - SIZE);

      x += vx * delta;
      y += vy * delta;

      if (x <= 0) {
        x = 0;
        vx = Math.abs(vx);
      } else if (x >= maxX) {
        x = maxX;
        vx = -Math.abs(vx);
      }

      if (y <= 0) {
        y = 0;
        vy = Math.abs(vy);
      } else if (y >= maxY) {
        y = maxY;
        vy = -Math.abs(vy);
      }

      el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      frameId = window.requestAnimationFrame(step);
    };

    frameId = window.requestAnimationFrame(step);

    return () => window.cancelAnimationFrame(frameId);
  }, [visible, closed]);

  if (!visible || closed || onCheckout) {
    return null;
  }

  return (
    <div
      ref={popupRef}
      className="fixed top-0 left-0 z-[60] will-change-transform"
      style={{ width: SIZE, height: SIZE }}
      role="status"
    >
      <div className="animate-fade-in relative flex h-full w-full items-center justify-center rounded-full bg-[#6E6353] px-3 text-center text-xs leading-tight font-medium text-white shadow-soft">
        15% OFF en efectivo
        <button
          type="button"
          onClick={() => setClosed(true)}
          aria-label="Cerrar descuento"
          className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border border-[#6E6353] bg-[#d7cbbe] text-sm leading-none text-[#2E2E2E] transition hover:bg-white"
        >
          ×
        </button>
      </div>
    </div>
  );
}
