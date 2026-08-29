import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  useSession,
} from "../context/SessionContext.jsx";

function MercadoLivreCallbackPage() {
  const navigate =
    useNavigate();

  const {
    checkSession,
  } = useSession();

  const [
    status,
    setStatus,
  ] = useState("loading");

  const [
    error,
    setError,
  ] = useState("");

  useEffect(() => {
    let active = true;

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

        const response =
          await fetch(
            `/api/auth/mercadolivre/callback?code=${encodeURIComponent(
              code
            )}&state=${encodeURIComponent(
              state
            )}`,
            {
              credentials:
                "include",
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
              "Não foi possível conectar ao Mercado Livre."
          );
        }

        window.history
          .replaceState(
            {},
            document.title,
            window.location.pathname
          );

        const authenticated =
          await checkSession();

        if (!authenticated) {
          throw new Error(
            "A conexão foi concluída, mas não foi possível iniciar sua sessão."
          );
        }

        if (!active) {
          return;
        }

        navigate(
          "/produto",
          {
            replace: true,
          }
        );
      } catch (err) {
        window.history
          .replaceState(
            {},
            document.title,
            window.location.pathname
          );

        if (!active) {
          return;
        }

        setError(
          err.message ||
            "Não foi possível concluir a conexão."
        );

        setStatus("error");
      }
    }

    finishConnection();

    return () => {
      active = false;
    };
  }, [
    checkSession,
    navigate,
  ]);

  return (
    <main className="app">
      <section className="container product-container">
        <header className="header">
          <span className="brand">
            KERPTA
          </span>

          {status ===
            "loading" && (
            <>
              <h1>
                Entrando na KERPTA
              </h1>

              <p>
                Estamos validando sua
                conta do Mercado Livre.
              </p>
            </>
          )}

          {status ===
            "error" && (
            <>
              <h1>
                Não foi possível entrar
              </h1>

              <div className="error">
                {error}
              </div>

              <button
                type="button"
                className="new-analysis-button callback-button"
                onClick={() =>
                  navigate(
                    "/login",
                    {
                      replace:
                        true,
                    }
                  )
                }
              >
                Tentar novamente
              </button>
            </>
          )}
        </header>

        <p className="positioning">
          A KERPTA calcula a compra.
          Você decide a venda.
        </p>
      </section>
    </main>
  );
}

export default MercadoLivreCallbackPage;