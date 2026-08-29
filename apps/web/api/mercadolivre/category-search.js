import {
  getValidMercadoLivreAccessToken,
} from "../_lib/mercadoLivreToken.js";

const SITE_ID = "MLB";

function normalizeText(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .toLowerCase()
    .replace(
      /[^a-z0-9\s]/g,
      " "
    )
    .replace(
      /\s+/g,
      " "
    )
    .trim();
}

function getTokens(value = "") {
  return normalizeText(value)
    .split(" ")
    .filter(
      (token) =>
        token.length >= 2
    );
}

function calculateRelevance(
  category,
  query
) {
  const normalizedQuery =
    normalizeText(query);

  const queryTokens =
    getTokens(query);

  const categoryName =
    normalizeText(
      category.name
    );

  const domainName =
    normalizeText(
      category.domainName
    );

  const pathText =
    normalizeText(
      Array.isArray(
        category.path
      )
        ? category.path
            .map(
              (item) =>
                item.name
            )
            .join(" ")
        : ""
    );

  let score = 0;

  /*
   * Correspondência direta
   */

  if (
    categoryName ===
    normalizedQuery
  ) {
    score += 10000;
  }

  if (
    categoryName.startsWith(
      normalizedQuery
    )
  ) {
    score += 5000;
  }

  if (
    categoryName.includes(
      normalizedQuery
    )
  ) {
    score += 3000;
  }

  /*
   * Palavras da pesquisa
   */

  let nameMatches = 0;
  let pathMatches = 0;
  let domainMatches = 0;

  for (
    const token
    of queryTokens
  ) {
    if (
      categoryName.includes(
        token
      )
    ) {
      nameMatches += 1;
      score += 800;
    }

    if (
      pathText.includes(
        token
      )
    ) {
      pathMatches += 1;
      score += 250;
    }

    if (
      domainName.includes(
        token
      )
    ) {
      domainMatches += 1;
      score += 150;
    }
  }

  /*
   * Todos os termos aparecem
   * no nome da categoria.
   */

  if (
    queryTokens.length > 0 &&
    nameMatches ===
      queryTokens.length
  ) {
    score += 2000;
  }

  /*
   * Todos os termos aparecem
   * em algum ponto do caminho.
   */

  if (
    queryTokens.length > 0 &&
    pathMatches ===
      queryTokens.length
  ) {
    score += 750;
  }

  /*
   * Penaliza categorias que
   * praticamente não possuem
   * relação textual com a busca.
   */

  if (
    nameMatches === 0 &&
    pathMatches === 0 &&
    domainMatches === 0
  ) {
    score -= 5000;
  }

  /*
   * Pequena preferência por
   * categorias finais.
   */

  if (category.isLeaf) {
    score += 50;
  }

  return score;
}

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

    return res
      .status(405)
      .json({
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
    return res
      .status(400)
      .json({
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

    /*
     * Buscamos mais resultados
     * do Mercado Livre para que
     * a KERPTA possa reordená-los.
     */

    url.searchParams.set(
      "limit",
      "20"
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
      return res
        .status(200)
        .json({
          success: true,
          query,
          categories: [],
        });
    }

    const uniqueCategories =
      new Map();

    for (
      const item
      of data
    ) {
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

          isLeaf: true,
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
          async (
            category
          ) => {
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
                  ? details
                      .path_from_root
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
                  details
                    ?.children_categories
                )
                  ? details
                      .children_categories
                      .length === 0
                  : true,
            };
          }
        )
      );

    /*
     * KERPTA assume o controle
     * da relevância.
     */

    const rankedCategories =
      categoriesWithDetails
        .map(
          (category) => ({
            ...category,

            relevanceScore:
              calculateRelevance(
                category,
                query
              ),
          })
        )

        /*
         * Remove resultados sem
         * relação textual real.
         */

        .filter(
          (category) =>
            category
              .relevanceScore >
            0
        )

        .sort(
          (a, b) =>
            b.relevanceScore -
            a.relevanceScore
        )

        .slice(0, 10)

        /*
         * Score é interno.
         * Não enviamos ao frontend.
         */

        .map(
          ({
            relevanceScore,
            ...category
          }) => category
        );

    return res
      .status(200)
      .json({
        success: true,

        query,

        categories:
          rankedCategories,
      });
  } catch (error) {
    console.error(
      "Erro ao buscar categorias:",
      error
    );

    return res
      .status(500)
      .json({
        success: false,

        error:
          error.message ||
          "Não foi possível buscar categorias do Mercado Livre.",
      });
  }
}