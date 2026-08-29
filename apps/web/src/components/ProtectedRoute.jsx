import {
  Navigate,
} from "react-router-dom";

import {
  useSession,
} from "../context/SessionContext.jsx";

function ProtectedRoute({
  children,
}) {
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

  if (!authenticated) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  return children;
}

export default ProtectedRoute;