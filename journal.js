const holder = document.getElementById("journal-list");
const params = new URLSearchParams(location.search);
const selectedId = params.get("id");
const dateLabel = value => new Date(value).toLocaleDateString(undefined,{year:"numeric",month:"long",day:"numeric"});
function safeText(tag, text, className) {
  const node=document.createElement(tag); node.textContent=text || ""; if(className) node.className=className; return node;
}
async function loadJournal() {
  try {
    const response=await fetch("/api/journal",{cache:"no-store"});
    if(!response.ok) throw new Error("The journal could not be loaded right now.");
    const data=await response.json();
    const entries=data.entries || [];
    if(selectedId) {
      const entry=entries.find(item=>item.id===selectedId);
      if(!entry) {
        holder.append(safeText("h2","This entry could not be found."));
        holder.append(safeText("p","It may have been moved or removed.","journal-empty-copy"));
        return;
      }
      const article=document.createElement("article"); article.className="journal-detail";
      const back=document.createElement("a"); back.href="/journal"; back.className="journal-back"; back.textContent="← All journal entries";
      article.append(back,safeText("span",entry.category || "Reflections","eyebrow"),safeText("h2",entry.title,"journal-detail-title"),safeText("time",dateLabel(entry.createdAt),"journal-date"));
      const body=safeText("p",entry.content,"journal-detail-body"); body.style.whiteSpace="pre-wrap"; article.append(body); holder.append(article);
      document.title=entry.title+" — Journal | JulietWrites";
      return;
    }
    if(!entries.length) {
      const empty=document.createElement("section"); empty.className="empty-state";
      empty.append(safeText("span","A SPACE TO THINK","eyebrow"),safeText("h2","Something will be written here."),safeText("p","The journal is open, waiting for Juliet's thoughts and reflections.","journal-empty-copy"));
      holder.append(empty); return;
    }
    const grid=document.createElement("div"); grid.className="journal-grid";
    entries.forEach(entry=>{
      const card=document.createElement("a"); card.className="journal-card"; card.href="/journal?id="+encodeURIComponent(entry.id);
      card.append(safeText("span",entry.category || "Reflections","eyebrow"),safeText("time",dateLabel(entry.createdAt),"journal-date"),safeText("h2",entry.title));
      const preview=entry.content.length>190?entry.content.slice(0,190).trim()+"…":entry.content;
      card.append(safeText("p",preview,"journal-preview"),safeText("span","Read reflection","journal-read"));
      grid.append(card);
    });
    holder.append(grid);
  } catch(error) {
    holder.append(safeText("p",error.message,"journal-empty-copy"));
  }
}
loadJournal();