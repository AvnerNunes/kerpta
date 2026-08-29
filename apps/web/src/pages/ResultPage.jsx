import {
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";

function ResultPage() {
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

  if (
    !productName ||
    !category ||
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
    ).format(value);
  }

  function handleDetails() {
    navigate(
      "/resultado/detalhes",
      {
        state: {
          productName,
          category,
          marketplace,
          analysis,
        },
      }
    );
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
          ← Voltar
        </button>

        <header className="result-page-header">
          <span className="brand">
            KERPTA
          </span>

          <p className="product-reference">
            {productName}
          </p>

          <span className="result-label">
            CUSTO IDEAL DE COMPRA
          </span>

          <h1>
            Quanto você pode pagar para
            atingir cada margem.
          </h1>
        </header>

        <div className="margin-grid">
          {analysis.margins.map(
            (item) => (
              <article
                className={`margin-card ${
                  item.viable
                    ? ""
                    : "margin-card-inviable"
                }`}
                key={
                  item.marginPercent
                }
              >
                <span className="margin-title">
                  Margem{" "}
                  {item.marginPercent}%
                </span>

                <div className="maximum-cost">
                  <span>
                    Custo Máximo:
                  </span>

                  <strong>
                    {formatCurrency(
                      item.idealCost
                    )}
                  </strong>
                </div>

                {!item.viable && (
                  <small>
                    Inviável
                  </small>
                )}
              </article>
            )
          )}
        </div>

        <div className="no-profit-margin">
          <span>
            MARGEM SEM LUCRO
          </span>

          <strong>
            Custo de{" "}
            {formatCurrency(
              analysis.breakEvenCost
            )}
          </strong>
        </div>

        <button
          type="button"
          className="details-button"
          onClick={handleDetails}
        >
          Ver detalhes do cálculo
        </button>

        <button
          type="button"
          className="new-analysis-button"
          onClick={() =>
            navigate("/produto")
          }
        >
          Nova análise
        </button>

        <p className="positioning">
          A KERPTA calcula a compra. Você
          decide a venda.
        </p>
      </section>
    </main>
  );
}

export default ResultPage;