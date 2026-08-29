import { supabase } from "./supabase.js";

import {
  decryptToken,
  encryptToken,
} from "./tokenCrypto.js";

const CLIENT_ID =
  process.env.MERCADOLIVRE_CLIENT_ID;

const CLIENT_SECRET =
  process.env.MERCADOLIVRE_CLIENT_SECRET;

const TOKEN_URL =
  "https://api.mercadolibre.com/oauth/token";

const EXPIRATION_MARGIN_MS =
  5 * 60 * 1000;

function tokenIsStillValid(tokenExpiresAt) {
  if (!tokenExpiresAt) {
    return false;
  }

  const expirationTime =
    new Date(tokenExpiresAt).getTime();

  if (!Number.isFinite(expirationTime)) {
    return false;
  }

  return (
    expirationTime - Date.now() >
    EXPIRATION_MARGIN_MS
  );
}

async function getConnection() {
  const {
    data,
    error,
  } = await supabase
    .from("marketplace_connections")
    .select(
      `
        id,
        marketplace,
        marketplace_user_id,
        account_name,
        access_token_encrypted,
        refresh_token_encrypted,
        token_expires_at,
        status
      `
    )
    .eq(
      "marketplace",
      "mercadolivre"
    )
    .eq(
      "status",
      "active"
    )
    .order(
      "updated_at",
      {
        ascending: false,
      }
    )
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error(
      "Erro ao consultar conexão do Mercado Livre:",
      error
    );

    throw new Error(
      "Não foi possível consultar a conexão do Mercado Livre."
    );
  }

  if (!data) {
    throw new Error(
      "Nenhuma conta do Mercado Livre está conectada."
    );
  }

  return data;
}

async function refreshAccessToken(
  connection
) {
  if (
    !CLIENT_ID ||
    !CLIENT_SECRET
  ) {
    throw new Error(
      "Credenciais do Mercado Livre não configuradas."
    );
  }

  if (
    !connection.refresh_token_encrypted
  ) {
    throw new Error(
      "A conexão do Mercado Livre não possui refresh token."
    );
  }

  const refreshToken =
    decryptToken(
      connection.refresh_token_encrypted
    );

  const body =
    new URLSearchParams({
      grant_type:
        "refresh_token",

      client_id:
        CLIENT_ID,

      client_secret:
        CLIENT_SECRET,

      refresh_token:
        refreshToken,
    });

  const response =
    await fetch(
      TOKEN_URL,
      {
        method: "POST",

        headers: {
          Accept:
            "application/json",

          "Content-Type":
            "application/x-www-form-urlencoded",
        },

        body,
      }
    );

  const data =
    await response.json();

  if (
    !response.ok ||
    !data.access_token
  ) {
    console.error(
      "Erro ao renovar token do Mercado Livre:",
      {
        status:
          response.status,

        error:
          data.error,

        message:
          data.message,
      }
    );

    throw new Error(
      "Não foi possível renovar a conexão com o Mercado Livre."
    );
  }

  const newRefreshToken =
    data.refresh_token ||
    refreshToken;

  const tokenExpiresAt =
    data.expires_in
      ? new Date(
          Date.now() +
            data.expires_in * 1000
        ).toISOString()
      : null;

  const {
    error: updateError,
  } = await supabase
    .from(
      "marketplace_connections"
    )
    .update({
      access_token_encrypted:
        encryptToken(
          data.access_token
        ),

      refresh_token_encrypted:
        encryptToken(
          newRefreshToken
        ),

      token_expires_at:
        tokenExpiresAt,

      status:
        "active",

      last_sync_at:
        new Date().toISOString(),

      updated_at:
        new Date().toISOString(),
    })
    .eq(
      "id",
      connection.id
    );

  if (updateError) {
    console.error(
      "Erro ao salvar token renovado do Mercado Livre:",
      updateError
    );

    throw new Error(
      "O token foi renovado, mas não foi possível salvar a nova conexão."
    );
  }

  return {
    accessToken:
      data.access_token,

    connection: {
      ...connection,

      token_expires_at:
        tokenExpiresAt,

      status:
        "active",
    },

    refreshed:
      true,
  };
}

export async function getValidMercadoLivreAccessToken() {
  const connection =
    await getConnection();

  if (
    tokenIsStillValid(
      connection.token_expires_at
    )
  ) {
    return {
      accessToken:
        decryptToken(
          connection.access_token_encrypted
        ),

      connection,

      refreshed:
        false,
    };
  }

  return refreshAccessToken(
    connection
  );
}