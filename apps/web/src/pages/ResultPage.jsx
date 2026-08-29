import { Navigate, useLocation, useNavigate } from "react-router-dom";

function ResultPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const productName = location.state?.productName;
  const analysis = location.state?.analysis;

  if (!productName || !analysis) {
    return <Navigate to="/produto" replace />;
  }

  function formatCurrency(value) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  }

  return (
    <main className="app">
      <section className="container">
        <button
          type="button"
          className="back-button"
          onClick={() => navigate(-1)}
        >
          ← Voltar
        </button>

        <header className="result-page-header">
          <span className="brand">KERPTA</span>

          <p className="product-reference">{productName}</p>

          <span className="result-label">CUSTO IDEAL DE COMPRA</span>

          <h1>Quanto você pode pagar para atingir cada margem.</h1>
        </header>

        <div className="margin-grid">
          {analysis.margins.map((item) => (
            <article
              className={`margin-card ${
                item.viable ? "" : "margin-card-inviable"
              }`}
              key={item.marginPercent}
            >
              <span>Margem {item.marginPercent}%</span>

              <strong>{formatCurrency(item.idealCost)}</strong>

              {!item.viable && <small>Inviável</small>}
            </article>
          ))}
        </div>

        <div className="break-even">
          <span>Limite de equilíbrio</span>
          <strong>{formatCurrency(analysis.breakEvenCost)}</strong>
        </div>

        <button
          type="button"
          className="new-analysis-button"
          onClick={() => navigate("/produto")}
        >
          Nova análise
        </button>

        <p className="positioning">
          A KERPTA calcula a compra. Você decide a venda.
        </p>
      </section>
    </main>
  );
}

export default ResultPage;