import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import "./App.css";

import {
  SessionProvider,
} from "./context/SessionContext.jsx";

import ProtectedRoute from "./components/ProtectedRoute.jsx";

import LoginPage from "./pages/LoginPage.jsx";
import OnboardingPage from "./pages/OnboardingPage.jsx";
import ProductPage from "./pages/ProductPage.jsx";
import ParametersPage from "./pages/ParametersPage.jsx";
import ResultPage from "./pages/ResultPage.jsx";
import ResultDetailsPage from "./pages/ResultDetailsPage.jsx";
import MercadoLivreCallbackPage from "./pages/MercadoLivreCallbackPage.jsx";

function PrivatePage({
  children,
}) {
  return (
    <ProtectedRoute>
      {children}
    </ProtectedRoute>
  );
}

function App() {
  return (
    <SessionProvider>
      <Routes>
        <Route
          path="/"
          element={
            <Navigate
              to="/produto"
              replace
            />
          }
        />

        <Route
          path="/login"
          element={
            <LoginPage />
          }
        />

        <Route
          path="/auth/mercadolivre/callback"
          element={
            <MercadoLivreCallbackPage />
          }
        />

        <Route
          path="/onboarding"
          element={
            <PrivatePage>
              <OnboardingPage />
            </PrivatePage>
          }
        />

        <Route
          path="/produto"
          element={
            <PrivatePage>
              <ProductPage />
            </PrivatePage>
          }
        />

        <Route
          path="/parametros"
          element={
            <PrivatePage>
              <ParametersPage />
            </PrivatePage>
          }
        />

        <Route
          path="/resultado"
          element={
            <PrivatePage>
              <ResultPage />
            </PrivatePage>
          }
        />

        <Route
          path="/resultado/detalhes"
          element={
            <PrivatePage>
              <ResultDetailsPage />
            </PrivatePage>
          }
        />

        <Route
          path="*"
          element={
            <Navigate
              to="/produto"
              replace
            />
          }
        />
      </Routes>
    </SessionProvider>
  );
}

export default App;