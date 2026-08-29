import {
  Navigate,
} from "react-router-dom";

import {
  useSession,
} from "../context/SessionContext.jsx";

function LoginPage() {
  const {
    authenticated,
    loading,
  } = useSession();

  if (loading) {
    return (
      <main className="app">
        <section className="container product-container">
          <div className="session-loading">
            <span className="brand">
              KERPTA
            </span>

            <p>
              Carregando...
            </p>
          </div>
        </section>
      </main>
    );
  }

  if (authenticated) {
    return (
      <Navigate
        to="/produto"
        replace
      />
    );
  }

  function connectMercadoLivre() {
    window.location.href =
      "/api/auth/mercadolivre/start";
  }

  return (
    <main className="app">
      <section className="container product-container login-container">
        <header className="login-header">
          <span className="brand">
            KERPTA
          </span>

          <h1>
            Compre certo.
            <br />
            Venda competitivo.
          </h1>

          <p>
            Descubra quanto você
            pode pagar por um produto
            antes de comprar.
          </p>
        </header>

        <div className="login-action">
          <button
            type="button"
            className="mercadolivre-login-button"
            onClick={
              connectMercadoLivre
            }
          >
            Continuar com Mercado Livre
          </button>

          <p className="secure-connection">
            Conexão segura através do
            Mercado Livre
          </p>
        </div>

        <div className="login-value">
          <span>
            KERPTA FREE
          </span>

          <strong>
            Descubra seu custo máximo
            de compra.
          </strong>

          <p>
            Considere comissão,
            logística, impostos e
            margem antes de fechar
            uma compra.
          </p>
        </div>

        <p className="positioning">
          A KERPTA calcula a compra.
          Você decide a venda.
        </p>
      </section>
    </main>
  );
}

export default LoginPage;