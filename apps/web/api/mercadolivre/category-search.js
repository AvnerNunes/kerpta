import {
  getValidMercadoLivreAccessToken,
} from "../_lib/mercadoLivreToken.js";

const SITE_ID = "MLB";

async function getCategoryDetails(
  categoryId,
  accessToken
) {
  const response =
    await fetch(
      `https://api.mercadolibre.com/categories/${encodeURIComponent(
        categoryId
      )}`,
      {
        headers: {
          Authorization:
            `Bearer ${accessToken}`,

          Accept:
            "application/json",
        },
      }
    );

  if (!response.ok) {
    return null;
  }

  try {
    return await response.json();
  } catch {
    return null;
  }
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

  const query =
    typeof req.query.q ===
    "string"
      ? req.query.q.trim()
      : "";

  if (query.length < 2) {
    return res.status(400).json({
      success: false,

      error:
        "Digite pelo menos 2 caracteres para buscar uma categoria.",
    });
  }

  try {
    const {
      accessToken,
    } =
      await getValidMercadoLivreAccessToken(
        req
      );

    const url =
      new URL(
        `https://api.mercadolibre.com/sites/${SITE_ID}/domain_discovery/search`
      );

    url.searchParams.set(
      "q",
      query
    );

    url.searchParams.set(
      "limit",
      "8"
    );

    const response =
      await fetch(
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

    let data;

    try {
      data =
        await response.json();
    } catch {
      throw new Error(
        "O Mercado Livre retornou uma resposta inválida."
      );
    }

    if (!response.ok) {
      console.error(
        "Erro no preditor de categorias:",
        {
          status:
            response.status,

          data,
        }
      );

      return res
        .status(
          response.status
        )
        .json({
          success: false,

          error:
            data?.message ||
            "Não foi possível consultar as categorias do Mercado Livre.",
        });
    }

    if (!Array.isArray(data)) {
      return res.status(200).json({
        success: true,
        query,
        categories: [],
      });
    }

    const uniqueCategories =
      new Map();

    for (const item of data) {
      if (
        !item?.category_id ||
        !item?.category_name
      ) {
        continue;
      }

      if (
        uniqueCategories.has(
          item.category_id
        )
      ) {
        continue;
      }

      uniqueCategories.set(
        item.category_id,
        {
          id:
            item.category_id,

          name:
            item.category_name,

          domainId:
            item.domain_id ||
            null,

          domainName:
            item.domain_name ||
            null,

          path: [],
        }
      );
    }

    const categories =
      Array.from(
        uniqueCategories.values()
      );

    const categoriesWithDetails =
      await Promise.all(
        categories.map(
          async (category) => {
            const details =
              await getCategoryDetails(
                category.id,
                accessToken
              );

            return {
              ...category,

              name:
                details?.name ||
                category.name,

              path:
                Array.isArray(
                  details?.path_from_root
                )
                  ? details.path_from_root
                  : [
                      {
                        id:
                          category.id,

                        name:
                          category.name,
                      },
                    ],

              isLeaf:
                Array.isArray(
                  details?.children_categories
                )
                  ? details
                      .children_categories
                      .length === 0
                  : true,
            };
          }
        )
      );

    return res.status(200).json({
      success: true,

      query,

      categories:
        categoriesWithDetails,
    });
  } catch (error) {
    console.error(
      "Erro ao buscar categorias:",
      error
    );

    return res.status(500).json({
      success: false,

      error:
        error.message ||
        "Não foi possível buscar categorias do Mercado Livre.",
    });
  }
}