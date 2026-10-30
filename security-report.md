# 🔐 Informe de seguridad — Tesoria

**Fecha:** 2026-10-30
**Puntaje:** 62/100 🟠
**Proyecto:** tesoria (tienda online de velas)
**Tecnologías detectadas:** Next.js 16 (React 19), Supabase (base de datos, login del almacén y fotos), Vercel, Telegram (avisos), Google Analytics / Píxel de Meta
**Revisado con:** security-skill v1.0.0 (`/security-audit`)

> Qué se revisó: todo el código del repo, la base de datos en vivo de Supabase (permisos de cada tabla, funciones y carpetas de fotos), el aviso de seguridad automático de Supabase, las librerías (`npm audit`) y el historial de git buscando claves filtradas.
> No se cambió nada de la web ni de la base: este informe solo describe y recomienda.

---

## 📊 Resumen

| Gravedad | Cantidad | Resta |
|---|---|---|
| 🔴 Crítico | 0 | 0 |
| 🟠 Alto | 1 | −10 |
| 🟡 Medio | 4 | −20 |
| 🔵 Bajo | 4 | −8 |
| **Total** | | **62/100** |

### Por categoría (solo las que aplican a esta web)

| Categoría | Puntaje | Problemas |
|---|---|---|
| Claves y archivos secretos | 95/100 🟢 | 1 bajo |
| Red y límites de uso | 75/100 🟡 | 1 medio |
| Cabeceras de seguridad del navegador | 60/100 🟠 | 1 medio |
| Login y sesiones (almacén) | 70/100 🟡 | 1 medio |
| Base de datos (Supabase, permisos) | 85/100 🟡 | 1 medio (el del cupón) |
| Subida de archivos | 55/100 🟠 | 1 alto |
| Lógica de negocio / carreras | 90/100 🟢 | 1 bajo |
| Inyecciones (SQL, HTML, etc.) | 100/100 🟢 | — |
| Análisis del código | 95/100 🟢 | 1 bajo |
| Dependencias (librerías) | 100/100 🟢 | — |
| Datos personales / legal | 65/100 🟠 | 1 medio, 1 bajo |
| Bots y abuso | 80/100 🟡 | (incluido en "Subida de archivos") |
| Despliegue (Vercel) | 90/100 🟢 | — |

No aplican: Docker, apps móviles, GraphQL/WebSocket, IA, funciones edge propias.

---

## 🔴 Críticos

Ninguno. No hay claves secretas en el código ni en el historial de git, todas las tablas tienen protección (RLS) activada y nadie de afuera puede leer pedidos, clientes ni cupones.

---

## 🟠 Altos

### 1. Cualquiera puede subir fotos sin límite a la carpeta de pedidos (CWE-770)
**Dónde:** carpeta `pedidos-fotos` en Supabase (`supabase/migrations/20261027_fotos_pedidos.sql`) y `src/components/PhotoOrderForm.tsx`
**Problema:** la página /pedidos sube las fotos directo desde el navegador a Supabase con la clave pública. La regla de la base solo pide que vayan dentro de una carpeta con forma de código de pedido. No hay tope de cuántas fotos ni de cuántos pedidos por persona, y cada foto puede pesar hasta 30 MB. Además acepta cualquier tipo de imagen (`image/*`), incluido SVG, que puede llevar código adentro.
**Riesgo:** un bot puede llenar el espacio de Supabase en pocos minutos (el plan gratis trae 1 GB; hoy hay 18 fotos, 9 MB). Si se llena, el dueño tampoco puede subir fotos de productos y Supabase puede limitar el proyecto o cobrar extra. Un SVG con código se abriría desde el dominio de Supabase, no desde el de la tienda, así que el daño es menor, pero no hace falta aceptarlo.
**Arreglo sugerido:**
- Cambiar los tipos permitidos a `image/jpeg, image/png, image/webp, image/heic, image/heif` (sin SVG).
- Pasar la subida por el servidor de la tienda, igual que ya se hizo con los pedidos: una ruta `/api/fotos` que use el mismo límite por conexión (`registrar_intento`) y entregue un permiso de subida firmado (`createSignedUploadUrl`) por foto. Después se borra la regla que deja subir a cualquiera.
- Opcional: borrar automáticamente fotos de más de 60 días.
**Referencia:** https://cwe.mitre.org/data/definitions/770.html

---

## 🟡 Medios

