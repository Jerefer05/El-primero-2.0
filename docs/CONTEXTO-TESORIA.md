# Contexto de Tesoria (traspaso)

Este archivo resume todo lo que se hizo en la web de Tesoria hasta el 8/11/2026, para que cualquier
sesión nueva de Claude (o cualquier persona) pueda seguir sin perder nada.
**Claude: leelo entero antes de tocar código o de proponer cambios.**

> El repositorio es público. Este archivo no tiene claves, tokens ni contraseñas, y nunca hay que
> agregarlos acá. Las claves viven solo en las variables de entorno de Vercel.

---

## 1. Quiénes son

- **Tesoria**: emprendimiento de velas recargables, ceras de repuesto, esencias y pedidos de fotos
  tipo polaroid. Las dueñas/dueños de la tienda son **Lusi y Jere** (el cliente).
- **Martin Andrade** (GitHub `Polakitoandrade-sudo`): hace la web como freelance y habla con el cliente.
- **Jeremías** (GitHub `Jerefer05`): dueño del repo y de la cuenta de Vercel `jeremias15`.
- Idioma: todo en español rioplatense ("vos"), explicado simple y paso a paso. Martin no es
  programador: siempre decirle qué tocar, dónde y con links directos.

## 2. Dónde está cada cosa

| Pieza | Dónde | Cuenta |
|---|---|---|
| Código | GitHub `Jerefer05/El-primero-2.0`, rama `main` | Jerefer05 (Martin es colaborador) |
| Web publicada | https://tesoria.vercel.app | Vercel, equipo `jeremias15`, proyecto `tesoria` |
| Vistas previas | `tesoria-git-<rama>-jeremias15.vercel.app` (una por cada PR) | Vercel |
| Base de datos, login y fotos | Supabase, proyecto **Tesoria**, id `rcboyxkkyafhiflzbroi` | Cuenta de Supabase de Martin; Jeremías invitado a la organización como Developer |
| Aviso de pedidos al dueño | Bot de Telegram "Pedidos Tesoria" (le llega a Lusi) | Telegram de Lusi |
| Panel del dueño | https://tesoria.vercel.app/almacen (sin link visible en la web) | Usuario de Supabase Auth con el mail de Jeremías |
| Fotos originales de productos | Zip de WeTransfer (11 fotos en alta) | Archivos del proyecto en Claude |
| Fotos mejoradas (versión estudio, las que están en la web) | `fotos-mejoradas/estudio/` en los archivos del proyecto | — |

Cada cambio que se mergea a `main` se publica solo en tesoria.vercel.app.

### Variables de entorno en Vercel (solo nombres, nunca valores acá)

- `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`: aviso de pedidos por Telegram.
- `SUPABASE_SECRET_KEY`: clave secreta para que solo el servidor guarde pedidos y para el límite contra bots.
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: opcionales (el código ya trae
  la URL y la clave pública por defecto; la clave pública es pública por diseño).
- `NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_META_PIXEL_ID`: **faltan cargar**. Analytics y Píxel se activan solos al cargarlas.
- `NEXT_PUBLIC_SITE_URL`: cargar cuando haya dominio propio (por ejemplo `https://tesoria.com.ar`).

## 3. Arquitectura

- **Next.js 16 (App Router) + React 19 + Tailwind 4 + TypeScript.** Ojo: esta versión de Next tiene
  cambios; ver `AGENTS.md` y la documentación en `node_modules/next/dist/docs/` antes de escribir código.
- **Supabase** (`@supabase/supabase-js`): tablas de productos, pedidos, ajustes, cupones, zonas de
  envío, `pedido_intentos` (límite contra bots) y el bucket de Storage `fotos-pedidos`.
  Permisos con RLS: las visitas solo leen productos y ajustes; solo el mail del dueño puede editar.
  Migraciones en `supabase/migrations/`.
- **Mapa del código**: `src/app` (rutas), `src/components` (tienda), `src/components/almacen` (panel),
  `src/context` (carrito y ajustes), `src/data` y `src/lib` (datos y lógica). Los núcleos son
  `data/products`, `lib/order`, `lib/supabase` y `data/config`: si se tocan, probar checkout y panel.
  Hay un grafo completo en los archivos del proyecto (`mapa/grafo-codigo.md`).

### Rutas principales

