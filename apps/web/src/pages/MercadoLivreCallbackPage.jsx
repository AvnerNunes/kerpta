import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function MercadoLivreCallbackPage() {
  const navigate = useNavigate();

  const [status, setStatus] =
    useState("loading");

  const [account, setAccount] =
    useState(null);

  const [error, setError] =
    useState("");

  useEffect(() => {
    async function finishConnection() {
      try {
        const params =
          new URLSearchParams(
            window.location.search
          );

        const code =
          params.get("code");

        const state =
          params.get("state");

        if (!code || !state) {
          throw new Error(
            "O Mercado Livre não retornou os dados necessários para concluir a conexão."
          );
        }

        const response = await fetch(
          `/api/auth/mercadolivre/callback?code=${encodeURIComponent(
            code
          )}&state=${encodeURIComponent(
            state
          )}`
        );

        const data =
          await response.json();

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.error ||
              "Não foi possível conectar ao Mercado Livre."
          );
        }

        window.history.replaceState(
          {},
          document.title,
          window.location.pathname
        );

        setAccount(data.account);
        setStatus("success");
      } catch (err) {
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname
        );

        setError(
          err.message ||
            "Não foi possível concluir a conexão."
        );

        setStatus("error");
      }
    }

    finishConnection();
  }, []);

  return (
    <main className="app">
      <section className="container product-container">
        <header className="header">
          <span className="brand">
            KERPTA
          </span>

          {status === "loading" && (
            <>
              <h1>
                Conectando ao Mercado Livre
              </h1>

              <p>
                Estamos validando sua
                autorização.
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <h1>
                Mercado Livre conectado
              </h1>

              <p>
                A conexão foi autorizada
                com sucesso.
              </p>

              {account && (
                <p className="product-reference">
                  {account.nickname}
                </p>
              )}

              <button
                type="button"
                className="new-analysis-button"
                onClick={() =>
                  navigate("/produto")
                }
              >
                Continuar
              </button>
            </>
          )}

          {status === "error" && (
            <>
              <h1>
                Não foi possível conectar
              </h1>

              <div className="error">
                {error}
              </div>

              <button
                type="button"
                className="new-analysis-button"
                onClick={() =>
                  navigate("/produto")
                }
              >
                Voltar
              </button>
            </>
          )}
        </header>

        <p className="positioning">
          A KERPTA calcula a compra. Você
          decide a venda.
        </p>
      </section>
    </main>
  );
}

export default MercadoLivreCallbackPage;