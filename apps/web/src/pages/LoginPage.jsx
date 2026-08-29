import {
  useState,
} from "react";

import {
  Navigate,
  useNavigate,
} from "react-router-dom";

import {
  useAuth,
} from "../context/AuthContext.jsx";

function LoginPage() {
  const navigate =
    useNavigate();

  const {
    user,
    loading: authLoading,
    signIn,
    signUp,
  } = useAuth();

  const [mode, setMode] =
    useState("login");

  const [email, setEmail] =
    useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  if (authLoading) {
    return (
      <main className="app">
        <section className="container product-container">
          <span className="brand">
            KERPTA
          </span>

          <p>
            Carregando...
          </p>
        </section>
      </main>
    );
  }

  if (user) {
    return (
      <Navigate
        to="/produto"
        replace
      />
    );
  }

  function changeMode(
    newMode
  ) {
    setMode(newMode);
    setError("");
    setMessage("");
    setPassword("");
    setConfirmPassword("");
  }

  async function handleSubmit(
    event
  ) {
    event.preventDefault();

    setError("");
    setMessage("");

    const cleanEmail =
      email.trim()
        .toLowerCase();

    if (!cleanEmail) {
      setError(
        "Informe seu e-mail."
      );

      return;
    }

    if (
      password.length < 6
    ) {
      setError(
        "A senha deve possuir pelo menos 6 caracteres."
      );

      return;
    }

    if (
      mode === "register" &&
      password !==
        confirmPassword
    ) {
      setError(
        "As senhas não são iguais."
      );

      return;
    }

    setLoading(true);

    try {
      if (
        mode === "register"
      ) {
        const {
          data,
          error:
            signUpError,
        } =
          await signUp(
            cleanEmail,
            password
          );

        if (signUpError) {
          throw signUpError;
        }

        if (data.session) {
          navigate(
            "/produto",
            {
              replace: true,
            }
          );

          return;
        }

        setMessage(
          "Cadastro realizado. Verifique seu e-mail para confirmar sua conta."
        );

        return;
      }

      const {
        error:
          signInError,
      } =
        await signIn(
          cleanEmail,
          password
        );

      if (signInError) {
        throw signInError;
      }

      navigate(
        "/produto",
        {
          replace: true,
        }
      );
    } catch (err) {
      if (
        err.message ===
        "Invalid login credentials"
      ) {
        setError(
          "E-mail ou senha incorretos."
        );

        return;
      }

      if (
        err.message ===
        "Email not confirmed"
      ) {
        setError(
          "Confirme seu e-mail antes de entrar."
        );

        return;
      }

      if (
        err.message
          ?.toLowerCase()
          .includes(
            "already registered"
          )
      ) {
        setError(
          "Este e-mail já possui uma conta."
        );

        return;
      }

      setError(
        err.message ||
          "Não foi possível concluir a operação."
      );
    } finally {
      setLoading(false);
    }
  }

  const isRegister =
    mode === "register";

  return (
    <main className="app">
      <section className="container product-container">
        <header className="header">
          <span className="brand">
            KERPTA
          </span>

          <h1>
            {isRegister
              ? "Crie sua conta"
              : "Entre na KERPTA"}
          </h1>

          <p>
            {isRegister
              ? "Comece a calcular quanto você pode pagar pelos produtos que pretende vender."
              : "Acesse sua conta para realizar suas análises."}
          </p>
        </header>

        <form
          className="form"
          onSubmit={
            handleSubmit
          }
        >
          <label>
            E-mail

            <input
              type="email"
              value={email}
              onChange={(
                event
              ) =>
                setEmail(
                  event.target
                    .value
                )
              }
              autoComplete="email"
              required
              placeholder="seu@email.com"
            />
          </label>

          <label>
            Senha

            <input
              type="password"
              value={password}
              onChange={(
                event
              ) =>
                setPassword(
                  event.target
                    .value
                )
              }
              autoComplete={
                isRegister
                  ? "new-password"
                  : "current-password"
              }
              minLength={6}
              required
              placeholder="Sua senha"
            />
          </label>

          {isRegister && (
            <label>
              Confirme sua senha

              <input
                type="password"
                value={
                  confirmPassword
                }
                onChange={(
                  event
                ) =>
                  setConfirmPassword(
                    event.target
                      .value
                  )
                }
                autoComplete="new-password"
                minLength={6}
                required
                placeholder="Digite novamente"
              />
            </label>
          )}

          {error && (
            <div className="error">
              {error}
            </div>
          )}

          {message && (
            <div className="auth-success">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Aguarde..."
              : isRegister
                ? "Criar conta"
                : "Entrar"}
          </button>
        </form>

        <div className="auth-switch">
          <span>
            {isRegister
              ? "Já possui uma conta?"
              : "Ainda não possui uma conta?"}
          </span>

          <button
            type="button"
            onClick={() =>
              changeMode(
                isRegister
                  ? "login"
                  : "register"
              )
            }
          >
            {isRegister
              ? "Entrar"
              : "Criar conta grátis"}
          </button>
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