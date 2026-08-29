import {
  useState,
} from "react";

import {
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  useSession,
} from "../context/SessionContext.jsx";

const API_URL = "/api";

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

function createRequestError(
  message,
  status
) {
  const error =
    new Error(message);

  error.status =
    status;

  return error;
}

function ParametersPage() {
  const location =
    useLocation();

  const navigate =
    useNavigate();

  const {
    logout,
  } = useSession();

  const productName =
    location.state?.productName;

  const category =
    location.state?.category;

  const [
    form,
    setForm,
  ] = useState({
    referencePrice: "",
    listingTypeId: "",
    logisticType: "",
    freightCost: "",
    taxPercent: "",
    otherCosts: "",
  });

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  if (
    !productName ||
    !category?.id ||
    !category?.name
  ) {
    return (
      <Navigate
        to="/produto"
        replace
      />
    );
  }

  function handleChange(
    event
  ) {
    const {
      name,
      value,
    } = event.target;

    setForm(
      (current) => ({
        ...current,
        [name]: value,
      })
    );
  }

  async function readResponse(
    response,
    fallbackMessage
  ) {
    let data;

    try {
      data =
        await response.json();
    } catch {
      throw createRequestError(
        fallbackMessage,
        response.status
      );
    }

    if (response.status === 401) {
      throw createRequestError(
        data.error ||
          "Sua sessão expirou.",
        401
      );
    }

    if (
      !response.ok ||
      !data.success
    ) {
      throw createRequestError(
        data.error ||
          fallbackMessage,
        response.status
      );
    }

    return data;
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
        `${API_URL}/mercadolivre/listing-prices?${params.toString()}`,
        {
          credentials:
            "include",
        }
      );

    return readResponse(
      response,
      "Não foi possível consultar os custos do Mercado Livre."
    );
  }

  async function calculateAnalysis(
    marketplaceFee
  ) {
    const response =
      await fetch(
        `${API_URL}/analysis/calculate`,
        {
          method: "POST",

          credentials:
            "include",

          headers: {
            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify({
              referencePrice:
                Number(
                  form.referencePrice
                ),

              marketplaceCosts:
                Number(
                  marketplaceFee
                    .amount ||
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
      await readResponse(
        response,
        "Não foi possível calcular o custo."
      );

    return data.data;
  }

  async function handleExpiredSession() {
    try {
      await logout();
    } finally {
      navigate(
        "/login",
        {
          replace: true,

          state: {
            message:
              "Sua sessão expirou. Entre novamente com sua conta do Mercado Livre.",
          },
        }
      );
    }
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

      const analysis =
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

            analysis,
          },
        }
      );
    } catch (err) {
      if (
        err.status === 401
      ) {
        await handleExpiredSession();

        return;
      }

      setError(
        err.message ||
          "Erro ao realizar a análise."
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
            navigate(
              "/produto"
            )
          }
        >
          ← Voltar
        </button>

        <header className="header">
          <span className="brand">
            KERPTA
          </span>

          <h1>
            Parâmetros da análise
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
          onSubmit={
            handleSubmit
          }
        >
          <label>
            Preço encontrado no Mercado Livre

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
              placeholder="280,00"
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
              <option value="">
                Selecione
              </option>

              {LISTING_TYPES.map(
                (item) => (
                  <option
                    key={
                      item.id
                    }
                    value={
                      item.id
                    }
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
              <option value="">
                Selecione
              </option>

              {LOGISTICS.map(
                (item) => (
                  <option
                    key={
                      item.id
                    }
                    value={
                      item.id
                    }
                  >
                    {item.name}
                  </option>
                )
              )}
            </select>
          </label>

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
              placeholder="15,99"
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
              placeholder="0"
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
              placeholder="5,00"
            />
          </label>

          {error && (
            <div className="error">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={
              loading
            }
          >
            {loading
              ? "Consultando Mercado Livre..."
              : "Calcular Custo"}
          </button>
        </form>
      </section>
    </main>
  );
}

export default ParametersPage;