### 2. El límite de intentos de cupones se puede saltear (CWE-307)
**Dónde:** función `check_coupon` en Supabase; `src/app/api/cupon/route.ts`
**Problema:** la web limita a 20 intentos cada 10 minutos en `/api/cupon`, pero la función de la base que valida el cupón también se puede llamar directo desde internet con la clave pública (`/rest/v1/rpc/check_coupon`), sin ese límite. Supabase lo marca en su aviso de seguridad.
**Riesgo:** un bot puede probar miles de códigos por minuto hasta encontrar cupones de descuento que no se repartieron públicamente.
**Arreglo sugerido (una línea de SQL, no toca la web):**
```sql
revoke execute on function public.check_coupon(text) from anon, authenticated;
grant execute on function public.check_coupon(text) to service_role;
```
y en `src/data/coupons.ts` usar `createSecretClient()` en vez de `createPublicClient()`. Hay que hacer las dos cosas juntas, si no los cupones dejan de funcionar.

### 3. Faltan las cabeceras de seguridad del navegador (CWE-1021, CWE-693)
**Dónde:** `next.config.ts` (no hay `headers()`), no hay `vercel.json`
**Problema:** la web no le dice al navegador reglas básicas: que no se pueda meter dentro de otra página (`frame-ancestors` / `X-Frame-Options`), que no adivine tipos de archivo (`X-Content-Type-Options`), qué datos manda al salir a otro sitio (`Referrer-Policy`), ni de dónde puede cargar scripts (`Content-Security-Policy`).
**Riesgo:** otra página podría mostrar el almacén escondido dentro de un marco y engañar al dueño para que haga clic donde no quiere ("clickjacking"). Sin CSP, si algún día se cuela código malicioso, nada lo frena.
**Arreglo sugerido:** agregar en `next.config.ts` un bloque `headers()` con `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()` y una CSP que permita Supabase, Google Analytics, Meta y wa.me. La CSP conviene probarla primero en modo "solo avisar" (`Content-Security-Policy-Report-Only`) para no romper el Píxel ni Analytics.

### 4. La cuenta del almacén depende solo de una contraseña (CWE-308, CWE-521)
**Dónde:** login de `/almacen` (`src/components/almacen/AlmacenPanel.tsx`), configuración de Auth en Supabase
**Problema:** con esa única cuenta se maneja todo: precios, productos, cupones, pedidos y datos de clientes. No tiene segundo paso (código en el celular) y la protección de Supabase contra contraseñas filtradas está apagada. El cambio de contraseña pide solo 8 caracteres.
**Riesgo:** si la contraseña se repite en otro sitio que se filtró, alguien puede entrar, cambiar precios, cargar el alias de transferencia de otra persona o bajarse los datos de los clientes.
**Arreglo sugerido:**
- En Supabase → Authentication → Providers/Policies: prender "Leaked password protection" y pedir mínimo 12 caracteres (no toca el código).
- Confirmar que el registro de cuentas nuevas está apagado (Authentication → Sign In / Providers → "Allow new users to sign up" en off).
- Agregar segundo paso (TOTP con Google Authenticator) al almacén; Supabase ya lo trae.

### 5. No hay política de privacidad (Ley 25.326 de Datos Personales)
**Dónde:** no existe una página de privacidad en `src/app`
**Problema:** la tienda junta nombre, email, teléfono, dirección y fotos personales de los clientes, y usa Google Analytics y el Píxel de Meta. No hay un texto que diga qué se guarda, para qué, cuánto tiempo y cómo pedir que se borre.
**Riesgo:** incumplir la ley argentina de datos personales y perder confianza de compradores. Meta también pide una política de privacidad para usar el Píxel en anuncios.
**Arreglo sugerido:** una página `/privacidad` simple con un link en el pie de página y otro junto al botón de confirmar compra y de subir fotos.

---

## 🔵 Bajos / Info

