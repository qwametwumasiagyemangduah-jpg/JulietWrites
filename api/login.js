const { safeEqual, setSession, sameOrigin } = require("./_auth");

module.exports = function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed." });
  if (!sameOrigin(req)) return res.status(403).json({ error: "Request origin could not be verified." });
  if (!process.env.ADMIN_PASSWORD || !process.env.SESSION_SECRET) {
    return res.status(503).json({ error: "The writer login has not been configured yet." });
  }
  const password = req.body && req.body.password;
  if (typeof password !== "string" || !safeEqual(password, process.env.ADMIN_PASSWORD)) {
    return res.status(401).json({ error: "That password is not correct." });
  }
  setSession(res);
  return res.status(200).json({ ok: true });
};
