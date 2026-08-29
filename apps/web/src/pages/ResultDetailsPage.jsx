import {
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  useState,
} from "react";

const API_URL =
  import.meta.env.DEV
    ? "http://localhost:3001"
    : "/api";

const MARKETPLACE_API_URL =
  "/api";

const LISTING_TYPES = [
  {
    id: "gold_special",
    name: "Clássico",
  },
  {
    id: "gold_pro",
    name: "Premium",
  },
];

const LOGISTICS = [
  {
    id: "drop_off",
    name: "Mercado Envios - Agência",
  },
  {
    id: "cross_docking",
    name: "Mercado Envios - Coleta",
  },
  {
    id: "self_service",
    name: "Mercado Envios Flex",
  },
  {
    id: "fulfillment",
    name: "Mercado Envios Full",
  },
  {
    id: "custom",
    name: "Envio próprio/personalizado",
  },
];

function ResultDetailsPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const productName =
    location.state?.productName;

  const category =
    location.state?.category;

  const marketplace =
    location.state?.marketplace;

  const analysis =
    location.state?.analysis;

  const [form, setForm] =
    useState({
      referencePrice:
        analysis?.referencePrice ??
        "",

      listingTypeId:
        marketplace
          ?.listingTypeId ?? "",

      logisticType:
        marketplace
          ?.logisticType ?? "",

      freightCost:
        analysis?.freightCost ??
        "",

      taxPercent:
        analysis?.taxPercent ??
        "",

      otherCosts:
        analysis?.otherCosts ??
        "",
    });

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  if (
    !productName ||
    !category?.id ||
    !category?.name ||
    !marketplace ||
    !analysis
  ) {
    return (
      <Navigate
        to="/produto"
        replace
      />
    );
  }

  function formatCurrency(value) {
    return new Intl.NumberFormat(
      "pt-BR",
      {
        style: "currency",
        currency: "BRL",
      }
    ).format(value ?? 0);
  }

  function formatPercent(value) {
    return new Intl.NumberFormat(
      "pt-BR",
      {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }
    ).format(value ?? 0);
  }

  function handleChange(event) {
    const {
      name,
      value,
    } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function getMarketplaceFee() {
    const params =
      new URLSearchParams({
        categoryId:
          category.id,

        price:
          form.referencePrice,

        listingTypeId:
          form.listingTypeId,

        logisticType:
          form.logisticType,
      });

    const response =
      await fetch(
        `${MARKETPLACE_API_URL}/mercadolivre/listing-prices?${params.toString()}`
      );

    const data =
      await response.json();

    if (
      !response.ok ||
      !data.success
    ) {
      throw new Error(
        data.error ||
          "Não foi possível consultar os custos do Mercado Livre."
      );
    }

    return data;
  }

  async function calculateAnalysis(
    marketplaceFee
  ) {
    const response =
      await fetch(
        `${API_URL}/analysis/calculate`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            referencePrice:
              Number(
                form.referencePrice
              ),

            marketplaceCosts:
              Number(
                marketplaceFee.amount ||
                  0
              ),

            freightCost:
              Number(
                form.freightCost ||
                  0
              ),

            taxPercent:
              Number(
                form.taxPercent ||
                  0
              ),

            otherCosts:
              Number(
                form.otherCosts ||
                  0
              ),
          }),
        }
      );

    const data =
      await response.json();

    if (
      !response.ok ||
      !data.success
    ) {
      throw new Error(
        data.error ||
          "Não foi possível recalcular a análise."
      );
    }

    return data.data;
  }

  async function handleSubmit(
    event
  ) {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      const marketplaceData =
        await getMarketplaceFee();

      const newAnalysis =
        await calculateAnalysis(
          marketplaceData.fee
        );

      const listingType =
        LISTING_TYPES.find(
          (item) =>
            item.id ===
            form.listingTypeId
        );

      const logistics =
        LOGISTICS.find(
          (item) =>
            item.id ===
            form.logisticType
        );

      navigate(
        "/resultado",
        {
          replace: true,

          state: {
            productName,
            category,

            marketplace: {
              name:
                "Mercado Livre",

              listingTypeId:
                form.listingTypeId,

              listingTypeName:
                listingType?.name,

              logisticType:
                form.logisticType,

              logisticName:
                logistics?.name,

              fee:
                marketplaceData.fee,
            },

            analysis:
              newAnalysis,
          },
        }
      );
    } catch (err) {
      setError(
        err.message ||
          "Erro ao recalcular a análise."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="app">
      <section className="container">
        <button
          type="button"
          className="back-button"
          onClick={() =>
            navigate(-1)
          }
        >
          ← Voltar ao resultado
        </button>

        <header className="header">
          <span className="brand">
            KERPTA
          </span>

          <h1>
            Detalhes do cálculo
          </h1>

          <p className="product-reference">
            {productName}
          </p>

          <p className="product-reference">
            {category.name}
          </p>
        </header>

        <form
          className="form"
          onSubmit={handleSubmit}
        >
          <label>
            Preço de referência

            <input
              type="number"
              name="referencePrice"
              value={
                form.referencePrice
              }
              onChange={
                handleChange
              }
              min="0.01"
              step="0.01"
              required
            />
          </label>

          <label>
            Tipo de anúncio

            <select
              name="listingTypeId"
              value={
                form.listingTypeId
              }
              onChange={
                handleChange
              }
              required
            >
              {LISTING_TYPES.map(
                (item) => (
                  <option
                    key={item.id}
                    value={item.id}
                  >
                    {item.name}
                  </option>
                )
              )}
            </select>
          </label>

          <label>
            Logística

            <select
              name="logisticType"
              value={
                form.logisticType
              }
              onChange={
                handleChange
              }
              required
            >
              {LOGISTICS.map(
                (item) => (
                  <option
                    key={item.id}
                    value={item.id}
                  >
                    {item.name}
                  </option>
                )
              )}
            </select>
          </label>

          <div className="detail-row">
            <span>
              Comissão Mercado Livre
            </span>

            <strong>
              {formatCurrency(
                marketplace.fee
                  ?.amount
              )}
            </strong>
          </div>

          <div className="detail-row">
            <span>
              Percentual da comissão
            </span>

            <strong>
              {formatPercent(
                marketplace.fee
                  ?.percentage
              )}
              %
            </strong>
          </div>

          {Number(
            marketplace.fee
              ?.fixedFee
          ) > 0 && (
            <div className="detail-row">
              <span>
                Tarifa fixa
              </span>

              <strong>
                {formatCurrency(
                  marketplace.fee
                    .fixedFee
                )}
              </strong>
            </div>
          )}

          <label>
            Frete pago pelo vendedor

            <input
              type="number"
              name="freightCost"
              value={
                form.freightCost
              }
              onChange={
                handleChange
              }
              min="0"
              step="0.01"
            />
          </label>

          <label>
            Impostos (%)

            <input
              type="number"
              name="taxPercent"
              value={
                form.taxPercent
              }
              onChange={
                handleChange
              }
              min="0"
              step="0.01"
            />
          </label>

          <label>
            Embalagem e outros custos

            <input
              type="number"
              name="otherCosts"
              value={
                form.otherCosts
              }
              onChange={
                handleChange
              }
              min="0"
              step="0.01"
            />
          </label>

          <p className="field-status">
            A comissão do Mercado Livre
            será consultada novamente ao
            recalcular.
          </p>

          {error && (
            <div className="error">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Recalculando..."
              : "Recalcular análise"}
          </button>
        </form>

        <p className="positioning">
          A KERPTA calcula a compra. Você
          decide a venda.
        </p>
      </section>
    </main>
  );
}

export default ResultDetailsPage;