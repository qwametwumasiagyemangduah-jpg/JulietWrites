(() => {
  const dataNode = document.getElementById("poem-data");
  const button = document.querySelector(".poem-download");
  if (!dataNode || !button) return;

  let poem;
  try { poem = JSON.parse(dataNode.textContent); } catch (_) { return; }

  function safeFilename(value) {
    return String(value || "julietwrites-poem").toLowerCase().normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "julietwrites-poem";
  }
  function downloadTextCopy() {
    const text = poem.title + "\n\n" + poem.content + "\n\n© 2026 Juliet Asamoah. All Rights Reserved.\n\n— JulietWrites";
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = safeFilename(poem.title) + ".txt";
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }
  async function loadJsPdf() {
    if (window.jspdf && window.jspdf.jsPDF) return window.jspdf.jsPDF;
    const sources = [
      "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.2/jspdf.umd.min.js",
      "https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js"
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
        return window.jspdf.jsPDF;
      } catch (error) { lastError = error; }
    }
    throw lastError || new Error("PDF library unavailable.");
  }
  button.addEventListener("click", async () => {
    const originalLabel = button.textContent;
    button.disabled = true;
    button.textContent = "Preparing your download…";
    try {
      const jsPDF = await loadJsPdf();
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = 210, pageH = 297, margin = 24;
      const gold = [185, 162, 122], ink = [45, 39, 35], muted = [125, 112, 99];
      let page = 1;
      function decorate() {
        doc.setFillColor(250, 247, 241); doc.rect(0, 0, pageW, pageH, "F");
        doc.setDrawColor(...gold); doc.setLineWidth(.55); doc.rect(10, 10, pageW - 20, pageH - 20);
        doc.setLineWidth(.2); doc.rect(13, 13, pageW - 26, pageH - 26);
        doc.setTextColor(...muted); doc.setFont("times", "italic"); doc.setFontSize(10);
        doc.text("J U L I E T W R I T E S", pageW / 2, 27, { align: "center" });
        doc.setDrawColor(...gold); doc.line(65, 33, 145, 33);
        doc.setFont("times", "normal"); doc.setFontSize(8);
        doc.text("JulietWrites · Poetry Collection", pageW / 2, 285, { align: "center" });
        doc.text(String(page), pageW / 2, 290, { align: "center" });
      }
      decorate();
      let y = 55;
      doc.setTextColor(...gold); doc.setFont("times", "italic"); doc.setFontSize(10);
      doc.text("A POEM BY JULIET ASAMOAH", pageW / 2, y, { align: "center" });
      y += 16;
      doc.setTextColor(...ink); doc.setFont("times", "bold"); doc.setFontSize(23);
      const titleLines = doc.splitTextToSize(poem.title, pageW - margin * 2 - 12);
      doc.text(titleLines, pageW / 2, y, { align: "center", lineHeightFactor: 1.25 });
      y += titleLines.length * 10 + 9;
      doc.setDrawColor(...gold); doc.setLineWidth(.35); doc.line(83, y, 127, y); y += 13;
      doc.setFont("times", "normal"); doc.setFontSize(12); doc.setTextColor(...ink);
      const paragraphs = (String(poem.content || "") + "\n\n© 2026 Juliet Asamoah. All Rights Reserved.").replace(/\r/g, "").split("\n");
      const lineHeight = 6.4, maxWidth = pageW - margin * 2 - 12;
      for (const paragraph of paragraphs) {
        if (!paragraph.trim()) { y += lineHeight * .75; continue; }
        for (const line of doc.splitTextToSize(paragraph, maxWidth)) {
          if (y > pageH - 34) { page += 1; doc.addPage(); decorate(); y = 48; }
          doc.text(line, margin + 6, y); y += lineHeight;
        }
      }
      doc.save(safeFilename(poem.title) + ".pdf");
    } catch (error) {
      console.error("JulietWrites poem download:", error);
      downloadTextCopy();
      alert("PDF download is unavailable right now, so a text copy has been downloaded instead. Please try the PDF again when your connection is stable.");
    } finally {
      button.disabled = false;
      button.textContent = originalLabel;
    }
  });
})();