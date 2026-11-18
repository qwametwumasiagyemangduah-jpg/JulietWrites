const list = document.getElementById("poem-list");
function addText(tag, className, text) { const el = document.createElement(tag); if (className) el.className = className; el.textContent = text; return el; }
(async () => {
  try {
    const response = await fetch("/api/poems", { cache: "no-store" });
    if (!response.ok) throw new Error("The collection could not be loaded.");
    const data = await response.json();
    list.replaceChildren();
    if (!data.poems.length) {
      const empty = document.createElement("section"); empty.className = "empty-state";
      empty.append(addText("span", "eyebrow", "THE FIRST PAGE"), addText("h2", "", "The words are on their way."), addText("p", "", "Juliet's poems will be gathered here as they are shared.\nUntil then, this space is waiting for the words that make it yours."));
      list.append(empty); return;
    }
    data.poems.forEach((poem, index) => {
      const article = document.createElement("article"); article.className = "poem-card reveal";
      const meta = addText("div", "featured-meta", "POEM " + String(index + 1).padStart(2, "0") + " · " + new Date(poem.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }));
      const title = addText("h2", "", poem.title);
      const body = addText("p", "poem-body", poem.content);
      article.append(meta, title, body); list.append(article);
    });
  } catch (error) {
    list.replaceChildren(addText("p", "empty-state", "The poetry collection is temporarily unavailable. Please try again shortly."));
  }
})();
