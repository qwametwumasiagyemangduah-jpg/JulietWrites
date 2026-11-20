const SITE = "https://julietwrites.vercel.app";
const RAW_POEMS = "https://raw.githubusercontent.com/qwametwumasiagyemangduah-jpg/JulietWrites/main/data/poems.json";
const LOGO = SITE + "/file_00000000071882438b394cce63331488.png";

function escapeHtml(value) {
  return String(value == null ? "" : value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[char]));
}
function slugFor(poem) {
  return poem.slug || poem.id;
}
function dateLabel(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("en", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
}
function descriptionFor(poem) {
  const plain = String(poem.content || "").replace(/\s+/g, " ").trim();
  return (plain.length > 155 ? plain.slice(0, 152).trimEnd() + "..." : plain) || "Read an original poem by Juliet Asamoah on JulietWrites.";
}
function header(active) {
  return '<header class="site-header"><a class="brand" href="/" aria-label="JulietWrites home"><span class="brand-name">Juliet<span class="brand-script">Writes</span><span class="brand-dot">.</span></span></a><button class="menu-toggle" aria-label="Open navigation" aria-expanded="false">☰</button><nav class="nav"><a href="/">Home</a><a class="' + (active === "poems" ? "active" : "") + '" href="/poems">Poetry</a><a href="/journal">Journal</a><a href="/about">About</a></nav></header>';
}
function footer() {
  return '<footer class="footer"><a class="brand" href="/" aria-label="JulietWrites home"><span class="brand-name">Juliet<span class="brand-script">Writes</span><span class="brand-dot">.</span></span></a><p>Written with feeling. Left here in words.</p><div class="footer-social" aria-label="Follow Juliet"><span>FOLLOW JULIET</span><a href="https://www.instagram.com/juliet.writes0/" target="_blank" rel="noopener noreferrer">Instagram</a><a href="https://www.tiktok.com/@juliet.writes0" target="_blank" rel="noopener noreferrer">TikTok</a></div><div class="footer-copyright"><p>© 2026 Juliet Asamoah. All Rights Reserved.</p><p>JulietWrites is the official publishing platform for the original literary works of Juliet Asamoah.</p><p>No poem may be reproduced, republished, distributed or commercially used without prior permission from the copyright owner.</p></div><div class="footer-bottom"><span>© <span id="year"></span> JulietWrites</span><span>Made with care</span></div></footer>';
}
function documentHtml({ title, description, canonical, body, poem }) {
  const json = poem ? JSON.stringify(poem).replace(/</g, "\\u003c") : "";
  const structured = poem ? {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    "name": poem.title,
    "author": { "@type": "Person", "name": "Juliet Asamoah" },
    "publisher": { "@type": "Organization", "name": "JulietWrites", "url": SITE },
    "url": canonical,
    "datePublished": poem.createdAt,
    "dateModified": poem.updatedAt || poem.createdAt,
    "inLanguage": "en",
    "copyrightHolder": { "@type": "Person", "name": "Juliet Asamoah" }
  } : {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Poetry — JulietWrites",
    "url": canonical,
    "isPartOf": { "@type": "WebSite", "name": "JulietWrites", "url": SITE }
  };
  const structuredJson = JSON.stringify(structured).replace(/</g, "\\u003c");
  return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#11100f"><title>' + escapeHtml(title) + '</title><meta name="description" content="' + escapeHtml(description) + '"><meta name="robots" content="index,follow,max-image-preview:large"><link rel="canonical" href="' + escapeHtml(canonical) + '"><meta property="og:type" content="' + (poem ? "article" : "website") + '"><meta property="og:site_name" content="JulietWrites"><meta property="og:title" content="' + escapeHtml(title) + '"><meta property="og:description" content="' + escapeHtml(description) + '"><meta property="og:url" content="' + escapeHtml(canonical) + '"><script type="application/ld+json">' + structuredJson + '</script><meta property="og:image" content="' + LOGO + '"><meta property="og:image:secure_url" content="' + LOGO + '"><meta property="og:image:type" content="image/png"><meta property="og:image:alt" content="JulietWrites logo"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="' + escapeHtml(title) + '"><meta name="twitter:description" content="' + escapeHtml(description) + '"><meta name="twitter:image" content="' + LOGO + '"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Playfair+Display:ital,wght@0,400;1,400&family=Allura&display=swap" rel="stylesheet"><link rel="stylesheet" href="/styles.css"></head><body>' + header("poems") + '<main>' + body + '</main>' + footer() + '<script src="/script.js" defer></script>' + (poem ? '<script id="poem-data" type="application/json">' + json + '</script><script src="/poems.js" defer></script><script src="/engagement.js" defer></script>' : '') + '</body></html>';
}
async function readPoems() {
  const response = await fetch(RAW_POEMS, { headers: { "Accept": "application/json" } });
  if (!response.ok) throw new Error("The poetry collection could not be loaded.");
  const poems = await response.json();
  if (!Array.isArray(poems)) throw new Error("The poetry collection is not available.");
  return poems.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}
module.exports = async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).send("Method not allowed.");
  try {
    const poems = await readPoems();
    const queryId = req.query && req.query.id;
    const requestedSlug = req.query && req.query.slug;
    if (queryId) {
      const legacyPoem = poems.find(item => item.id === queryId || slugFor(item) === queryId);
      if (legacyPoem) return res.redirect(308, "/poem/" + encodeURIComponent(slugFor(legacyPoem)));
    }
    if (requestedSlug) {
      const poem = poems.find(item => slugFor(item) === requestedSlug || item.id === requestedSlug);
      if (!poem) {
        res.setHeader("Cache-Control", "public, max-age=0, s-maxage=60");
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        return res.status(404).send(documentHtml({
          title: "Poem not found — JulietWrites",
          description: "This poem could not be found in the JulietWrites collection.",
          canonical: SITE + "/poems",
          body: '<section class="page-hero"><div class="eyebrow">THE COLLECTION</div><h1>Words can<br><em>be found again.</em></h1><p>This poem may have been moved or removed.</p><a class="text-link" href="/poems">Return to the poetry collection →</a></section>'
        }));
      }
      const canonical = SITE + "/poem/" + encodeURIComponent(slugFor(poem));
      const description = descriptionFor(poem);
      const body = '<section class="page-hero"><div class="eyebrow">THE POETRY COLLECTION</div><h1>Words, held<br><em>in a moment.</em></h1><p>An original poem by Juliet Asamoah.</p></section><section class="poem-list poem-detail"><a class="poem-back" href="/poems">← Back to all poems</a><article class="poem-card"><div class="featured-meta">FROM THE POETRY COLLECTION' + (poem.createdAt ? ' · ' + escapeHtml(dateLabel(poem.createdAt)) : '') + '</div><h2>' + escapeHtml(poem.title) + '</h2><p class="poem-body">' + escapeHtml(poem.content) + '</p><p class="poem-copyright">© 2026 Juliet Asamoah. All Rights Reserved.</p></article><button type="button" class="button button-outline poem-download">Download poem ↓</button><div class="poem-share" style="margin-top:1.5rem;display:flex;flex-wrap:wrap;gap:.65rem;align-items:center"><span class="featured-meta" style="width:100%">SHARE THIS POEM</span><button type="button" class="button button-outline" id="poem-share-native" aria-label="Share poem"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:middle;margin-right:.4rem"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 10.7 6.8-4.1M8.6 13.3l6.8 4.1"/></svg>Share</button><a class="button button-outline" id="poem-share-whatsapp" target="_blank" rel="noopener noreferrer">WhatsApp</a><a class="button button-outline" id="poem-share-facebook" target="_blank" rel="noopener noreferrer">Facebook</a><a class="button button-outline" id="poem-share-x" target="_blank" rel="noopener noreferrer">X</a><button type="button" class="button button-outline" id="poem-copy-link">Copy Link</button><span id="poem-share-status" role="status" aria-live="polite" style="font-size:.85rem"></span></div><section class="reader-engagement panel" aria-labelledby="reader-engagement-title" style="margin-top:2.5rem"><h2 id="reader-engagement-title">A space for readers</h2><div class="like-row"><button type="button" id="poem-like-button" class="button button-outline">♡ Like this poem</button><span id="poem-like-count" class="featured-meta" aria-live="polite">Loading likes…</span></div><div class="reader-reflections"><h3>Reader reflections</h3><div id="approved-reflections"><p class="hint">Loading reflections…</p></div></div><form id="reader-response-form" class="reader-response-form"><h3>Leave a reflection</h3><p class="hint">Your response will be reviewed before it appears publicly.</p><label class="field"><span>Your reflection</span><textarea id="reader-reflection" maxlength="1200" required placeholder="What did this poem make you think or feel?"></textarea></label><button class="button button-solid" type="submit">Submit reflection ↗</button><p id="reader-response-status" class="status" role="status" aria-live="polite"></p></form></section></section><script>(function(){var url=window.location.href,title=document.querySelector(".poem-card h2")?.textContent||document.title,msg=title+" — by Juliet Asamoah\\nRead it on JulietWrites: "+url;var enc=encodeURIComponent(msg);var wa=document.getElementById("poem-share-whatsapp"),fb=document.getElementById("poem-share-facebook"),x=document.getElementById("poem-share-x");if(wa)wa.href="https://wa.me/?text="+enc;if(fb)fb.href="https://www.facebook.com/sharer/sharer.php?u="+encodeURIComponent(url);if(x)x.href="https://twitter.com/intent/tweet?text="+encodeURIComponent(title+" — by Juliet Asamoah")+"&url="+encodeURIComponent(url);var status=document.getElementById("poem-share-status");document.getElementById("poem-share-native")?.addEventListener("click",async function(){if(navigator.share){try{await navigator.share({title:title,text:"By Juliet Asamoah",url:url})}catch(e){}}else{try{await navigator.clipboard.writeText(msg);if(status)status.textContent="Share text copied."}catch(e){if(status)status.textContent="Use Copy Link to share this poem."}}});document.getElementById("poem-copy-link")?.addEventListener("click",async function(){try{await navigator.clipboard.writeText(url);if(status)status.textContent="Link copied!";}catch(e){var field=document.createElement("textarea");field.value=url;document.body.appendChild(field);field.select();try{document.execCommand("copy");if(status)status.textContent="Link copied!"}catch(err){if(status)status.textContent="Please copy the address from your browser."}field.remove();}});})();</script>';
      const html = documentHtml({ title: poem.title + " — JulietWrites", description, canonical, body, poem });
      res.setHeader("Cache-Control", "public, max-age=0, s-maxage=60, stale-while-revalidate=300");
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.status(200).send(html);
    }
    const cards = poems.map((poem, index) =>
      '<a class="poem-title-card reveal" href="/poem/' + encodeURIComponent(slugFor(poem)) + '" aria-label="Read ' + escapeHtml(poem.title) + '"><div class="featured-meta">POEM ' + String(index + 1).padStart(2, "0") + (poem.createdAt ? ' · ' + escapeHtml(dateLabel(poem.createdAt)) : '') + '</div><h2>' + escapeHtml(poem.title) + '</h2><span class="poem-card-action">Read poem</span></a>'
    ).join("");
    const empty = '<div class="empty-state"><span class="eyebrow">THE FIRST PAGE</span><h2>The words are on their way.</h2><p>Juliet’s poems will be gathered here as they are shared.</p></div>';
    const body = '<section class="page-hero"><div class="eyebrow">THE COLLECTION</div><h1>Poetry, in all<br><em>its forms.</em></h1><p>For love and loss, for becoming, for the little things and the things too big to name. This is a collection still growing.</p></section><section id="poem-list" class="poem-list ' + (poems.length ? 'poem-grid' : '') + '">' + (poems.length ? cards : empty) + '</section>';
    const html = documentHtml({
      title: "Poetry — JulietWrites",
      description: "Explore original poems by Juliet Asamoah, published in the JulietWrites poetry collection.",
      canonical: SITE + "/poems",
      body
    });
    res.setHeader("Cache-Control", "public, max-age=0, s-maxage=60, stale-while-revalidate=300");
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(200).send(html);
  } catch (error) {
    console.error("JulietWrites poetry page:", error);
    res.setHeader("Cache-Control", "no-store");
    return res.status(503).send("The poetry collection is temporarily unavailable. Please try again shortly.");
  }
};
