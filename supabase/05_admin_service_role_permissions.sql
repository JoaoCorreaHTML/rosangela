-- Permissões mínimas para as Netlify Functions administrativas.
-- A chave secreta do Supabase é usada exclusivamente no servidor.
-- RLS permanece habilitado; não concedemos permissões ao anon/authenticated.

GRANT USAGE ON SCHEMA public TO service_role;

-- Leitura do catálogo e do relacionamento de imagens no painel.
GRANT SELECT ON TABLE
  public.categories,
  public.products,
  public.product_images
TO service_role;

-- Escrita necessária para criar, editar e excluir produtos, categorias e imagens.
GRANT INSERT, UPDATE, DELETE ON TABLE
  public.categories,
  public.products,
  public.product_images
TO service_role;

-- Consulta usada para validar o acesso administrativo.
GRANT SELECT ON TABLE public.admins TO service_role;
