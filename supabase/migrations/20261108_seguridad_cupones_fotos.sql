-- Arreglos de la auditoría de seguridad (#1 y #2 de security-report.md).
-- IMPORTANTE: aplicar recién DESPUÉS de publicar el código de esta rama
-- (rama claude/seguridad-arreglos). Si se aplica antes, los cupones y la
-- subida de fotos de /pedidos dejan de andar en la web actual.

-- #2 Cupones: la función check_coupon solo la puede usar el servidor.
-- Así nadie prueba códigos llamando directo a la base, salteando el límite
-- de intentos de /api/cupon.
revoke execute on function public.check_coupon(text) from public, anon, authenticated;
grant execute on function public.check_coupon(text) to service_role;

-- #1 Fotos de pedidos: solo tipos de foto comunes (sin SVG).
update storage.buckets
set allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
where id = 'pedidos-fotos';

-- #1 Fotos de pedidos: se borra la regla que dejaba subir a cualquiera.
-- Desde ahora solo se sube con el permiso firmado que entrega /api/fotos,
-- que revisa cantidad, tipo y peso y aplica un límite por conexión.
drop policy if exists "clientes suben fotos de pedidos" on storage.objects;
