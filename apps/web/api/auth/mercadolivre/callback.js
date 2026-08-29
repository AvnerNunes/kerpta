import { supabase } from "../../_lib/supabase.js";
import { encryptToken } from "../../_lib/tokenCrypto.js";

const CLIENT_ID =
  process.env.MERCADOLIVRE_CLIENT_ID;

const CLIENT_SECRET =
  process.env.MERCADOLIVRE_CLIENT_SECRET;

const REDIRECT_URI =
  "https://kerpta-web.vercel.app/auth/mercadolivre/callback";

function parseCookies(cookieHeader = "") {
  return cookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .filter(Boolean)
    .reduce((cookies, cookie) => {
      const separatorIndex = cookie.indexOf("=");

      if (separatorIndex === -1) {
        return cookies;
      }

      const name = cookie.slice(
        0,
        separatorIndex
      );

      const value = cookie.slice(
        separatorIndex + 1
      );

      cookies[name] =
        decodeURIComponent(value);

      return cookies;
    }, {});
}

function clearCookie(name) {
  return [
    `${name}=`,
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
    "Path=/",
    "Max-Age=0",
  ].join("; ");
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);

    return res.status(405).json({
      success: false,
      error: "Método não permitido.",
    });
  }

  if (!CLIENT_ID || !CLIENT_SECRET) {
    return res.status(500).json({
      success: false,
      error:
        "Credenciais do Mercado Livre não configuradas.",
    });
  }

  const { code, state } = req.query;

  if (!code || !state) {
    return res.status(400).json({
      success: false,
      error:
        "Código ou state de autorização ausente.",
    });
  }

  const cookies = parseCookies(
    req.headers.cookie
  );

  const storedState =
    cookies.kerpta_ml_oauth_state;

  const codeVerifier =
    cookies.kerpta_ml_code_verifier;

  if (
    !storedState ||
    !codeVerifier ||
    storedState !== state
  ) {
    return res.status(400).json({
      success: false,
      error:
        "A validação de segurança do OAuth falhou.",
    });
  }

  try {
    const tokenBody =
      new URLSearchParams({
        grant_type:
          "authorization_code",
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
        redirect_uri: REDIRECT_URI,
        code_verifier: codeVerifier,
      });

    const tokenResponse = await fetch(
      "https://api.mercadolibre.com/oauth/token",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type":
            "application/x-www-form-urlencoded",
        },
        body: tokenBody,
      }
    );

    const tokenData =
      await tokenResponse.json();

    if (
      !tokenResponse.ok ||
      !tokenData.access_token
    ) {
      return res.status(
        tokenResponse.status || 400
      ).json({
        success: false,
        error:
          tokenData.message ||
          tokenData.error ||
          "Não foi possível obter o token do Mercado Livre.",
      });
    }

    const userResponse = await fetch(
      "https://api.mercadolibre.com/users/me",
      {
        headers: {
          Authorization:
            `Bearer ${tokenData.access_token}`,
        },
      }
    );

    const userData =
      await userResponse.json();

    if (!userResponse.ok) {
      return res
        .status(userResponse.status)
        .json({
          success: false,
          error:
            userData.message ||
            "Não foi possível consultar a conta do Mercado Livre.",
        });
    }

    const accessTokenEncrypted =
      encryptToken(
        tokenData.access_token
      );

    const refreshTokenEncrypted =
      encryptToken(
        tokenData.refresh_token
      );

    const tokenExpiresAt =
      tokenData.expires_in
        ? new Date(
            Date.now() +
              tokenData.expires_in * 1000
          ).toISOString()
        : null;

    const {
      error: databaseError,
    } = await supabase
      .from(
        "marketplace_connections"
      )
      .upsert(
        {
          marketplace:
            "mercadolivre",

          marketplace_user_id:
            String(userData.id),

          account_name:
            userData.nickname || null,

          access_token_encrypted:
            accessTokenEncrypted,

          refresh_token_encrypted:
            refreshTokenEncrypted,

          token_expires_at:
            tokenExpiresAt,

          status: "active",

          last_sync_at:
            new Date().toISOString(),

          updated_at:
            new Date().toISOString(),
        },
        {
          onConflict:
            "marketplace,marketplace_user_id",
        }
      );

    if (databaseError) {
      console.error(
        "Erro Supabase:",
        databaseError
      );

      return res.status(500).json({
        success: false,
        error:
          "A autorização foi concluída, mas não foi possível salvar a conexão.",
      });
    }

    res.setHeader("Set-Cookie", [
      clearCookie(
        "kerpta_ml_oauth_state"
      ),
      clearCookie(
        "kerpta_ml_code_verifier"
      ),
    ]);

    return res.status(200).json({
      success: true,

      account: {
        id: userData.id,
        nickname:
          userData.nickname,
        siteId:
          userData.site_id,
      },
    });
  } catch (error) {
    console.error(
      "Erro OAuth Mercado Livre:",
      error
    );

    return res.status(500).json({
      success: false,
      error:
        "Erro interno durante a conexão com o Mercado Livre.",
    });
  }
}