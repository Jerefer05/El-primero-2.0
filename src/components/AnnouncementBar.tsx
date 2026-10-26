// Cartel de aviso arriba de todo (por ejemplo "Envíos gratis este finde").
// Se prende, se apaga y se edita desde el almacén.
export default function AnnouncementBar({ text }: { text: string }) {
  return (
    <div className="relative z-[55] bg-[#6E6353] px-5 py-2 text-center text-xs tracking-[0.14em] text-[#f4eee6] uppercase sm:text-sm">
      {text}
    </div>
  );
}