- `/` portada (cielo con nubes, sol según la hora y el clima real de Buenos Aires vía Open-Meteo) y catálogo.
- `/producto/[id]` ficha de cada producto.
- `/checkout` y `/checkout/listo`: datos del comprador, envío por zona, cupón, comprobante descargable en PDF.
- `/api/pedido`: valida y recalcula precios en el servidor, guarda el pedido en Supabase, avisa por
  Telegram (con reintentos) y aplica el límite de 5 pedidos por hora por conexión.
- `/api/cupon`: valida cupones (límite de 20 intentos cada 10 minutos).
- `/pedidos`: pedido de fotos polaroid; sube varias fotos en calidad original a Supabase y manda un link por WhatsApp.
- `/fotos/[id]`: galería de las fotos de un pedido.
- `/almacen`: panel del dueño (ver abajo).
- `sitemap.ts` y `robots.ts`: SEO.

## 4. Qué se hizo (PRs #1 a #15, todos mergeados y publicados)

1. **#1** Fondo de cielo que se oscurece al bajar, nubes que se corren con el mouse, sol en tiempo real según hora y clima, "arte nostálgico" corregido.
2. **#2** Almacén con login para cargar y editar productos (Supabase).
3. **#3** Checkout con comprobante y aviso por Telegram con botón "Avisar despacho" por WhatsApp. Pago por transferencia al alias de la tienda.
4. **#4, #5, #8** Fotos reales de los productos, "Vela Esmeralda" pasó a "Vela Esmerilada", fotos con revelado de estudio (formato 4:5).
5. **#6** Panel fase 1: pedidos con estados (nuevo, pagado, enviado, entregado, cancelado), pausar productos, textos de portada, cartel de aviso, datos de pago y contacto.
6. **#7** Arreglos de la prueba con 8 compradores simulados: tope de 99 unidades, reintento de Telegram, validación de mail y WhatsApp.
7. **#9** Historial de pedidos terminados con fechas.
8. **#10** Panel fase 2: ordenar y destacar productos, ventas del mes, cupones editables (VUELVE10 ya cargado) y zonas de envío con envío gratis desde un monto.
9. **#11** Pedidos de fotos: varias fotos, calidad original, link en el WhatsApp (WeTransfer no sirve porque cerró su API).
10. **#13** Lista para vender: pedidos solo desde el servidor, límite contra bots, fichas de producto con descripción, aviso si algo se agota o cambia de precio en el carrito, Analytics/Píxel preparados, SEO.
11. **#14, #15** Skill de seguridad (`.skills/security`, comandos `/security-*`, `memory-security.md`).

## 5. Decisiones tomadas (no volver a discutirlas sin que Martin lo pida)

- Supabase plan gratis por ahora (pausa el proyecto tras 7 días sin uso; para producción conviene Pro).
- Cobro por **transferencia al alias** que figura en el comprobante; el cliente manda el comprobante por WhatsApp. Mercado Pago queda para después.
- Aviso al dueño por **bot de Telegram** (gratis y confiable), no WhatsApp API.
- "Factura" = **comprobante del pedido**, no factura de AFIP/ARCA.
- Clima y sol con Buenos Aires como referencia para todos (no se pide ubicación al visitante).
- Siempre trabajar en una rama, abrir PR, mostrar la vista previa de Vercel y **publicar solo con el OK de Martin**.
- Las vistas previas usan **la misma base de datos** que la web real: avisarlo siempre antes de que pruebe.
- Productos, precios, fotos y textos se cambian desde el almacén, no en el código.

## 6. Pendientes

1. **Arreglos de la auditoría de seguridad (62/100)**. El informe está en el PR #16 (`security-report.md`, todavía abierto). Si se arreglan los 4 primeros, sube a ~87:
   1. Fotos de `/pedidos`: cualquiera puede subir sin límite; un bot podría llenar el Storage.
   2. Cupones: hay un atajo que saltea el límite de intentos.
   3. Almacén: entra solo con contraseña; activar "Leaked password protection" en Supabase Auth.
   4. Encabezados de seguridad del navegador (por ejemplo contra que otra página muestre el almacén escondido).
   5. Política de privacidad (la pide la ley argentina de datos personales).
