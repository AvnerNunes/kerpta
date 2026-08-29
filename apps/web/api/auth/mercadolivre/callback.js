import {
  supabase,
} from "../../_lib/supabase.js";

import {
  encryptToken,
} from "../../_lib/tokenCrypto.js";

import {
  createSessionCookie,
} from "../../_lib/session.js";

const CLIENT_ID =
  process.env
    .MERCADOLIVRE_CLIENT_ID;

const CLIENT_SECRET =
  process.env
    .MERCADOLIVRE_CLIENT_SECRET;

const REDIRECT_URI =
  "https://kerpta-web.vercel.app/auth/mercadolivre/callback";

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

async function findConnection(
  marketplaceUserId
) {
  const {
    data,
    error,
  } = await supabase
    .from(
      "marketplace_connections"
    )
    .select(
      `
        id,
        kerpta_user_id
      `
    )
    .eq(
      "marketplace",
      "mercadolivre"
    )
    .eq(
      "marketplace_user_id",
      marketplaceUserId
    )
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

async function createKerptaUser() {
  const {
    data,
    error,
  } = await supabase
    .from("kerpta_users")
    .insert({
      status: "active",
      plan: "free",
    })
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

async function ensureKerptaUser(
  existingConnection
) {
  if (
    existingConnection
      ?.kerpta_user_id
  ) {
    return (
      existingConnection
        .kerpta_user_id
    );
  }

  const newUser =
    await createKerptaUser();

  return newUser.id;
}

export default async function handler(
  req,
  res
) {
  if (req.method !== "GET") {
    res.setHeader(
      "Allow",
      ["GET"]
    );

    return res.status(405).json({
      success: false,
      error:
        "Método não permitido.",
    });
  }

  if (
    !CLIENT_ID ||
    !CLIENT_SECRET
  ) {
    return res.status(500).json({
      success: false,
      error:
        "Credenciais do Mercado Livre não configuradas.",
    });
  }

  const {
    code,
    state,
  } = req.query;

  if (!code || !state) {
    return res.status(400).json({
      success: false,
      error:
        "Código ou state de autorização ausente.",
    });
  }

  const cookies =
    parseCookies(
      req.headers.cookie
    );

  const storedState =
    cookies
      .kerpta_ml_oauth_state;

  const codeVerifier =
    cookies
      .kerpta_ml_code_verifier;

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

        client_id:
          CLIENT_ID,

        client_secret:
          CLIENT_SECRET,

        code,

        redirect_uri:
          REDIRECT_URI,

        code_verifier:
          codeVerifier,
      });

    const tokenResponse =
      await fetch(
        "https://api.mercadolibre.com/oauth/token",
        {
          method: "POST",

          headers: {
            Accept:
              "application/json",

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
      return res
        .status(
          tokenResponse.status ||
            400
        )
        .json({
          success: false,

          error:
            tokenData.message ||
            tokenData.error ||
            "Não foi possível obter o token do Mercado Livre.",
        });
    }

    const userResponse =
      await fetch(
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
        .status(
          userResponse.status
        )
        .json({
          success: false,

          error:
            userData.message ||
            "Não foi possível consultar a conta do Mercado Livre.",
        });
    }

    const marketplaceUserId =
      String(userData.id);

    const existingConnection =
      await findConnection(
        marketplaceUserId
      );

    const kerptaUserId =
      await ensureKerptaUser(
        existingConnection
      );

    const accessTokenEncrypted =
      encryptToken(
        tokenData.access_token
      );

    const refreshTokenEncrypted =
      tokenData.refresh_token
        ? encryptToken(
            tokenData.refresh_token
          )
        : null;

    const tokenExpiresAt =
      tokenData.expires_in
        ? new Date(
            Date.now() +
              tokenData.expires_in *
                1000
          ).toISOString()
        : null;

    const connectionData = {
      marketplace:
        "mercadolivre",

      marketplace_user_id:
        marketplaceUserId,

      kerpta_user_id:
        kerptaUserId,

      account_name:
        userData.nickname ||
        null,

      access_token_encrypted:
        accessTokenEncrypted,

      token_expires_at:
        tokenExpiresAt,

      status:
        "active",

      last_sync_at:
        new Date()
          .toISOString(),

      updated_at:
        new Date()
          .toISOString(),
    };

    if (
      refreshTokenEncrypted
    ) {
      connectionData
        .refresh_token_encrypted =
        refreshTokenEncrypted;
    }

    const {
      error:
        databaseError,
    } = await supabase
      .from(
        "marketplace_connections"
      )
      .upsert(
        connectionData,
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

      return res
        .status(500)
        .json({
          success: false,

          error:
            "A autorização foi concluída, mas não foi possível salvar a conexão.",
        });
    }

    res.setHeader(
      "Set-Cookie",
      [
        clearCookie(
          "kerpta_ml_oauth_state"
        ),

        clearCookie(
          "kerpta_ml_code_verifier"
        ),

        createSessionCookie(
          kerptaUserId
        ),
      ]
    );

    return res
      .status(200)
      .json({
        success: true,

        user: {
          id:
            kerptaUserId,

          plan:
            "free",
        },

        account: {
          id:
            userData.id,

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

    return res
      .status(500)
      .json({
        success: false,

        error:
          "Erro interno durante a conexão com o Mercado Livre.",
      });
  }
}