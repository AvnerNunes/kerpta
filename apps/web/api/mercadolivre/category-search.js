import {
  getValidMercadoLivreAccessToken,
} from "../_lib/mercadoLivreToken.js";

const SITE_ID = "MLB";

const CATEGORY_CACHE_TTL =
  1000 * 60 * 60;

let categoryCache = {
  createdAt: 0,
  categories: [],
};

function normalizeText(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function tokenize(value) {
  return normalizeText(value)
    .split(/\s+/)
    .filter(Boolean);
}

async function mercadoLivreFetch(
  url,
  accessToken
) {
  const response =
    await fetch(url, {
      headers: {
        Authorization:
          `Bearer ${accessToken}`,

        Accept:
          "application/json",
      },
    });

  let data;

  try {
    data = await response.json();
  } catch {
    throw new Error(
      "O Mercado Livre retornou uma resposta inválida."
    );
  }

  if (!response.ok) {
    throw new Error(
      data?.message ||
        "Erro ao consultar categorias do Mercado Livre."
    );
  }

  return data;
}

function flattenCategoryTree(
  nodes,
  parentPath = [],
  result = []
) {
  if (!Array.isArray(nodes)) {
    return result;
  }

  for (const node of nodes) {
    if (
      !node ||
      !node.id ||
      !node.name
    ) {
      continue;
    }

    const currentPath = [
      ...parentPath,
      {
        id: node.id,
        name: node.name,
      },
    ];

    const children =
      Array.isArray(
        node.children_categories
      )
        ? node.children_categories
        : [];

    result.push({
      id: node.id,
      name: node.name,
      path: currentPath,

      isLeaf:
        children.length === 0,

      normalizedName:
        normalizeText(node.name),

      normalizedPath:
        normalizeText(
          currentPath
            .map(
              (item) =>
                item.name
            )
            .join(" ")
        ),
    });

    if (children.length > 0) {
      flattenCategoryTree(
        children,
        currentPath,
        result
      );
    }
  }

  return result;
}

async function loadAllCategories(
  accessToken
) {
  const now = Date.now();

  const cacheIsValid =
    categoryCache.categories.length >
      0 &&
    now -
      categoryCache.createdAt <
      CATEGORY_CACHE_TTL;

  if (cacheIsValid) {
    return categoryCache.categories;
  }

  const data =
    await mercadoLivreFetch(
      `https://api.mercadolibre.com/sites/${SITE_ID}/categories/all`,
      accessToken
    );

  const rootNodes =
    Array.isArray(data)
      ? data
      : [];

  const categories =
    flattenCategoryTree(
      rootNodes
    );

  categoryCache = {
    createdAt: now,
    categories,
  };

  return categories;
}

function calculateScore(
  category,
  normalizedQuery,
  queryTokens
) {
  const name =
    category.normalizedName;

  const path =
    category.normalizedPath;

  let score = 0;

  if (name === normalizedQuery) {
    score += 1000;
  }

  if (
    name.startsWith(
      normalizedQuery
    )
  ) {
    score += 500;
  }

  if (
    name.includes(
      normalizedQuery
    )
  ) {
    score += 300;
  }

  if (
    path.includes(
      normalizedQuery
    )
  ) {
    score += 100;
  }

  let matchedTokens = 0;

  for (
    const token
    of queryTokens
  ) {
    if (
      name.includes(token)
    ) {
      score += 40;
      matchedTokens += 1;

      continue;
    }

    if (
      path.includes(token)
    ) {
      score += 15;
      matchedTokens += 1;
    }
  }

  if (
    queryTokens.length > 1 &&
    matchedTokens ===
      queryTokens.length
  ) {
    score += 120;
  }

  if (category.isLeaf) {
    score += 20;
  }

  return score;
}

function searchCategories(
  categories,
  query
) {
  const normalizedQuery =
    normalizeText(query);

  const queryTokens =
    tokenize(query);

  return categories
    .map((category) => ({
      category,

      score:
        calculateScore(
          category,
          normalizedQuery,
          queryTokens
        ),
    }))

    .filter(
      (item) =>
        item.score > 0
    )

    .sort((a, b) => {
      if (
        b.score !== a.score
      ) {
        return (
          b.score - a.score
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
        a.category.name.length -
        b.category.name.length
      );
    })

    .slice(0, 10)

    .map(({ category }) => ({
      id: category.id,
      name: category.name,
      path: category.path,
      isLeaf:
        category.isLeaf,
    }));
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
      await getValidMercadoLivreAccessToken();

    const categories =
      await loadAllCategories(
        accessToken
      );

    const results =
      searchCategories(
        categories,
        query
      );

    return res.status(200).json({
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

    return res.status(500).json({
      success: false,

      error:
        "Não foi possível buscar categorias do Mercado Livre.",
    });
  }
}