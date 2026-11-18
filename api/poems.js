const crypto = require("crypto");
const { hasSession, sameOrigin } = require("./_auth");

const OWNER = "qwametwumasiagyemangduah-jpg";
const REPO = "JulietWrites";
const BRANCH = "main";
const FILE_PATH = "data/poems.json";
const API = "https://api.github.com/repos/" + OWNER + "/" + REPO + "/contents/" + FILE_PATH;

async function readStore() {
  const response = await fetch(API + "?ref=" + BRANCH, {
    headers: { "Accept": "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" }
  });
  if (!response.ok) throw new Error("Could not read the poems file from GitHub.");
  const file = await response.json();
  const decoded = Buffer.from(file.content.replace(/\n/g, ""), "base64").toString("utf8");
  return { poems: JSON.parse(decoded), sha: file.sha };
}

async function saveStore(poems, sha, message) {
  if (!process.env.GITHUB_TOKEN) throw new Error("Publishing has not been configured yet.");
  const response = await fetch(API, {
    method: "PUT",
    headers: {
      "Accept": "application/vnd.github+json",
      "Authorization": "Bearer " + process.env.GITHUB_TOKEN,
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      message,
      content: Buffer.from(JSON.stringify(poems, null, 2) + "\n", "utf8").toString("base64"),
      sha,
      branch: BRANCH
    })
  });
  if (!response.ok) {
    const details = await response.json().catch(() => ({}));
    throw new Error(details.message || "GitHub could not save the poem.");
  }
}

function cleanText(value, max) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  try {
    if (req.method === "GET") {
      const manage = req.query && req.query.manage === "1";
      if (manage && !hasSession(req)) return res.status(401).json({ error: "Please sign in again." });
      const store = await readStore();
      return res.status(200).json({ poems: store.poems.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) });
    }

    if (!["POST", "PUT", "DELETE"].includes(req.method)) return res.status(405).json({ error: "Method not allowed." });
    if (!sameOrigin(req)) return res.status(403).json({ error: "Request origin could not be verified." });
    if (!hasSession(req)) return res.status(401).json({ error: "Please sign in to publish." });

    const store = await readStore();
    let poems = store.poems;

    if (req.method === "POST") {
      const title = cleanText(req.body && req.body.title, 120);
      const content = cleanText(req.body && req.body.content, 20000);
      if (!title || !content) return res.status(400).json({ error: "Add both a title and the poem before publishing." });
      if (content.length < 2) return res.status(400).json({ error: "The poem is too short." });
      const poem = { id: crypto.randomUUID(), title, content, createdAt: new Date().toISOString() };
      poems.unshift(poem);
      await saveStore(poems, store.sha, "Publish poem: " + title);
      return res.status(201).json({ ok: true, poem });
    }

    const id = cleanText(req.body && req.body.id, 80);
    const index = poems.findIndex(poem => poem.id === id);
    if (index < 0) return res.status(404).json({ error: "That poem could not be found." });

    if (req.method === "PUT") {
      const title = cleanText(req.body && req.body.title, 120);
      const content = cleanText(req.body && req.body.content, 20000);
      if (!title || !content) return res.status(400).json({ error: "Add both a title and the poem before saving." });
      poems[index] = { ...poems[index], title, content, updatedAt: new Date().toISOString() };
      await saveStore(poems, store.sha, "Edit poem: " + title);
      return res.status(200).json({ ok: true, poem: poems[index] });
    }

    const removed = poems.splice(index, 1)[0];
    await saveStore(poems, store.sha, "Remove poem: " + removed.title);
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("JulietWrites poems API:", error);
    return res.status(500).json({ error: error.message || "Something went wrong while saving." });
  }
};
