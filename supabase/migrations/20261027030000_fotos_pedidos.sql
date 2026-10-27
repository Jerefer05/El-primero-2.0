-- Fotos que suben los clientes para pedidos de polaroids / impresiones.
-- Bucket público para poder descargarlas por URL, pero sin permiso de listar:
-- las fotos van en una carpeta con un UUID al azar y el pedido en otra, con un
-- pedido.json que dice qué fotos son. Solo quien tiene el link (el UUID del
-- pedido) sabe qué hay adentro.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'fotos-pedidos', 'fotos-pedidos', true, 26214400,
  array['image/jpeg','image/png','image/webp','image/heic','image/heif','image/gif','application/json']
)
on conflict (id) do nothing;

-- Cualquiera puede subir, solo dentro de una carpeta con forma de UUID,
-- y nunca pisar ni borrar (no hay políticas de update/delete para clientes).
create policy "clientes suben fotos de pedidos"
on storage.objects for insert to anon, authenticated
with check (
  bucket_id = 'fotos-pedidos'
  and array_length(storage.foldername(name), 1) = 1
  and (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
);

-- El dueño puede borrar fotos viejas.
create policy "admins borran fotos de pedidos"
on storage.objects for delete to authenticated
using (bucket_id = 'fotos-pedidos' and (select public.is_admin()));
