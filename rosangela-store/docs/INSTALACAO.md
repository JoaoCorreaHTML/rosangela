# Rosângela Corrêa Store — instalação e publicação

Catálogo virtual (não é e-commerce): site estático no **Netlify**, funções Node.js no Netlify, banco/autenticação/imagens no **Supabase**. O contato é feito pelo WhatsApp (11 97175-2204).

## 1. Supabase
1. Crie um projeto em supabase.com (região mais próxima, ex.: São Paulo) e guarde a senha do banco.
2. Em **SQL Editor**, execute **nesta ordem**: `supabase/01_schema.sql`, `supabase/02_rls.sql`, `supabase/03_seed.sql`. O seed carrega os 11 perfumes e 4 parkas atuais (preços e imagens como estavam; preço vazio = "Preço sob consulta"; todos marcados como disponíveis) e as categorias Perfumes, Roupas, Bolsas e Calçados.
3. Em **Authentication → Users → Add user**, crie o usuário administrador (e-mail e senha forte; marque "Auto confirm"). Em **Authentication → Providers → Email**, desative "Allow new users to sign up" (cadastro público).
4. Autorize o administrador. No SQL Editor:
   ```sql
   insert into public.admins (user_id) select id from auth.users where email = 'SEU-EMAIL@exemplo.com';
   ```
5. Em **Project Settings → API**, copie: Project URL, `anon` key e `service_role` key.
6. Confira em **Storage** que o bucket `product-images` existe (criado pelo `02_rls.sql`; público para leitura, 5 MB, JPEG/PNG/WebP).

## 2. Variáveis de ambiente (Netlify → Site configuration → Environment variables)
| Variável | Valor |
|---|---|
| `SUPABASE_URL` | Project URL |
| `SUPABASE_ANON_KEY` | chave `anon` |
| `SUPABASE_SERVICE_ROLE_KEY` | chave `service_role` (**secreta**: só no Netlify, nunca no Git nem no frontend) |
| `SITE_URL` | `https://rosangelacorreastore.com.br` |
Modelo em `.env.example`. Para testar localmente, copie para `.env` (já está no `.gitignore`).

## 3. Deploy no Netlify
1. Envie esta pasta para o repositório Git que já está ligado ao site (ou arraste a pasta em Deploys). Não é preciso build: `netlify.toml` já define `publish = "."` e as funções.
2. Mantenha o domínio atual em **Domain management**; a hospedagem continua no Netlify.
3. Após o deploy, abra `/admin`, entre e revise os produtos (disponibilidade, descrições, imagens).
4. Envie `https://rosangelacorreastore.com.br/sitemap.xml` no Google Search Console. O sitemap é gerado automaticamente com os produtos.

## 4. Uso do painel (/admin)
- **Resumo:** totais, disponíveis, indisponíveis, categorias e recentes.
- **Produtos:** novo/editar (nome, marca, categoria, preço, disponibilidade, selos, descrição, imagens). Preço vazio mostra "Preço sob consulta". Excluir pede confirmação.
- **Categorias:** criar, renomear, ordenar e excluir (só categorias sem produtos).
- Imagens são reduzidas no navegador (máx. 1600 px, WebP). O servidor rejeita arquivos que não sejam JPEG/PNG/WebP reais e acima de 4 MB.
- Para dar acesso a outra pessoa: crie o usuário no Supabase e repita o passo 1.4. Para remover: `delete from public.admins where user_id = '...'`.

## 5. Chatbot
Responde por regras usando só dados reais do catálogo (produtos, preços, disponibilidade, categorias, marcas) e os contatos da loja. Quando não sabe (ex.: horário, formas de pagamento), diz que não encontrou e oferece o WhatsApp. Não faz entregas, conforme a loja. Para ensinar novas respostas, edite `netlify/functions/chat.js`.

## 6. Checklist de testes após o deploy
- [ ] Catálogo carrega os 15 produtos; busca por "yara" e filtros funcionam.
- [ ] Página do produto abre em `/produto/yara` e o botão leva ao WhatsApp com o nome do produto.
- [ ] Login em `/admin`; senha errada mostra erro; sem login as funções retornam 401.
- [ ] Criar, editar e excluir um produto de teste (com confirmação); enviar e remover imagem.
- [ ] Marcar produto como indisponível: o site e o chatbot passam a informar isso.
- [ ] Categorias: criar, editar; excluir categoria com produtos é bloqueado.
- [ ] Chatbot: "quais categorias", "quanto custa o Yara", "vocês entregam", pergunta desconhecida.
- [ ] Celular: menu, catálogo, painel e chatbot em tela pequena.
- [ ] `/sitemap.xml` lista os produtos; `/robots.txt` bloqueia `/admin/`.

## 7. Segurança (resumo)
RLS: visitantes só leem; escrita só para admins. Login e permissões validados no servidor; entradas validadas e consultas parametrizadas pelo PostgREST; conteúdo exibido como texto (XSS); CSP restritiva; upload com validação por conteúdo, tipo e tamanho; exclusões exigem confirmação no painel e no servidor; chaves privadas só no Netlify.

## 8. Pendências para a loja confirmar
- **Endereço:** o JSON-LD do SEO usa "Av. Abílio dos Santos Branco, 498, Enseada" e o link do Maps usa "Rua Abílio do Santos Branco 498, Jardim Praiano" (como no site original). Confirme o correto e padronize.
- A frase "Importados originais com certificação" (seção Sobre) veio do site anterior; mantenha só se for comprovável.
- Seções Bolsas e Calçados agora são categorias vazias; cadastre produtos quando houver.
- O `.htaccess` do site antigo foi removido (Apache); os cabeçalhos agora ficam em `netlify.toml`.
