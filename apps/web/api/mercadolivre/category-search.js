import {
  getValidMercadoLivreAccessToken,
} from "../_lib/mercadoLivreToken.js";

const SITE_ID = "MLB";

const CACHE_TTL =
  1000 * 60 * 60;

const MAX_RESULTS = 10;

let categoryCache = {
  createdAt: 0,
  categories: [],
};

function normalizeText(
  value = ""
) {
  return String(value)
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .toLowerCase()
    .trim();
}

async function mercadoLivreFetch(
  url,
  accessToken
) {
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

  const data =
    await response.json();

  if (!response.ok) {
    console.error(
      "Erro Mercado Livre:",
      {
        status:
          response.status,
        data,
      }
    );

    throw new Error(
      data?.message ||
        "Erro ao consultar categorias do Mercado Livre."
    );
  }

  return data;
}

async function getCategoryDetails(
  categoryId,
  accessToken
) {
  return mercadoLivreFetch(
    `https://api.mercadolibre.com/categories/${encodeURIComponent(
      categoryId
    )}`,
    accessToken
  );
}

async function walkCategory(
  category,
  accessToken,
  parentPath,
  result
) {
  const details =
    await getCategoryDetails(
      category.id,
      accessToken
    );

  const currentPath =
    Array.isArray(
      details.path_from_root
    ) &&
    details.path_from_root
      .length > 0
      ? details.path_from_root
      : [
          ...parentPath,
          {
            id:
              details.id ||
              category.id,

            name:
              details.name ||
              category.name,
          },
        ];

  const children =
    Array.isArray(
      details.children_categories
    )
      ? details.children_categories
      : [];

  result.push({
    id:
      details.id ||
      category.id,

    name:
      details.name ||
      category.name,

    path:
      currentPath,

    isLeaf:
      children.length === 0,
  });

  for (
    const child
    of children
  ) {
    await walkCategory(
      child,
      accessToken,
      currentPath,
      result
    );
  }
}

async function loadCategories(
  accessToken
) {
  const now =
    Date.now();

  if (
    categoryCache
      .categories.length > 0 &&
    now -
      categoryCache.createdAt <
      CACHE_TTL
  ) {
    return (
      categoryCache.categories
    );
  }

  const roots =
    await mercadoLivreFetch(
      `https://api.mercadolibre.com/sites/${SITE_ID}/categories`,
      accessToken
    );

  if (
    !Array.isArray(roots)
  ) {
    throw new Error(
      "O Mercado Livre não retornou as categorias principais."
    );
  }

  const categories = [];

  for (
    const root
    of roots
  ) {
    await walkCategory(
      root,
      accessToken,
      [],
      categories
    );
  }

  categoryCache = {
    createdAt: now,
    categories,
  };

  return categories;
}

function calculateScore(
  category,
  query
) {
  const normalizedQuery =
    normalizeText(query);

  const name =
    normalizeText(
      category.name
    );

  const path =
    normalizeText(
      category.path
        .map(
          (item) =>
            item.name
        )
        .join(" ")
    );

  if (
    name ===
    normalizedQuery
  ) {
    return 1000;
  }

  if (
    name.startsWith(
      normalizedQuery
    )
  ) {
    return 700;
  }

  if (
    name.includes(
      normalizedQuery
    )
  ) {
    return 500;
  }

  if (
    path.includes(
      normalizedQuery
    )
  ) {
    return 200;
  }

  return 0;
}

function searchCategories(
  categories,
  query
) {
  return categories
    .map(
      (category) => ({
        category,

        score:
          calculateScore(
            category,
            query
          ),
      })
    )
    .filter(
      ({ score }) =>
        score > 0
    )
    .sort(
      (a, b) => {
        if (
          b.score !==
          a.score
        ) {
          return (
            b.score -
            a.score
          );
        }

        if (
          a.category.isLeaf !==
          b.category.isLeaf
        ) {
          return a.category
            .isLeaf
            ? -1
            : 1;
        }

        return (
          a.category
            .name.length -
          b.category
            .name.length
        );
      }
    )
    .slice(
      0,
      MAX_RESULTS
    )
    .map(
      ({ category }) =>
        category
    );
}

export default async function handler(
  req,
  res
) {
  if (
    req.method !== "GET"
  ) {
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

  if (
    query.length < 2
  ) {
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

    const categories =
      await loadCategories(
        accessToken
      );

    const results =
      searchCategories(
        categories,
        query
      );

    return res
      .status(200)
      .json({
        success: true,

        query,

        categories:
          results,
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