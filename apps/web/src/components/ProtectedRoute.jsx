import {
  Navigate,
} from "react-router-dom";

import {
  useAuth,
} from "../context/AuthContext.jsx";

function ProtectedRoute({
  children,
}) {
  const {
    user,
    loading,
  } = useAuth();

  if (loading) {
    return (
      <main className="app">
        <section className="container">
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

  if (!user) {
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