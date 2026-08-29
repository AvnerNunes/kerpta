import {
  getValidMercadoLivreAccessToken,
} from "../_lib/mercadoLivreToken.js";

const APP_ID =
  process.env.MERCADOLIVRE_CLIENT_ID;

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);

    return res.status(405).json({
      success: false,
      error: "Método não permitido.",
    });
  }

  if (!APP_ID) {
    return res.status(500).json({
      success: false,
      error:
        "MERCADOLIVRE_CLIENT_ID não configurado.",
    });
  }

  try {
    const {
      accessToken,
    } =
      await getValidMercadoLivreAccessToken();

    const response = await fetch(
      `https://api.mercadolibre.com/applications/${APP_ID}`,
      {
        headers: {
          Authorization:
            `Bearer ${accessToken}`,
          Accept:
            "application/json",
        },
      }
    );

    const data =
      await response.json();

    if (!response.ok) {
      console.error(
        "Erro ao consultar aplicação Mercado Livre:",
        {
          status: response.status,
          error: data.error,
          message: data.message,
        }
      );

      return res
        .status(response.status)
        .json({
          success: false,
          error:
            data.message ||
            "Não foi possível consultar a aplicação.",
        });
    }

    return res.status(200).json({
      success: true,
      application: data,
    });
  } catch (error) {
    console.error(
      "Erro ao consultar aplicação:",
      error
    );

    return res.status(500).json({
      success: false,
      error:
        error.message ||
        "Erro interno ao consultar a aplicação.",
    });
  }
}