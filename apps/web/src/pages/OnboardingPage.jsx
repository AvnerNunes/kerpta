import {
  useState,
} from "react";

import {
  Navigate,
  useNavigate,
} from "react-router-dom";

import {
  useSession,
} from "../context/SessionContext.jsx";

function OnboardingPage() {
  const navigate =
    useNavigate();

  const {
    user,
    authenticated,
    loading,
    checkSession,
  } = useSession();

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

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

  if (!authenticated) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  if (
    user?.onboardingCompleted
  ) {
    return (
      <Navigate
        to="/produto"
        replace
      />
    );
  }

  async function handleStart() {
    setSubmitting(true);
    setError("");

    try {
      const response =
        await fetch(
          "/api/auth/onboarding",
          {
            method: "POST",

            credentials:
              "include",
          }
        );

      let data;

      try {
        data =
          await response.json();
      } catch {
        throw new Error(
          "Não foi possível concluir seu primeiro acesso."
        );
      }

      if (
        response.status === 401
      ) {
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

        return;
      }

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.error ||
            "Não foi possível concluir seu primeiro acesso."
        );
      }

      const sessionUpdated =
        await checkSession();

      if (!sessionUpdated) {
        throw new Error(
          "Não foi possível atualizar sua sessão."
        );
      }

      navigate(
        "/produto",
        {
          replace: true,
        }
      );
    } catch (err) {
      setError(
        err.message ||
          "Não foi possível continuar."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="app">
      <section className="container product-container onboarding-container">
        <header className="onboarding-header">
          <span className="brand">
            KERPTA
          </span>

          <span className="onboarding-plan">
            KERPTA FREE
          </span>

          <h1>
            Bem-vindo à KERPTA
          </h1>

          <p>
            Descubra quanto você
            pode pagar por um produto
            antes de comprar.
          </p>
        </header>

        <div className="onboarding-steps">
          <div className="onboarding-step">
            <span>
              1
            </span>

            <div>
              <strong>
                Escolha o produto
              </strong>

              <p>
                Informe o produto e
                selecione a categoria
                correspondente.
              </p>
            </div>
          </div>

          <div className="onboarding-step">
            <span>
              2
            </span>

            <div>
              <strong>
                Informe o preço
              </strong>

              <p>
                Use o preço competitivo
                que você encontrou no
                Mercado Livre.
              </p>
            </div>
          </div>

          <div className="onboarding-step">
            <span>
              3
            </span>

            <div>
              <strong>
                Descubra seu custo
              </strong>

              <p>
                A KERPTA calcula quanto
                você pode pagar para
                diferentes margens.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="error">
            {error}
          </div>
        )}

        <button
          type="button"
          className="onboarding-button"
          onClick={
            handleStart
          }
          disabled={
            submitting
          }
        >
          {submitting
            ? "Preparando..."
            : "Fazer minha primeira análise"}
        </button>

        <p className="positioning">
          A KERPTA calcula a compra.
          Você decide a venda.
        </p>
      </section>
    </main>
  );
}

export default OnboardingPage;