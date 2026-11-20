
const { SUPABASE_URL, SUPABASE_ANON_KEY } = process.env;

const H = {
  'Content-Type': 'application/json; charset=utf-8',
};

async function rest(path) {
  const url = `${SUPABASE_URL}/rest/v1/${path}`;

  const r = await fetch(url, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });

  if (!r.ok) {
    const errorBody = await r.text();

    console.error('ERRO DETALHADO SUPABASE:', {
      path,
      status: r.status,
      response: errorBody,
    });

    throw new Error(
      `Supabase ${r.status} em ${path}: ${errorBody}`
    );
  }

  return r.json();
}

exports.handler = async (event) => {
  // Permitir somente requisições GET
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: H,
      body: JSON.stringify({
        error: 'Método não permitido',
      }),
    };
  }

  // Verificar configurações do Supabase
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('Configuração do Supabase ausente.');

    return {
      statusCode: 500,
      headers: H,
      body: JSON.stringify({
        error: 'Servidor sem configuração do Supabase',
      }),
    };
  }

  try {
    // Buscar categorias e produtos
    const [categories, products] = await Promise.all([
      rest('categories?select=id,name,slug&order=sort_order'),

      rest(
        'products?select=id,name,slug,brand,description,price,status,badges,created_at,updated_at,category:categories(name,slug),images:product_images(url,alt,is_main,position)&order=created_at.asc'
      ),
    ]);

    // Organizar imagens: principal primeiro
    for (const p of products) {
      if (!Array.isArray(p.images)) {
        p.images = [];
      }

      p.images.sort(
        (a, b) =>
          (Number(b.is_main) - Number(a.is_main)) ||
          (Number(a.position) - Number(b.position))
      );
    }

    console.log('CATÁLOGO CARREGADO:', {
      categorias: categories.length,
      produtos: products.length,
    });

    return {
      statusCode: 200,
      headers: {
        ...H,
        'Cache-Control': 'public, max-age=60',
      },
      body: JSON.stringify({
        categories,
        products,
      }),
    };

  } catch (e) {
    console.error('ERRO AO CARREGAR CATÁLOGO:', e);

    return {
      statusCode: 502,
      headers: H,
      body: JSON.stringify({
        error: 'Não foi possível carregar o catálogo agora',
      }),
    };
  }
};
