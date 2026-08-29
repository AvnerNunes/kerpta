import { useState } from "react";
import {
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";

const API_URL = import.meta.env.DEV
  ? "http://localhost:3001"
  : "/api";

function ParametersPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const productName =
    location.state?.productName;

  const category =
    location.state?.category;

  const [form, setForm] = useState({
    referencePrice: "",
    marketplaceCosts: "",
    freightCost: "",
    taxPercent: "",
    otherCosts: "",
  });

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

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

  async function handleSubmit(event) {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
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
                form.marketplaceCosts ||
                  0
              ),

            freightCost:
              Number(
                form.freightCost || 0
              ),

            taxPercent:
              Number(
                form.taxPercent || 0
              ),

            otherCosts:
              Number(
                form.otherCosts || 0
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
            "Não foi possível calcular."
        );
      }

      navigate(
        "/resultado",
        {
          state: {
            productName,
            category,
            analysis:
              data.data,
          },
        }
      );
    } catch (err) {
      setError(
        err.message ||
          "Erro ao conectar com a KERPTA API."
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
            navigate("/produto")
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
          onSubmit={handleSubmit}
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
              min="0"
              step="0.01"
              required
              placeholder="280,00"
            />
          </label>

          <label>
            Custos do marketplace

            <input
              type="number"
              name="marketplaceCosts"
              value={
                form.marketplaceCosts
              }
              onChange={
                handleChange
              }
              min="0"
              step="0.01"
              placeholder="Temporário"
            />
          </label>

          <label>
            Frete

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
            disabled={loading}
          >
            {loading
              ? "Calculando..."
              : "Calcular Custo"}
          </button>
        </form>
      </section>
    </main>
  );
}

export default ParametersPage;