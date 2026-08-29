import crypto from "node:crypto";

const CLIENT_ID = process.env.MERCADOLIVRE_CLIENT_ID;

const REDIRECT_URI =
  "https://kerpta-web.vercel.app/auth/mercadolivre/callback";

function base64UrlEncode(buffer) {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function createCodeVerifier() {
  return base64UrlEncode(crypto.randomBytes(64));
}

function createCodeChallenge(codeVerifier) {
  return base64UrlEncode(
    crypto
      .createHash("sha256")
      .update(codeVerifier)
      .digest()
  );
}

function serializeCookie(name, value, maxAge = 600) {
  return [
    `${name}=${encodeURIComponent(value)}`,
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
    "Path=/",
    `Max-Age=${maxAge}`,
  ].join("; ");
}

export default function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);

    return res.status(405).json({
      success: false,
      error: "Método não permitido.",
    });
  }

  if (!CLIENT_ID) {
    return res.status(500).json({
      success: false,
      error: "MERCADOLIVRE_CLIENT_ID não configurado.",
    });
  }

  const state = base64UrlEncode(crypto.randomBytes(32));
  const codeVerifier = createCodeVerifier();
  const codeChallenge =
    createCodeChallenge(codeVerifier);

  res.setHeader("Set-Cookie", [
    serializeCookie(
      "kerpta_ml_oauth_state",
      state
    ),
    serializeCookie(
      "kerpta_ml_code_verifier",
      codeVerifier
    ),
  ]);

  const authorizationUrl = new URL(
    "https://auth.mercadolivre.com.br/authorization"
  );

  authorizationUrl.searchParams.set(
    "response_type",
    "code"
  );

  authorizationUrl.searchParams.set(
    "client_id",
    CLIENT_ID
  );

  authorizationUrl.searchParams.set(
    "redirect_uri",
    REDIRECT_URI
  );

  authorizationUrl.searchParams.set(
    "state",
    state
  );

  authorizationUrl.searchParams.set(
    "code_challenge",
    codeChallenge
  );

  authorizationUrl.searchParams.set(
    "code_challenge_method",
    "S256"
  );

  return res.redirect(
    302,
    authorizationUrl.toString()
  );
}