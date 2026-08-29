import {
  getValidMercadoLivreAccessToken,
} from "../_lib/mercadoLivreToken.js";

const SITE_ID = "MLB";

function normalizeText(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

async function mercadoLivreFetch(
  url,
  accessToken
) {
  const response = await fetch(url, {
    headers: {
      Authorization:
        `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Erro ao consultar categorias do Mercado Livre."
    );
  }

  return data;
}

async function getChildren(
  categoryId,
  accessToken
) {
  const data =
    await mercadoLivreFetch(
      `https://api.mercadolibre.com/categories/${encodeURIComponent(
        categoryId
      )}`,
      accessToken
    );

  return Array.isArray(
    data.children_categories
  )
    ? data.children_categories
    : [];
}

export default async function handler(
  req,
  res
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);

    return res.status(405).json({
      success: false,
      error: "Método não permitido.",
    });
  }

  const query =
    typeof req.query.q === "string"
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
      await getValidMercadoLivreAccessToken();

    const rootCategories =
      await mercadoLivreFetch(
        `https://api.mercadolibre.com/sites/${SITE_ID}/categories`,
        accessToken
      );

    const normalizedQuery =
      normalizeText(query);

    const results = [];

    for (
      const rootCategory
      of rootCategories
    ) {
      const children =
        await getChildren(
          rootCategory.id,
          accessToken
        );

      for (const child of children) {
        const normalizedName =
          normalizeText(child.name);

        if (
          normalizedName.includes(
            normalizedQuery
          )
        ) {
          results.push({
            id: child.id,
            name: child.name,

            path: [
              {
                id:
                  rootCategory.id,
                name:
                  rootCategory.name,
              },
              {
                id: child.id,
                name: child.name,
              },
            ],
          });
        }

        if (results.length >= 10) {
          break;
        }
      }

      if (results.length >= 10) {
        break;
      }
    }

    return res.status(200).json({
      success: true,
      query,
      categories:
        results.slice(0, 10),
    });
  } catch (error) {
    console.error(
      "Erro ao buscar categorias:",
      error
    );

    return res.status(500).json({
      success: false,
      error:
        "Não foi possível buscar categorias do Mercado Livre.",
    });
  }
}