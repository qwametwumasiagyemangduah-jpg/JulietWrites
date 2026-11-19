const list = document.getElementById("poem-list");
function addText(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  el.textContent = text;
  return el;
}
function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}
function renderEmpty() {
  const empty = document.createElement("section");
  empty.className = "empty-state";
  empty.append(
    addText("span", "eyebrow", "THE FIRST PAGE"),
    addText("h2", "", "The words are on their way."),
    addText("p", "", "Juliet's poems will be gathered here as they are shared. Until then, this space is waiting for the words that make it yours.")
  );
  list.replaceChildren(empty);
}
function renderCollection(poems) {
  list.className = "poem-list poem-grid";
  list.replaceChildren();
  poems.forEach((poem, index) => {
    const card = document.createElement("a");
    card.className = "poem-title-card reveal";
    card.href = "/poems?id=" + encodeURIComponent(poem.id);
    card.setAttribute("aria-label", "Read " + poem.title);
    const meta = addText("div", "featured-meta", "POEM " + String(index + 1).padStart(2, "0") + (formatDate(poem.createdAt) ? " · " + formatDate(poem.createdAt) : ""));
    const title = addText("h2", "", poem.title);
    const action = addText("span", "poem-card-action", "Read poem");
    card.append(meta, title, action);
    list.append(card);
  });
}
function renderPoem(poem) {
  list.className = "poem-list poem-detail";
  list.replaceChildren();
  const back = document.createElement("a");
  back.className = "poem-back";
  back.href = "/poems";
  back.textContent = "Back to all poems";
  const article = document.createElement("article");
  article.className = "poem-card reveal";
  article.append(
    addText("div", "featured-meta", "FROM THE POETRY COLLECTION" + (formatDate(poem.createdAt) ? " · " + formatDate(poem.createdAt) : "")),
    addText("h2", "", poem.title),
    addText("p", "poem-body", poem.content)
  );
  list.append(back, article);
  document.title = poem.title + " — JulietWrites";
}
(async () => {
  try {
    const response = await fetch("/api/poems", { cache: "no-store" });
    if (!response.ok) throw new Error("The collection could not be loaded.");
    const data = await response.json();
    const poems = Array.isArray(data.poems) ? data.poems : [];
    if (!poems.length) { renderEmpty(); return; }
    const selectedId = new URLSearchParams(window.location.search).get("id");
    if (selectedId) {
      const selected = poems.find(poem => poem.id === selectedId);
      if (selected) renderPoem(selected);
      else {
        renderCollection(poems);
        list.prepend(addText("p", "poem-notice", "That poem could not be found. Choose another poem below."));
      }
      return;
    }
    renderCollection(poems);
  } catch (error) {
    list.replaceChildren(addText("p", "empty-state", "The poetry collection is temporarily unavailable. Please try again shortly."));
  }
})();
