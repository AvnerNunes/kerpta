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

  const productName =
    typeof req.query.q === "string"
      ? req.query.q.trim()
      : "";

  if (!productName) {
    return res.status(400).json({
      success: false,
      error: "Informe o nome do produto.",
    });
  }

  if (productName.length < 3) {
    return res.status(400).json({
      success: false,
      error:
        "O nome do produto deve possuir pelo menos 3 caracteres.",
    });
  }

  try {
    const {
      accessToken,
      connection,
    } =
      await getValidMercadoLivreAccessToken();

    const siteId = "MLB";

    const url = new URL(
      `https://api.mercadolibre.com/sites/${siteId}/domain_discovery/search`
    );

    url.searchParams.set(
      "q",
      productName
    );

    url.searchParams.set(
      "limit",
      "3"
    );

    const response = await fetch(
      url,
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
        "Erro no preditor de categorias do Mercado Livre:",
        {
          status:
            response.status,
          error:
            data.error,
          message:
            data.message,
        }
      );

      return res
        .status(response.status)
        .json({
          success: false,
          error:
            "Não foi possível identificar a categoria do produto.",
        });
    }

    if (
      !Array.isArray(data) ||
      data.length === 0
    ) {
      return res.status(200).json({
        success: true,
        productName,
        predictedCategory: null,
        alternatives: [],
      });
    }

    const categories =
      data.map((item) => ({
        domainId:
          item.domain_id,

        domainName:
          item.domain_name,

        categoryId:
          item.category_id,

        categoryName:
          item.category_name,
      }));

    return res.status(200).json({
      success: true,

      productName,

      marketplace: {
        id: "mercadolivre",
        siteId,
        accountName:
          connection.account_name,
      },

      predictedCategory:
        categories[0],

      alternatives:
        categories.slice(1),
    });
  } catch (error) {
    console.error(
      "Erro ao identificar categoria:",
      error
    );

    return res.status(500).json({
      success: false,
      error:
        error.message ||
        "Erro interno ao identificar a categoria.",
    });
  }
}