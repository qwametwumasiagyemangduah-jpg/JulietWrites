const byId = id => document.getElementById(id);
const loginPanel = byId("login-panel"), editorPanel = byId("editor-panel");
const loginStatus = byId("login-status"), editorStatus = byId("editor-status");
const form = byId("poem-form");

async function api(url, options = {}) {
  const response = await fetch(url, { credentials: "same-origin", ...options, headers: { "Content-Type": "application/json", ...(options.headers || {}) } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Something went wrong.");
  return data;
}
function showEditor() { loginPanel.classList.add("hidden"); editorPanel.classList.remove("hidden"); loadPoems(); }
function showLogin() { editorPanel.classList.add("hidden"); loginPanel.classList.remove("hidden"); }
async function loadPoems() {
  const holder = byId("poem-management");
  holder.innerHTML = '<p class="hint">Loading your poems…</p>';
  try {
    const data = await api("/api/poems?manage=1");
    holder.replaceChildren();
    if (!data.poems.length) { holder.innerHTML = '<p class="hint">No poems published yet. Your first one can begin here.</p>'; return; }
    data.poems.forEach(poem => {
      const row = document.createElement("div"); row.className = "poem-row";
      const info = document.createElement("div");
      const title = document.createElement("h3"); title.textContent = poem.title;
      const date = document.createElement("small"); date.textContent = new Date(poem.createdAt).toLocaleDateString();
      info.append(title, date);
      const actions = document.createElement("div"); actions.className = "admin-actions";
      const edit = document.createElement("button"); edit.className = "small-btn"; edit.textContent = "Edit";
      edit.addEventListener("click", () => {
        byId("poem-id").value = poem.id; byId("poem-title").value = poem.title; byId("poem-content").value = poem.content;
        byId("form-title").textContent = "Edit your poem"; byId("publish-button").textContent = "Save changes ↗";
        byId("cancel-edit").classList.remove("hidden"); form.scrollIntoView({ behavior: "smooth" });
      });
      const remove = document.createElement("button"); remove.className = "small-btn danger"; remove.textContent = "Delete";
      remove.addEventListener("click", async () => {
        if (!confirm('Delete "' + poem.title + '"? This cannot be undone.')) return;
        try { await api("/api/poems", { method: "DELETE", body: JSON.stringify({ id: poem.id }) }); editorStatus.textContent = "Poem deleted."; resetForm(); loadPoems(); }
        catch (error) { editorStatus.textContent = error.message; }
      });
      actions.append(edit, remove); row.append(info, actions); holder.append(row);
    });
  } catch (error) { holder.textContent = error.message; if (error.message.includes("sign in")) { showLogin(); } }
}
function resetForm() {
  form.reset(); byId("poem-id").value = ""; byId("form-title").textContent = "Write a new poem";
  byId("publish-button").textContent = "Publish poem ↗"; byId("cancel-edit").classList.add("hidden");
}
byId("login-form").addEventListener("submit", async event => {
  event.preventDefault(); loginStatus.textContent = "Checking…";
  try { await api("/api/login", { method: "POST", body: JSON.stringify({ password: byId("password").value }) }); byId("password").value = ""; loginStatus.textContent = ""; showEditor(); }
  catch (error) { loginStatus.textContent = error.message; }
});
form.addEventListener("submit", async event => {
  event.preventDefault(); editorStatus.textContent = "Publishing…";
  const id = byId("poem-id").value;
  try {
    await api("/api/poems", { method: id ? "PUT" : "POST", body: JSON.stringify({ id, title: byId("poem-title").value, content: byId("poem-content").value }) });
    editorStatus.textContent = id ? "Your changes have been saved." : "Your poem is now published.";
    resetForm(); loadPoems();
  } catch (error) { editorStatus.textContent = error.message; }
});
byId("cancel-edit").addEventListener("click", resetForm);
byId("logout").addEventListener("click", async () => { try { await api("/api/logout", { method: "POST", body: "{}" }); } finally { resetForm(); showLogin(); } });
(async () => { try { await api("/api/poems?manage=1"); showEditor(); } catch (_) { showLogin(); } })();
