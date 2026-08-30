import {
  Navigate,
  useLocation,
} from "react-router-dom";

import {
  useSession,
} from "../context/SessionContext.jsx";

function ProtectedRoute({
  children,
}) {
  const location =
    useLocation();

  const {
    authenticated,
    loading,
    user,
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

  const isOnboarding =
    location.pathname ===
    "/onboarding";

  if (
    !user
      ?.onboardingCompleted &&
    !isOnboarding
  ) {
    return (
      <Navigate
        to="/onboarding"
        replace
      />
    );
  }

  if (
    user
      ?.onboardingCompleted &&
    isOnboarding
  ) {
    return (
      <Navigate
        to="/produto"
        replace
      />
    );
  }

  return children;
}

export default ProtectedRoute;