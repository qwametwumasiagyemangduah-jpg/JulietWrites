const crypto = require("crypto");

const COOKIE = "jw_writer_session";
const SESSION_SECONDS = 60 * 60 * 12;

function safeEqual(a, b) {
  const left = Buffer.from(String(a || ""));
  const right = Buffer.from(String(b || ""));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function sign(value) {
  return crypto.createHmac("sha256", process.env.SESSION_SECRET).update(value).digest("base64url");
}

function createSession() {
  const payload = Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + SESSION_SECONDS })).toString("base64url");
  return payload + "." + sign(payload);
}

function hasSession(req) {
  if (!process.env.SESSION_SECRET) return false;
  const raw = (req.headers.cookie || "").split(";").map(v => v.trim()).find(v => v.startsWith(COOKIE + "="));
  if (!raw) return false;
  const token = raw.slice(COOKIE.length + 1);
  const parts = token.split(".");
  if (parts.length !== 2 || !safeEqual(sign(parts[0]), parts[1])) return false;
  try {
    const payload = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8"));
    return Number(payload.exp) > Math.floor(Date.now() / 1000);
  } catch (_) {
    return false;
  }
}

function setSession(res) {
  res.setHeader("Set-Cookie", COOKIE + "=" + createSession() + "; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=" + SESSION_SECONDS);
}

function clearSession(res) {
  res.setHeader("Set-Cookie", COOKIE + "=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0");
}

function sameOrigin(req) {
  const origin = req.headers.origin;
  const host = req.headers.host;
  if (!origin || !host) return false;
  try { return new URL(origin).host === host; } catch (_) { return false; }
}

module.exports = { safeEqual, hasSession, setSession, clearSession, sameOrigin };
