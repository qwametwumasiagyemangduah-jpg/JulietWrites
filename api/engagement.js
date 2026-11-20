const { neon } = require("@neondatabase/serverless");
const crypto = require("crypto");
const { hasSession, sameOrigin } = require("../lib/auth");

const sql = () => {
  if (!process.env.DATABASE_URL) throw new Error("The Neon database is not configured for this environment.");
  return neon(process.env.DATABASE_URL);
};
let schemaReady;
async function ensureSchema(db) {
  if (!schemaReady) schemaReady = (async () => {
    await db`CREATE TABLE IF NOT EXISTS poem_likes (
      id BIGSERIAL PRIMARY KEY,
      poem_id TEXT NOT NULL,
      visitor_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (poem_id, visitor_hash)
    )`;
    await db`CREATE INDEX IF NOT EXISTS poem_likes_poem_idx ON poem_likes(poem_id)`;
    await db`CREATE TABLE IF NOT EXISTS reader_responses (
      id BIGSERIAL PRIMARY KEY,
      poem_id TEXT NOT NULL,
      display_name VARCHAR(60) NOT NULL DEFAULT 'Anonymous',
      reflection VARCHAR(1200) NOT NULL,
      status VARCHAR(12) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
      visitor_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      moderated_at TIMESTAMPTZ
    )`;
    await db`CREATE INDEX IF NOT EXISTS reader_responses_poem_status_idx ON reader_responses(poem_id, status, created_at DESC)`;
    await db`CREATE INDEX IF NOT EXISTS reader_responses_status_idx ON reader_responses(status, created_at DESC)`;
  })().catch(error => { schemaReady = null; throw error; });
  return schemaReady;
}
function visitorHash(req) {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("Engagement security is not configured.");
  const ip = String(req.headers["x-forwarded-for"] || req.headers["x-real-ip"] || "").split(",")[0].trim();
  const agent = String(req.headers["user-agent"] || "").slice(0, 300);
  return crypto.createHmac("sha256", secret).update(ip + "|" + agent).digest("hex");
}
function clean(value, max) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}
module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  try {
    const db = sql();
    await ensureSchema(db);
    const manage = req.query && req.query.manage === "1";
    if (req.method === "GET") {
      if (manage) {
        if (!hasSession(req)) return res.status(401).json({error:"Please sign in again."});
        const [pending, approved, likes, rows] = await Promise.all([
          db`SELECT COUNT(*)::int AS count FROM reader_responses WHERE status='pending'`,
          db`SELECT COUNT(*)::int AS count FROM reader_responses WHERE status='approved'`,
          db`SELECT COUNT(*)::int AS count FROM poem_likes`,
          db`SELECT id, poem_id AS "poemId", display_name AS "displayName", reflection, status, created_at AS "createdAt" FROM reader_responses ORDER BY created_at DESC LIMIT 150`
        ]);
        return res.status(200).json({summary:{pending:pending[0].count,approved:approved[0].count,likes:likes[0].count},responses:rows});
      }
      const poemId = clean(req.query && req.query.poemId, 120);
      if (!poemId) return res.status(400).json({error:"A poem identifier is required."});
      const [likeRows, responses] = await Promise.all([
        db`SELECT COUNT(*)::int AS count FROM poem_likes WHERE poem_id=${poemId}`,
        db`SELECT id, display_name AS "displayName", reflection, created_at AS "createdAt" FROM reader_responses WHERE poem_id=${poemId} AND status='approved' ORDER BY created_at DESC LIMIT 50`
      ]);
      return res.status(200).json({likes:likeRows[0].count,responses});
    }
    if (req.method === "POST") {
      if (!sameOrigin(req)) return res.status(403).json({error:"Request origin could not be verified."});
      const poemId = clean(req.body && req.body.poemId, 120);
      if (!poemId) return res.status(400).json({error:"A poem identifier is required."});
      const visitor = visitorHash(req);
      if (req.body && req.body.action === "like") {
        const result = await db`INSERT INTO poem_likes (poem_id, visitor_hash) VALUES (${poemId}, ${visitor}) ON CONFLICT (poem_id, visitor_hash) DO NOTHING RETURNING id`;
        const count = await db`SELECT COUNT(*)::int AS count FROM poem_likes WHERE poem_id=${poemId}`;
        return res.status(200).json({liked:result.length>0,likes:count[0].count});
      }
      const reflection = clean(req.body && req.body.reflection, 1200);
      const displayName = clean(req.body && req.body.displayName, 60) || "Anonymous";
      if (reflection.length < 8) return res.status(400).json({error:"Please write a little more before submitting."});
      const recent = await db`SELECT COUNT(*)::int AS count FROM reader_responses WHERE visitor_hash=${visitor} AND created_at > NOW() - INTERVAL '1 hour'`;
      if (recent[0].count >= 3) return res.status(429).json({error:"Please wait before submitting another reflection."});
      await db`INSERT INTO reader_responses (poem_id, display_name, reflection, visitor_hash) VALUES (${poemId}, ${displayName}, ${reflection}, ${visitor})`;
      return res.status(201).json({ok:true,message:"Thank you. Your reflection has been sent for review before it appears publicly."});
    }
    if (req.method === "PATCH") {
      if (!sameOrigin(req)) return res.status(403).json({error:"Request origin could not be verified."});
      if (!hasSession(req)) return res.status(401).json({error:"Please sign in to moderate responses."});
      const id = Number(req.body && req.body.id);
      const status = clean(req.body && req.body.status, 12);
      if (!Number.isSafeInteger(id) || id < 1 || !["approved","rejected"].includes(status)) return res.status(400).json({error:"Invalid moderation request."});
      const updated = await db`UPDATE reader_responses SET status=${status}, moderated_at=NOW() WHERE id=${id} RETURNING id`;
      if (!updated.length) return res.status(404).json({error:"That response could not be found."});
      return res.status(200).json({ok:true});
    }
    if (req.method === "DELETE") {
      if (!sameOrigin(req)) return res.status(403).json({error:"Request origin could not be verified."});
      if (!hasSession(req)) return res.status(401).json({error:"Please sign in to delete responses."});
      const id = Number(req.body && req.body.id);
      if (!Number.isSafeInteger(id) || id < 1) return res.status(400).json({error:"Invalid response identifier."});
      await db`DELETE FROM reader_responses WHERE id=${id}`;
      return res.status(200).json({ok:true});
    }
    return res.status(405).json({error:"Method not allowed."});
  } catch (error) {
    console.error("JulietWrites engagement API:", error);
    return res.status(500).json({error:"Engagement features are temporarily unavailable. Please try again later."});
  }
};
