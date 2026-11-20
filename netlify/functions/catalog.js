
// Função pública (somente leitura): devolve categorias e produtos com imagens.
const { SUPABASE_URL, SUPABASE_ANON_KEY } = process.env;
const H = { 'Content-Type': 'application/json; charset=utf-8' };

async function rest(path) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });

  if (!r.ok) throw new Error(`Supabase ${r.status}`);
  return r.json();
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: H,
      body: '{"error":"Método não permitido"}',
    };
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return {
      statusCode: 500,
      headers: H,
      body: '{"error":"Servidor sem configuração do Supabase"}',
    };
  }

  try {
    const [categories, products] = await Promise.all([
      rest('categories?select=id,name,slug&order=sort_order'),
      rest('products?select=id,name,slug,brand,description,price,status,badges,created_at,updated_at,category:categories(name,slug),images:product_images(url,alt,is_main,position)&order=created_at.asc'),
    ]);

    for (const p of products) {
      p.images.sort(
        (a, b) => (b.is_main - a.is_main) || (a.position - b.position)
      );
    }

    return {
      statusCode: 200,
      headers: {
        ...H,
        'Cache-Control': 'public, max-age=60',
      },
      body: JSON.stringify({ categories, products }),
    };
  } catch (e) {
    console.error('ERRO AO CARREGAR CATÁLOGO:', e);

    return {
      statusCode: 502,
      headers: H,
      body: '{"error":"Não foi possível carregar o catálogo agora"}',
    };
  }
};
