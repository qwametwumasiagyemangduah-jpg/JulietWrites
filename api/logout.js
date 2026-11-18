const { clearSession, sameOrigin } = require("./_auth");

module.exports = function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed." });
  if (!sameOrigin(req)) return res.status(403).json({ error: "Request origin could not be verified." });
  clearSession(res);
  return res.status(200).json({ ok: true });
};
