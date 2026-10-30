-- Paso 2 (aplicar SOLO después de cargar SUPABASE_SECRET_KEY en Vercel y
-- publicar la versión nueva; si no, los pedidos dejan de guardarse en el
-- almacén): saca el permiso público para insertar pedidos. Desde acá solo el
-- servidor de la tienda, con la clave secreta, puede guardar pedidos.
drop policy if exists "la tienda guarda pedidos nuevos" on public.orders;
