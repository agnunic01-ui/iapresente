export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { query, budget_min, budget_max } = req.body || {};
  if (!query) return res.status(400).json({ error: "query obrigatória" });

  try {
    // 1. Obter token de acesso ML
    const tokenRes = await fetch("https://api.mercadolibre.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: process.env.ML_APP_ID,
        client_secret: process.env.ML_CLIENT_SECRET,
      }),
    });
    const tokenData = await tokenRes.json();
    const token = tokenData.access_token;
    if (!token) return res.status(500).json({ error: "Falha ao obter token ML" });

    // 2. Buscar produtos
    const params = new URLSearchParams({
      q: query,
      site_id: "MLB",
      limit: 6,
      sort: "relevance",
      ...(budget_min && { price_min: budget_min }),
      ...(budget_max && budget_max < 9999 && { price_max: budget_max }),
    });

    const searchRes = await fetch(
      `https://api.mercadolibre.com/sites/MLB/search?${params}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const searchData = await searchRes.json();

    const products = (searchData.results || []).slice(0, 6).map(item => ({
      title: item.title,
      price: item.price,
      url: item.permalink,
      thumbnail: item.thumbnail?.replace("http://", "https://"),
      free_shipping: item.shipping?.free_shipping || false,
    }));

    return res.status(200).json({ products });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
