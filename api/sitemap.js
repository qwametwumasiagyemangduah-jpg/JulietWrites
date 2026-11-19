const SITE = "https://julietwrites.vercel.app";
const RAW_POEMS = "https://raw.githubusercontent.com/qwametwumasiagyemangduah-jpg/JulietWrites/main/data/poems.json";
function xml(value) {
  return String(value || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}
module.exports = async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).send("Method not allowed.");
  try {
    const response = await fetch(RAW_POEMS, { headers: { "Accept": "application/json" } });
    if (!response.ok) throw new Error("Could not load poems for sitemap.");
    const poems = await response.json();
    const fixed = [
      { path: "/", priority: "1.0", freq: "weekly" },
      { path: "/poems", priority: "0.9", freq: "weekly" },
      { path: "/journal", priority: "0.7", freq: "weekly" },
      { path: "/about", priority: "0.8", freq: "monthly" }
    ];
    const entries = fixed.map(item => '<url><loc>' + SITE + item.path + '</loc><changefreq>' + item.freq + '</changefreq><priority>' + item.priority + '</priority></url>');
    for (const poem of Array.isArray(poems) ? poems : []) {
      const slug = poem.slug || poem.id;
      if (!slug) continue;
      const lastmod = poem.updatedAt || poem.createdAt;
      entries.push('<url><loc>' + SITE + '/poem/' + encodeURIComponent(slug) + '</loc>' + (lastmod ? '<lastmod>' + xml(new Date(lastmod).toISOString().slice(0, 10)) + '</lastmod>' : '') + '<changefreq>monthly</changefreq><priority>0.7</priority></url>');
    }
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=0, s-maxage=300, stale-while-revalidate=3600");
    return res.status(200).send('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + entries.join("") + '</urlset>');
  } catch (error) {
    console.error("JulietWrites sitemap:", error);
    res.setHeader("Cache-Control", "no-store");
    return res.status(503).send("Sitemap temporarily unavailable.");
  }
};
