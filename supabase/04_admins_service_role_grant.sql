-- Permite que a Netlify Function consulte a lista de administradores usando a chave service_role.
-- Mantém o RLS habilitado; não concede acesso público nem permissões de escrita.
GRANT SELECT ON TABLE public.admins TO service_role;
