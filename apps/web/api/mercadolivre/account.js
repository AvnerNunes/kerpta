import {
  getValidMercadoLivreAccessToken,
} from "../_lib/mercadoLivreToken.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);

    return res.status(405).json({
      success: false,
      error: "Método não permitido.",
    });
  }

  try {
    const {
      accessToken,
      refreshed,
    } =
      await getValidMercadoLivreAccessToken();

    const response = await fetch(
      "https://api.mercadolibre.com/users/me",
      {
        headers: {
          Authorization:
            `Bearer ${accessToken}`,
        },
      }
    );

    const data =
      await response.json();

    if (!response.ok) {
      console.error(
        "Erro ao consultar conta do Mercado Livre:",
        {
          status: response.status,
          error: data.error,
          message: data.message,
        }
      );

      return res.status(
        response.status
      ).json({
        success: false,
        error:
          "Não foi possível consultar a conta do Mercado Livre.",
      });
    }

    return res.status(200).json({
      success: true,

      account: {
        id: data.id,
        nickname: data.nickname,
        siteId: data.site_id,
      },

      tokenRefreshed: refreshed,
    });
  } catch (error) {
    console.error(
      "Erro no teste da conexão Mercado Livre:",
      error
    );

    return res.status(500).json({
      success: false,
      error:
        error.message ||
        "Erro interno ao consultar o Mercado Livre.",
    });
  }
}