2. **Botón de arrepentimiento** y políticas de cambio al pie (obligatorio en tiendas online en Argentina).
3. **Mercado Pago**: falta saber si el cliente tiene cuenta de vendedor y sacar las credenciales.
4. **Dominio propio** (por ejemplo tesoria.com.ar en nic.ar) y Google Business.
5. **Google Analytics y Píxel de Meta**: falta que el cliente pase los IDs (o crearlos) y cargarlos en Vercel.
6. **Rediseño "anti-IA"**: la web se evaluó en 68% "parece hecha por IA" contra ~22% de 15 tiendas parecidas. Objetivo ~30%. Cambios, en orden:
   barra de aviso arriba ("Envío gratis desde $50.000 · 15% OFF en efectivo"), precio de lista tachado y precio en efectivo,
   portada con foto real de vela encendida en vez de las nubes, fondo liso cálido y tarjetas sólidas,
   reseñas reales y foto de Lusi y Jere, pie con políticas, arrepentimiento y contacto completo.
   Al cliente no decirle "parece IA": decirle "se parece a una web de plantilla, le falta la personalidad de la marca".
7. **Descripciones de productos**: cargarlas en el almacén (tamaño, horas que dura, aroma, recargas).
8. Link de Instagram en el almacén → "Pago y contacto".
9. Opcional: borrar solas las fotos de pedidos a los 60 días.
10. **Pasar las cuentas al cliente**: lo ideal es que Vercel, Supabase y el dominio queden a nombre de Tesoria.
11. **Seguridad del traspaso**: el token del bot de Telegram y la contraseña provisoria del almacén se escribieron en chats de Claude. Conviene generar un token nuevo en @BotFather (`/revoke`) y actualizar `TELEGRAM_BOT_TOKEN` en Vercel, y cambiar la contraseña del almacén con el botón "Contraseña".

## 7. Lo que hay que pedirle al cliente (mensaje listo)

> Hola! Para que la web se vea más profesional y genere más confianza, necesito que me pasen esto:
>
> **Fotos**
> 1. 2 o 3 fotos de una vela **encendida** en un ambiente de la casa, con luz natural, en horizontal. Sirven las del celular, sin filtros.
> 2. Una foto de ustedes dos, o de sus manos haciendo velas o recargando un vaso.
>
> **Clientas**
> 3. 4 o 5 comentarios de clientas (capturas de WhatsApp o Instagram, o el texto con nombre y ciudad). Avísenles que van a aparecer en la web.
>
> **Precios y promos**
> 4. ¿Siguen igual el envío gratis desde $50.000 y el 15% OFF en efectivo? ¿Vale también para transferencia?
> 5. ¿Los precios de la web son los de lista? Así muestro el de lista tachado y al lado el de efectivo.
>
> **Datos del negocio** (para el pie de la web)
> 6. Política de cambios y devoluciones: plazo, en qué casos y quién paga el envío.
> 7. Email de contacto, zona o dirección de retiro, horarios e Instagram.
> 8. Nombre o razón social y CUIT, para el botón de arrepentimiento.
>
> **Gusto**
> 9. Para el fondo nuevo: ¿crema, arena o un rosa muy suave? Si tienen colores de marca, pásenmelos.
>
> **Para cobrar y medir**
> 10. ¿Tienen cuenta de vendedor de Mercado Pago? ¿Tienen Google Analytics o Píxel de Meta? ¿Qué dominio quieren?

## 8. Precio sugerido para el cliente

- **Web completa** (con Mercado Pago y dominio): unos **USD 1.500**.
  - Pago único: USD 1.350 (10% de descuento).
  - En cuotas: 40% al empezar, 30% cuando sale con dominio y Mercado Pago, 30% a los 30 días.
- **Mantenimiento mensual**: Básico USD 70 (hosting, base y arreglos chicos) o Plus USD 120 (suma ~4 horas de cambios y un resumen de ventas).
- **Costos para salir a producción** (~USD 45 por mes): Vercel Pro USD 20 (el plan gratis no permite uso comercial),
  Supabase Pro USD 25, dominio .com.ar por año (confirmar tarifa en nic.ar). Idealmente a nombre del cliente.
- Recomendado: contrato simple y factura como monotributista.

## 9. Cómo trabajar en este proyecto (para Claude)

1. Leer este archivo, `CLAUDE.md`, `AGENTS.md`, `.skills/security/skill.md` y `memory-security.md`.
2. Rama nueva por tarea → PR → vista previa de Vercel → OK de Martin → merge.
3. Antes de cambiar la base de Supabase, decir qué se agrega y pedir OK. Si la confirmación de la
   herramienta no aparece, pasarle a Martin el SQL para que lo pegue en el editor SQL de Supabase.
4. Nunca pedir ni guardar claves en el chat ni en el repo. Las claves se cargan en Vercel.
5. Respuestas cortas, en español, con links directos y pasos numerados.
