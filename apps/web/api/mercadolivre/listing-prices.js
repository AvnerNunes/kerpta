import {
  getValidMercadoLivreAccessToken,
} from "../_lib/mercadoLivreToken.js";

const SITE_ID = "MLB";
const CURRENCY_ID = "BRL";

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

  const categoryId =
    typeof req.query.categoryId === "string"
      ? req.query.categoryId.trim()
      : "";

  const price =
    Number(req.query.price);

  if (!categoryId) {
    return res.status(400).json({
      success: false,
      error: "Informe a categoria.",
    });
  }

  if (
    !Number.isFinite(price) ||
    price <= 0
  ) {
    return res.status(400).json({
      success: false,
      error:
        "Informe um preço válido maior que zero.",
    });
  }

  try {
    const {
      accessToken,
    } =
      await getValidMercadoLivreAccessToken();

    const url = new URL(
      `https://api.mercadolibre.com/sites/${SITE_ID}/listing_prices`
    );

    url.searchParams.set(
      "price",
      String(price)
    );

    url.searchParams.set(
      "category_id",
      categoryId
    );

    url.searchParams.set(
      "currency_id",
      CURRENCY_ID
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
        "Erro ao consultar custos do Mercado Livre:",
        {
          status: response.status,
          error: data.error,
          message: data.message,
          cause: data.cause,
        }
      );

      return res
        .status(response.status)
        .json({
          success: false,
          error:
            data.message ||
            "Não foi possível consultar os custos do Mercado Livre.",
        });
    }

    const items =
      Array.isArray(data)
        ? data
        : [data];

    const listingPrices =
      items.map((item) => ({
        listingTypeId:
          item.listing_type_id,

        listingTypeName:
          item.listing_type_name,

        currencyId:
          item.currency_id,

        listingFeeAmount:
          item.listing_fee_amount,

        saleFeeAmount:
          item.sale_fee_amount,

        saleFeeDetails: {
          fixedFee:
            item.sale_fee_details
              ?.fixed_fee ?? 0,

          financingAddOnFee:
            item.sale_fee_details
              ?.financing_add_on_fee ?? 0,

          meliPercentageFee:
            item.sale_fee_details
              ?.meli_percentage_fee ?? 0,

          percentageFee:
            item.sale_fee_details
              ?.percentage_fee ?? 0,
        },
      }));

    return res.status(200).json({
      success: true,

      input: {
        siteId: SITE_ID,
        categoryId,
        price,
        currencyId:
          CURRENCY_ID,
      },

      logisticsApplied:
        false,

      warning:
        "Consulta inicial sem parâmetros logísticos. Não usar este resultado como custo final da análise.",

      listingPrices,
    });
  } catch (error) {
    console.error(
      "Erro interno ao consultar listing prices:",
      error
    );

    return res.status(500).json({
      success: false,
      error:
        error.message ||
        "Erro interno ao consultar os custos do Mercado Livre.",
    });
  }
}