import {
  getValidMercadoLivreAccessToken,
} from "../_lib/mercadoLivreToken.js";

const SITE_ID = "MLB";
const CURRENCY_ID = "BRL";

const ALLOWED_LISTING_TYPES = {
  gold_special: "Clássico",
  gold_pro: "Premium",
};

const ALLOWED_LOGISTICS = {
  drop_off: {
    name:
      "Mercado Envios - Agência/Drop Off",

    shippingMode: "me2",
  },

  cross_docking: {
    name:
      "Mercado Envios - Coleta",

    shippingMode: "me2",
  },

  self_service: {
    name:
      "Mercado Envios Flex",

    shippingMode: "me2",
  },

  fulfillment: {
    name:
      "Mercado Envios Full",

    shippingMode: "me2",
  },

  custom: {
    name:
      "Envio próprio/personalizado",

    shippingMode: "custom",
  },
};

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

  const categoryId =
    typeof req.query
      .categoryId === "string"
      ? req.query
          .categoryId
          .trim()
      : "";

  const listingTypeId =
    typeof req.query
      .listingTypeId === "string"
      ? req.query
          .listingTypeId
          .trim()
      : "";

  const logisticType =
    typeof req.query
      .logisticType === "string"
      ? req.query
          .logisticType
          .trim()
      : "";

  const price =
    Number(
      req.query.price
    );

  if (!categoryId) {
    return res
      .status(400)
      .json({
        success: false,

        error:
          "Informe a categoria.",
      });
  }

  if (
    !Number.isFinite(
      price
    ) ||
    price <= 0
  ) {
    return res
      .status(400)
      .json({
        success: false,

        error:
          "Informe um preço válido maior que zero.",
      });
  }

  if (
    !ALLOWED_LISTING_TYPES[
      listingTypeId
    ]
  ) {
    return res
      .status(400)
      .json({
        success: false,

        error:
          "Tipo de anúncio inválido. Escolha Clássico ou Premium.",
      });
  }

  const logistics =
    ALLOWED_LOGISTICS[
      logisticType
    ];

  if (!logistics) {
    return res
      .status(400)
      .json({
        success: false,

        error:
          "Selecione uma logística válida.",
      });
  }

  try {
    /*
     * IMPORTANTE:
     *
     * A requisição precisa ser
     * enviada ao gerenciador de
     * token.
     *
     * Assim ele identifica o
     * usuário KERPTA pela sessão
     * e usa exclusivamente a
     * conexão Mercado Livre
     * daquele usuário.
     */

    const {
      accessToken,
    } =
      await getValidMercadoLivreAccessToken(
        req
      );

    const url =
      new URL(
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

    url.searchParams.set(
      "listing_type_id",
      listingTypeId
    );

    url.searchParams.set(
      "logistic_type",
      logisticType
    );

    url.searchParams.set(
      "shipping_modes",
      logistics.shippingMode
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
      return res
        .status(502)
        .json({
          success: false,

          error:
            "O Mercado Livre retornou uma resposta inválida.",
        });
    }

    if (!response.ok) {
      console.error(
        "Erro ao consultar custos do Mercado Livre:",
        {
          status:
            response.status,

          error:
            data?.error,

          message:
            data?.message,

          cause:
            data?.cause,
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
            "Não foi possível consultar os custos do Mercado Livre.",
        });
    }

    const items =
      Array.isArray(data)
        ? data.flat(
            Infinity
          )
        : [data];

    const selected =
      items.find(
        (item) =>
          item
            ?.listing_type_id ===
          listingTypeId
      );

    if (!selected) {
      return res
        .status(404)
        .json({
          success: false,

          error:
            "O Mercado Livre não retornou custos para essa combinação.",
        });
    }

    return res
      .status(200)
      .json({
        success: true,

        input: {
          siteId:
            SITE_ID,

          categoryId,

          price,

          currencyId:
            CURRENCY_ID,

          listingTypeId,

          listingTypeName:
            ALLOWED_LISTING_TYPES[
              listingTypeId
            ],

          logisticType,

          logisticName:
            logistics.name,

          shippingMode:
            logistics
              .shippingMode,
        },

        fee: {
          amount:
            selected
              .sale_fee_amount ??
            0,

          percentage:
            selected
              .sale_fee_details
              ?.percentage_fee ??
            0,

          fixedFee:
            selected
              .sale_fee_details
              ?.fixed_fee ??
            0,

          financingAddOnFee:
            selected
              .sale_fee_details
              ?.financing_add_on_fee ??
            0,

          meliPercentageFee:
            selected
              .sale_fee_details
              ?.meli_percentage_fee ??
            0,
        },

        logisticsApplied:
          true,
      });
  } catch (error) {
    console.error(
      "Erro interno ao consultar listing prices:",
      error
    );

    /*
     * Sessão/conexão inválida.
     */

    if (
      error.message
        ?.toLowerCase()
        .includes(
          "sessão"
        ) ||
      error.message
        ?.toLowerCase()
        .includes(
          "conectada"
        ) ||
      error.message
        ?.toLowerCase()
        .includes(
          "renovada"
        )
    ) {
      return res
        .status(401)
        .json({
          success: false,

          error:
            error.message,
        });
    }

    return res
      .status(500)
      .json({
        success: false,

        error:
          error.message ||
          "Erro interno ao consultar os custos do Mercado Livre.",
      });
  }
}