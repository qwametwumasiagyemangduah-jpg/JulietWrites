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
  const download = document.createElement("button");
  download.type = "button";
  download.className = "button button-outline poem-download";
  download.textContent = "Download poem ↓";
  download.addEventListener("click", async () => {
    const safeTitle = poem.title.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "julietwrites-poem";
    const originalLabel = download.textContent;
    download.disabled = true;
    download.textContent = "Preparing your download…";

    function downloadTextCopy() {
      const text = poem.title + "\\n\\n" + poem.content + "\\n\\n— JulietWrites";
      const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = safeTitle + ".txt";
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
    }

    async function loadJsPdf() {
      if (window.jspdf && window.jspdf.jsPDF) return window.jspdf.jsPDF;
      const sources = [
        "https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js",
        "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.2/jspdf.umd.min.js"
      ];
      let lastError;
      for (const src of sources) {
        try {
          await new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src = src;
            script.async = true;
            script.onload = () => window.jspdf && window.jspdf.jsPDF ? resolve() : reject(new Error("PDF library did not initialize."));
            script.onerror = () => reject(new Error("Could not load PDF library."));
            document.head.appendChild(script);
          });
          if (window.jspdf && window.jspdf.jsPDF) return window.jspdf.jsPDF;
        } catch (error) {
          lastError = error;
        }
      }
      throw lastError || new Error("PDF library unavailable.");
    }

    try {
      const jsPDF = await loadJsPdf();
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = 210, pageH = 297, margin = 24;
      const gold = [185, 162, 122], ink = [45, 39, 35], muted = [125, 112, 99];
      let page = 1;
      function decorate() {
        doc.setFillColor(250, 247, 241);
        doc.rect(0, 0, pageW, pageH, "F");
        doc.setDrawColor(...gold);
        doc.setLineWidth(.55);
        doc.rect(10, 10, pageW - 20, pageH - 20);
        doc.setLineWidth(.2);
        doc.rect(13, 13, pageW - 26, pageH - 26);
        [[18,18],[192,18],[18,279],[192,279]].forEach(([x,y]) => {
          doc.setFillColor(...gold); doc.circle(x, y, 1.1, "F");
          doc.setLineWidth(.3); doc.line(x-3,y,x+3,y); doc.line(x,y-3,x,y+3);
        });
        doc.setTextColor(...muted); doc.setFont("times", "italic"); doc.setFontSize(10);
        doc.text("J U L I E T W R I T E S", pageW/2, 27, { align: "center" });
        doc.setDrawColor(...gold); doc.line(65, 33, 145, 33);
        doc.setFont("times", "normal"); doc.setFontSize(8);
        doc.text("JulietWrites  ·  Poetry Collection", pageW/2, 285, { align: "center" });
        doc.text(String(page), pageW/2, 290, { align: "center" });
      }
      decorate();
      let y = 55;
      doc.setTextColor(...gold); doc.setFont("times", "italic"); doc.setFontSize(10);
      doc.text("A POEM BY JULIET ASAMOAH", pageW/2, y, { align: "center" });
      y += 16;
      doc.setTextColor(...ink); doc.setFont("times", "bold"); doc.setFontSize(23);
      const titleLines = doc.splitTextToSize(poem.title, pageW - margin*2 - 12);
      doc.text(titleLines, pageW/2, y, { align: "center", lineHeightFactor: 1.25 });
      y += titleLines.length * 10 + 9;
      doc.setDrawColor(...gold); doc.setLineWidth(.35); doc.line(83, y, 127, y); y += 13;
      doc.setFont("times", "normal"); doc.setFontSize(12); doc.setTextColor(...ink);
      const paragraphs = String(poem.content || "").replace(/\\r/g, "").split("\\n");
      const lineHeight = 6.4, maxWidth = pageW - margin*2 - 12;
      for (const paragraph of paragraphs) {
        if (!paragraph.trim()) { y += lineHeight * .75; continue; }
        const lines = doc.splitTextToSize(paragraph, maxWidth);
        for (const line of lines) {
          if (y > pageH - 34) { page += 1; doc.addPage(); decorate(); y = 48; }
          doc.text(line, margin + 6, y); y += lineHeight;
        }
      }
      doc.save(safeTitle + ".pdf");
    } catch (error) {
      console.error("JulietWrites poem download:", error);
      downloadTextCopy();
      alert("PDF download is unavailable right now, so a text copy of the poem has been downloaded instead. Please try the PDF again when your connection is stable.");
    } finally {
      download.disabled = false;
      download.textContent = originalLabel;
    }
  });;
  list.append(back, article, download);
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
