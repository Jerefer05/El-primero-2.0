"use client";

import { useEffect, useState } from "react";

// Sol del cielo: se ubica según la posición real del sol en Buenos Aires
// (sale por la izquierda, sube hasta el mediodía y se pone por la derecha)
// y se ve más o menos según el clima actual. De noche no aparece.
//
// Para probar otra hora o clima: ?hora=18:30&nubes=60&lluvia=1

const LATITUDE = -34.61;
const LONGITUDE = -58.38;
const ARGENTINA_UTC_OFFSET = -3; // Argentina no tiene horario de verano
const WEATHER_URL = `https://api.open-meteo.com/v1/forecast?latitude=${LATITUDE}&longitude=${LONGITUDE}&current=cloud_cover,weather_code`;
const WEATHER_REFRESH_MS = 15 * 60 * 1000;

type Weather = { cloudCover: number; rain: boolean };

type SunPosition = {
  progress: number; // 0 = salida, 1 = puesta
  height: number; // 0 = horizonte, 1 = altura máxima del día
  elevation: number; // grados sobre el horizonte
};

const toRad = (deg: number) => (deg * Math.PI) / 180;
const toDeg = (rad: number) => (rad * 180) / Math.PI;

// Cálculo solar aproximado (fórmulas de la NOAA), suficiente para ubicar el sol en pantalla
function getSunPosition(date: Date): SunPosition | null {
  const start = Date.UTC(date.getUTCFullYear(), 0, 0);
  const dayOfYear = Math.floor((date.getTime() - start) / 86400000);
  const utcMinutes = date.getUTCHours() * 60 + date.getUTCMinutes() + date.getUTCSeconds() / 60;
  const gamma = ((2 * Math.PI) / 365) * (dayOfYear - 1 + (utcMinutes / 60 - 12) / 24);

  const eqTime =
    229.18 *
    (0.000075 +
      0.001868 * Math.cos(gamma) -
      0.032077 * Math.sin(gamma) -
      0.014615 * Math.cos(2 * gamma) -
      0.040849 * Math.sin(2 * gamma));
  const declination =
    0.006918 -
    0.399912 * Math.cos(gamma) +
    0.070257 * Math.sin(gamma) -
    0.006758 * Math.cos(2 * gamma) +
    0.000907 * Math.sin(2 * gamma) -
    0.002697 * Math.cos(3 * gamma) +
    0.00148 * Math.sin(3 * gamma);

  const lat = toRad(LATITUDE);
  const hourAngle = toRad((utcMinutes + eqTime + 4 * LONGITUDE) / 4 - 180);
  const cosZenith =
    Math.sin(lat) * Math.sin(declination) +
    Math.cos(lat) * Math.cos(declination) * Math.cos(hourAngle);
  const elevation = 90 - toDeg(Math.acos(Math.min(1, Math.max(-1, cosZenith))));

  const sunriseHourAngle = toDeg(
    Math.acos(
      Math.cos(toRad(90.833)) / (Math.cos(lat) * Math.cos(declination)) -
        Math.tan(lat) * Math.tan(declination),
    ),
  );
  const sunrise = 720 - 4 * (LONGITUDE + sunriseHourAngle) - eqTime;
  const sunset = 720 - 4 * (LONGITUDE - sunriseHourAngle) - eqTime;

  const progress = (utcMinutes - sunrise) / (sunset - sunrise);
  if (progress < 0 || progress > 1) return null;

  const maxElevation = 90 - Math.abs(LATITUDE - toDeg(declination));
  return {
    progress,
    height: Math.max(0, elevation) / maxElevation,
    elevation,
  };
}

// Lee ?hora=HH:MM (hora de Argentina) para poder ver el sol en otro momento del día
function getTestDate(params: URLSearchParams): Date | null {
  const match = params.get("hora")?.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const date = new Date();
  date.setUTCHours(Number(match[1]) - ARGENTINA_UTC_OFFSET, Number(match[2]), 0, 0);
  return date;
}

export default function Sun() {
  const [position, setPosition] = useState<SunPosition | null>(null);
  const [weather, setWeather] = useState<Weather>({ cloudCover: 0, rain: false });

  // Posición: se recalcula cada minuto
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const update = () => setPosition(getSunPosition(getTestDate(params) ?? new Date()));
    update();
    const timer = window.setInterval(update, 60 * 1000);
    return () => window.clearInterval(timer);
  }, []);

  // Clima actual (Open-Meteo, gratis y sin clave); si falla, el sol se ve despejado
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const isTest = params.has("nubes") || params.has("lluvia");

    const load = async () => {
      if (isTest) {
        setWeather({
          cloudCover: Number(params.get("nubes") ?? 0),
          rain: params.get("lluvia") === "1",
        });
        return;
      }
      try {
        const response = await fetch(WEATHER_URL);
        if (!response.ok) return;
        const data = await response.json();
        const code = Number(data?.current?.weather_code ?? 0);
        setWeather({
          cloudCover: Number(data?.current?.cloud_cover ?? 0),
          // Códigos 51 en adelante: llovizna, lluvia, nieve o tormenta
          rain: code >= 51,
        });
      } catch {
        // sin conexión al clima: dejamos el sol como está
      }
    };
    load();
    if (isTest) return;
    const timer = window.setInterval(load, WEATHER_REFRESH_MS);
    return () => window.clearInterval(timer);
  }, []);

  if (!position) return null;

  // Más nubes = sol más tenue y difuso; con lluvia casi no se ve
  const visibility = weather.rain ? 0.18 : 1 - (Math.min(100, weather.cloudCover) / 100) * 0.65;
  const blur = weather.rain ? 10 : (weather.cloudCover / 100) * 6;
  // Cerca del horizonte (amanecer o atardecer) toma un tono más cálido
  const warm = Math.max(0, Math.min(1, 1 - position.elevation / 12));
  const core = warm > 0.5 ? "#ffd9a0" : "#fff6d6";
  const glow = `rgba(255, ${Math.round(214 - warm * 70)}, ${Math.round(120 - warm * 60)}, 0.55)`;

  return (
    <div
      className="absolute rounded-full transition-[left,top,opacity,filter] duration-[2000ms] ease-out"
      style={{
        left: `${4 + position.progress * 88}%`,
        top: `${72 - position.height * 62}vh`,
        width: "clamp(90px, 11vw, 160px)",
        aspectRatio: "1",
        opacity: visibility,
        filter: `blur(${blur}px)`,
        background: `radial-gradient(circle, #ffffff 0%, ${core} 45%, ${glow} 70%, transparent 72%)`,
        boxShadow: `0 0 60px 20px ${glow}, 0 0 160px 60px rgba(255, 240, 200, 0.35)`,
      }}
    />
  );
}
