-- Texto de la ficha de cada producto (tamaño, duración, cómo se recarga).
alter table public.products
  add column if not exists descripcion text not null default ''
  check (char_length(descripcion) <= 2000);
