-- Paso 1 (se puede aplicar ya, no cambia nada de lo que funciona hoy):
-- cuenta de intentos por conexión para frenar bots en /api/pedido y /api/cupon.
-- Solo la usa el servidor con la clave secreta; los visitantes no la ven.
create table if not exists public.pedido_intentos (
  clave text not null,
  creado timestamptz not null default now()
);
create index if not exists pedido_intentos_clave_creado
  on public.pedido_intentos (clave, creado desc);
alter table public.pedido_intentos enable row level security;
-- Sin políticas: ni anon ni authenticated pueden leer ni escribir.

-- Devuelve true y anota el intento si la clave no llegó al máximo en la ventana.
create or replace function public.registrar_intento(
  p_clave text,
  p_max integer,
  p_ventana_segundos integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  usados integer;
begin
  -- Un intento a la vez por clave, para que dos pedidos simultáneos no se
  -- cuelen los dos por el mismo hueco.
  perform pg_advisory_xact_lock(hashtext(p_clave));

  -- De paso se limpian los registros viejos.
  delete from public.pedido_intentos where creado < now() - interval '1 day';

  select count(*) into usados
  from public.pedido_intentos
  where clave = p_clave
    and creado > now() - make_interval(secs => p_ventana_segundos);

  if usados >= p_max then
    return false;
  end if;

  insert into public.pedido_intentos (clave) values (p_clave);
  return true;
end;
$$;

revoke all on function public.registrar_intento(text, integer, integer) from public, anon, authenticated;
grant execute on function public.registrar_intento(text, integer, integer) to service_role;
