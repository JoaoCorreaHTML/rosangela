-- Políticas de segurança (RLS). Visitantes só leem; só administradores escrevem.
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

alter table public.categories     enable row level security;
alter table public.products       enable row level security;
alter table public.product_images enable row level security;
alter table public.admins         enable row level security;

create policy "leitura publica categorias" on public.categories     for select using (true);
create policy "leitura publica produtos"   on public.products       for select using (true);
create policy "leitura publica imagens"    on public.product_images for select using (true);

create policy "admin escreve categorias" on public.categories     for all using (public.is_admin()) with check (public.is_admin());
create policy "admin escreve produtos"   on public.products       for all using (public.is_admin()) with check (public.is_admin());
create policy "admin escreve imagens"    on public.product_images for all using (public.is_admin()) with check (public.is_admin());
create policy "admin le admins"          on public.admins         for select using (public.is_admin());

-- Storage: bucket público para leitura, escrita só de admin, limite de 5 MB e tipos de imagem
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images','product-images', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg','image/png','image/webp'];

create policy "leitura publica storage" on storage.objects for select using (bucket_id = 'product-images');
create policy "admin escreve storage" on storage.objects for all
  using (bucket_id = 'product-images' and public.is_admin())
  with check (bucket_id = 'product-images' and public.is_admin());
