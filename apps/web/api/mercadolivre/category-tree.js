import {
  getValidMercadoLivreAccessToken,
} from "../_lib/mercadoLivreToken.js";

const SITE_ID = "MLB";

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
    } =
      await getValidMercadoLivreAccessToken();

    const categoryId =
      typeof req.query.categoryId === "string"
        ? req.query.categoryId.trim()
        : "";

    const url = categoryId
      ? `https://api.mercadolibre.com/categories/${encodeURIComponent(
          categoryId
        )}`
      : `https://api.mercadolibre.com/sites/${SITE_ID}/categories`;

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
        "Erro ao consultar categorias do Mercado Livre:",
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
            "Não foi possível consultar as categorias do Mercado Livre.",
        });
    }

    if (!categoryId) {
      return res.status(200).json({
        success: true,
        siteId: SITE_ID,

        categories: data.map(
          (category) => ({
            id: category.id,
            name: category.name,
          })
        ),
      });
    }

    const children =
      Array.isArray(
        data.children_categories
      )
        ? data.children_categories.map(
            (category) => ({
              id: category.id,
              name: category.name,
            })
          )
        : [];

    return res.status(200).json({
      success: true,

      category: {
        id: data.id,
        name: data.name,

        path:
          Array.isArray(
            data.path_from_root
          )
            ? data.path_from_root.map(
                (category) => ({
                  id: category.id,
                  name: category.name,
                })
              )
            : [],
      },

      children,

      isLeaf:
        children.length === 0,
    });
  } catch (error) {
    console.error(
      "Erro na árvore de categorias:",
      error
    );

    return res.status(500).json({
      success: false,
      error:
        error.message ||
        "Erro interno ao consultar categorias.",
    });
  }
}