6. **Envío o pago "raros" pasan el primer control** — `src/app/api/pedido/route.ts:61-62`. Se usa `in` para revisar que el envío sea "envio" o "retiro", y eso también acepta palabras internas de JavaScript como `toString`. La base rechaza ese pedido (tiene reglas de valores válidos), pero el cliente igual ve "pedido confirmado" y al dueño le llega un aviso raro por Telegram. Arreglo: usar `Object.hasOwn(SHIPPING_LABELS, shipping)`. (CWE-1321)
7. **Respaldo débil de la "sal" del límite de intentos** — `src/lib/rateLimit.ts:25`. Si faltara `SUPABASE_SECRET_KEY`, las huellas de las IP se calculan con la palabra fija "tesoria" y se podrían revertir. Hoy la clave está cargada, así que solo importa si se borra. Arreglo: que no guarde nada si falta la clave.
8. **Cupones sin tope de usos** — el cupón `VUELVE10` sale impreso en cada comprobante y se puede usar infinitas veces, por cualquiera. Es una decisión de negocio; si se quiere limitar, se puede agregar "usos máximos" o "una vez por email".
9. **Fotos de clientes sin vencimiento** — las fotos de /pedidos quedan públicas para siempre para quien tenga el link. El link es imposible de adivinar, pero conviene borrarlas cuando el pedido se entrega.
- ℹ️ `is_admin()` se puede llamar desde afuera, pero solo responde "no". Sin riesgo.
- ℹ️ `pedido_intentos` no tiene reglas a propósito: solo la usa el servidor con la clave secreta.
- ℹ️ Supabase da permisos generales a las tablas, pero las reglas RLS los cierran en todas. Revisado una por una.

---

## ✅ Lo que está bien

- **Pedidos solo desde el servidor:** la regla vieja que dejaba a cualquiera insertar pedidos ya no existe en la base. Solo el servidor con `SUPABASE_SECRET_KEY` guarda pedidos.
- **Límite de pedidos por conexión** (`pedido_intentos` + `registrar_intento`): 5 pedidos por hora, contado en la base, sin carreras (usa un candado por conexión) y la IP se guarda como huella, no tal cual. La función solo la puede usar el servidor.
- **Precios calculados en el servidor:** el total nunca sale de lo que manda el navegador; si un precio cambió, se avisa antes de cobrar.
- **Todas las tablas con RLS**; pedidos, cupones y admins solo los ve el dueño. Catálogo, zonas y ajustes son de solo lectura para el público.
- **Funciones de la base con `search_path` fijo** (evita un truco conocido de Postgres).
- **Sin claves secretas en el código ni en el historial de git**; `.env*` está en `.gitignore`. La clave publicable de Supabase en `src/lib/supabase.ts` es pública por diseño.
- **Mensajes de Telegram escapados** (no se puede inyectar formato) y el token del bot vive solo en Vercel.
- **Datos de Google Analytics / Píxel validados** antes de meterlos en la página; el JSON de producto escapa `<`.
- **Campo trampa contra bots** en el checkout.
- **Fotos de pedidos:** no se pueden listar; hace falta el código exacto del pedido. La carpeta de productos acepta solo JPG/PNG/WebP/AVIF de hasta 5 MB y solo el admin puede subir.
- **Librerías:** `npm audit` sin vulnerabilidades conocidas (25 dependencias de producción).
- **Datos de pedidos con topes de largo** en el servidor y en la base.

---

## 📋 Riesgos aceptados

Ninguno registrado todavía en `memory-security.md`.

---

## 🔄 Estado de las claves

| Clave | Dónde vive | Estado |
|---|---|---|
| `SUPABASE_SECRET_KEY` | Vercel | ✅ recién creada (oct 2026) |
| `TELEGRAM_BOT_TOKEN` | Vercel | ✅ fuera del código; rotar si alguien más tuvo acceso al bot |
| Clave publicable de Supabase | Código | ℹ️ pública por diseño |
| Contraseña del almacén | Supabase Auth | ⚠️ sin segundo paso (ver #4) |

---

## 📅 Próximos pasos (en orden)

1. **Frenar subidas sin límite de fotos** (#1): sacar SVG ya mismo (un cambio en Supabase) y pasar la subida por el servidor con límite.
2. **Cerrar el atajo de cupones** (#2): una línea de SQL + un cambio de una línea en el código, juntos.
3. **Proteger el almacén** (#4): prender la protección de contraseñas filtradas y confirmar que el registro está apagado (son dos clics en Supabase). Después, segundo paso.
4. **Cabeceras de seguridad** (#3).
5. **Página de privacidad** (#5).
6. Los bajos (#6–#9) cuando haya un rato.

Con 1 a 4 resueltos el puntaje sube a 87/100; con todo, a 100/100. Para aplicar los arreglos: `/security-fix` (pide confirmación antes de tocar cada cosa).
