-- Fotos que suben los clientes en /pedidos (polaroids e impresiones).
-- Se guardan en calidad original en pedidos-fotos/<id del pedido>/<archivo>.
-- El bucket es público para leer por link directo, pero nadie puede listarlo:
-- solo quien tiene el id del pedido (el link que llega por WhatsApp) ve las fotos.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('pedidos-fotos', 'pedidos-fotos', true, 31457280, array['image/*'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Cualquiera puede subir, pero solo dentro de una carpeta con forma de id de pedido.
create policy "clientes suben fotos de pedidos"
on storage.objects for insert
to anon, authenticated
with check (
  bucket_id = 'pedidos-fotos'
  and array_length(storage.foldername(name), 1) = 1
  and (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
);

-- El dueño puede ver y borrar las fotos desde el almacén.
create policy "admins ven fotos de pedidos"
on storage.objects for select
to authenticated
using (bucket_id = 'pedidos-fotos' and (select public.is_admin()));

create policy "admins borran fotos de pedidos"
on storage.objects for delete
to authenticated
using (bucket_id = 'pedidos-fotos' and (select public.is_admin()));

-- Lista las fotos de un pedido. Hace falta el id exacto, así que no deja
-- recorrer los pedidos de otros clientes.
create or replace function public.fotos_del_pedido(pedido uuid)
returns table (name text, size bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select o.name, coalesce((o.metadata->>'size')::bigint, 0)
  from storage.objects o
  where o.bucket_id = 'pedidos-fotos'
    and o.name like pedido::text || '/%'
  order by o.name
  limit 200;
$$;

revoke all on function public.fotos_del_pedido(uuid) from public;
grant execute on function public.fotos_del_pedido(uuid) to anon, authenticated;
