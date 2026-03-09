export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { query, budget_min, budget_max } = req.body || {};
  if (!query) return res.status(400).json({ error: "query obrigatória" });

  try {
    const params = new URLSearchParams({
      q: query,
      site_id: "MLB",
      limit: "6",
      sort: "relevance",
    });

    if (budget_min && budget_min > 0) params.append("price_min", budget_min);
    if (budget_max && budget_max < 9999) params.append("price_max", budget_max);

    const url = `https://api.mercadolibre.com/sites/MLB/search?${params.toString()}`;
    console.log("Buscando:", url);

    const searchRes = await fetch(url);
    const searchData = await searchRes.json();

    console.log("Status ML:", searchRes.status);
    console.log("Total resultados:", searchData.paging?.total);

    if (!searchRes.ok) {
      return res.status(500).json({ error: "Erro ML", detail: searchData });
    }

    const products = (searchData.results || []).slice(0, 6).map(item => ({
      title: item.title,
      price: item.price,
      url: item.permalink,
      thumbnail: item.thumbnail?.replace("http://", "https://"),
      free_shipping: item.shipping?.free_shipping || false,
    }));

    return res.status(200).json({ products });
  } catch (err) {
    console.error("Erro:", err);
    return res.status(500).json({ error: err.message });
  }
}
