import crypto from "node:crypto";

const SESSION_COOKIE =
  "kerpta_session";

const SESSION_DURATION_SECONDS =
  60 * 60 * 24 * 30;

function getSessionSecret() {
  const secret =
    process.env.KERPTA_SESSION_SECRET;

  if (
    !secret ||
    secret.length < 32
  ) {
    throw new Error(
      "KERPTA_SESSION_SECRET não configurado corretamente."
    );
  }

  return secret;
}

function base64UrlEncode(
  value
) {
  return Buffer.from(value)
    .toString("base64url");
}

function base64UrlDecode(
  value
) {
  return Buffer.from(
    value,
    "base64url"
  ).toString("utf8");
}

function sign(value) {
  return crypto
    .createHmac(
      "sha256",
      getSessionSecret()
    )
    .update(value)
    .digest("base64url");
}

function safeCompare(
  first,
  second
) {
  const firstBuffer =
    Buffer.from(first);

  const secondBuffer =
    Buffer.from(second);

  if (
    firstBuffer.length !==
    secondBuffer.length
  ) {
    return false;
  }

  return crypto.timingSafeEqual(
    firstBuffer,
    secondBuffer
  );
}

function parseCookies(
  cookieHeader = ""
) {
  return cookieHeader
    .split(";")
    .map(
      (cookie) =>
        cookie.trim()
    )
    .filter(Boolean)
    .reduce(
      (
        cookies,
        cookie
      ) => {
        const separatorIndex =
          cookie.indexOf("=");

        if (
          separatorIndex === -1
        ) {
          return cookies;
        }

        const name =
          cookie.slice(
            0,
            separatorIndex
          );

        const value =
          cookie.slice(
            separatorIndex + 1
          );

        try {
          cookies[name] =
            decodeURIComponent(
              value
            );
        } catch {
          cookies[name] =
            value;
        }

        return cookies;
      },
      {}
    );
}

export function createSessionToken(
  userId
) {
  const now =
    Math.floor(
      Date.now() / 1000
    );

  const payload = {
    userId,
    iat: now,
    exp:
      now +
      SESSION_DURATION_SECONDS,
  };

  const encodedPayload =
    base64UrlEncode(
      JSON.stringify(payload)
    );

  const signature =
    sign(encodedPayload);

  return (
    `${encodedPayload}.` +
    signature
  );
}

export function verifySessionToken(
  token
) {
  if (
    !token ||
    typeof token !== "string"
  ) {
    return null;
  }

  const parts =
    token.split(".");

  if (
    parts.length !== 2
  ) {
    return null;
  }

  const [
    encodedPayload,
    receivedSignature,
  ] = parts;

  const expectedSignature =
    sign(encodedPayload);

  if (
    !safeCompare(
      receivedSignature,
      expectedSignature
    )
  ) {
    return null;
  }

  try {
    const payload =
      JSON.parse(
        base64UrlDecode(
          encodedPayload
        )
      );

    const now =
      Math.floor(
        Date.now() / 1000
      );

    if (
      !payload.userId ||
      !payload.exp ||
      payload.exp <= now
    ) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function getSessionFromRequest(
  req
) {
  const cookies =
    parseCookies(
      req.headers.cookie || ""
    );

  return verifySessionToken(
    cookies[
      SESSION_COOKIE
    ]
  );
}

export function createSessionCookie(
  userId
) {
  const token =
    createSessionToken(
      userId
    );

  return [
    `${SESSION_COOKIE}=${encodeURIComponent(
      token
    )}`,
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
    "Path=/",
    `Max-Age=${SESSION_DURATION_SECONDS}`,
  ].join("; ");
}

export function clearSessionCookie() {
  return [
    `${SESSION_COOKIE}=`,
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
    "Path=/",
    "Max-Age=0",
  ].join("; ");
}