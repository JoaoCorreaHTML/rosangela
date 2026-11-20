-- Rosângela Corrêa Store — esquema do banco (Supabase PostgreSQL)
create extension if not exists pgcrypto;

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 60),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  brand text check (char_length(brand) <= 60),
  description text check (char_length(description) <= 2000),
  category_id uuid references public.categories(id) on delete restrict,
  price numeric(10,2) check (price is null or price >= 0), -- null = "Preço sob consulta"
  status text not null default 'disponivel' check (status in ('disponivel','indisponivel')),
  badges text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index products_category_idx on public.products(category_id);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  url text not null,          -- caminho relativo (assets/...) ou URL do Supabase Storage
  storage_path text,          -- preenchido só para uploads no Storage
  alt text,
  is_main boolean not null default false,
  position int not null default 0,
  created_at timestamptz not null default now()
);
create unique index one_main_image_per_product on public.product_images(product_id) where is_main;

create table public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at = now(); return new; end $$;
create trigger products_touch before update on public.products
  for each row execute function public.touch_updated_at();
create trigger categories_touch before update on public.categories
  for each row execute function public.touch_updated_at();
