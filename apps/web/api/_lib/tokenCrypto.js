import crypto from "node:crypto";

const ENCRYPTION_KEY_BASE64 =
  process.env.KERPTA_TOKEN_ENCRYPTION_KEY;

if (!ENCRYPTION_KEY_BASE64) {
  throw new Error(
    "KERPTA_TOKEN_ENCRYPTION_KEY não configurada."
  );
}

const ENCRYPTION_KEY = Buffer.from(
  ENCRYPTION_KEY_BASE64,
  "base64"
);

if (ENCRYPTION_KEY.length !== 32) {
  throw new Error(
    "KERPTA_TOKEN_ENCRYPTION_KEY deve possuir 32 bytes."
  );
}

export function encryptToken(value) {
  if (!value) {
    return null;
  }

  const iv = crypto.randomBytes(12);

  const cipher = crypto.createCipheriv(
    "aes-256-gcm",
    ENCRYPTION_KEY,
    iv
  );

  const encrypted = Buffer.concat([
    cipher.update(value, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return [
    iv.toString("base64"),
    authTag.toString("base64"),
    encrypted.toString("base64"),
  ].join(".");
}