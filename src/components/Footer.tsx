import { STORE, whatsappLink } from "@/data/config";

export default function Footer() {
  return (
    <footer
      id="contacto"
      className="mt-8 border-t border-white/40 bg-white/25 backdrop-blur-sm"
    >
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 text-center md:grid-cols-4 md:px-8 md:text-left">
        <div>
          <p className="font-serif text-2xl text-[#2E2E2E]">Tesoria</p>
          <p className="mt-3 text-sm leading-relaxed text-[#2E2E2E]/70">
            Velas recargables y home deco artesanal. Hecho a mano con
            dedicación.
          </p>
        </div>

        <div>
          <p className="text-xs tracking-[0.18em] text-[#2E2E2E] uppercase">
            Contacto
          </p>
          <ul className="mt-3 space-y-2 text-sm text-[#2E2E2E]">
            <li>
              <a
                href={whatsappLink("¡Hola Tesoria! Quería hacerles una consulta.")}
                target="_blank"
                rel="noopener noreferrer"
                className="underline-offset-2 hover:underline"
              >
                WhatsApp
              </a>
            </li>
            {STORE.instagramUrl && (
              <li>
                <a
                  href={STORE.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline-offset-2 hover:underline"
                >
                  Instagram
                </a>
              </li>
            )}
            <li className="text-[#2E2E2E]/70">Lusi y Jere</li>
          </ul>
        </div>

        <div>
          <p className="text-xs tracking-[0.18em] text-[#2E2E2E] uppercase">
            Atención
          </p>
          <p className="mt-3 text-sm leading-relaxed text-[#2E2E2E]">
            {STORE.hours}
          </p>
          <p className="mt-2 text-sm text-[#2E2E2E]/70">Argentina</p>
        </div>

        <div>
          <p className="text-xs tracking-[0.18em] text-[#2E2E2E] uppercase">
            Envíos y pagos
          </p>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-[#2E2E2E]">
            <li>
              Envío gratis superando los $
              {STORE.freeShippingFrom.toLocaleString("es-AR")}
            </li>
            <li>
              {Math.round(STORE.cashDiscount * 100)}% OFF abonando en efectivo
            </li>
            <li className="text-[#2E2E2E]/70">
              Coordinamos el pago y el envío por WhatsApp
            </li>
          </ul>
        </div>
      </div>
      <p className="border-t border-white/40 px-5 py-5 text-center text-xs text-[#2E2E2E]/60">
        © {new Date().getFullYear()} {STORE.name}. Todos los derechos
        reservados.
      </p>
    </footer>
  );
}
