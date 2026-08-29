import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import "./App.css";

import ProductPage from "./pages/ProductPage.jsx";
import ParametersPage from "./pages/ParametersPage.jsx";
import ResultPage from "./pages/ResultPage.jsx";
import ResultDetailsPage from "./pages/ResultDetailsPage.jsx";
import MercadoLivreCallbackPage from "./pages/MercadoLivreCallbackPage.jsx";

function App() {
  return (
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
        path="/produto"
        element={<ProductPage />}
      />

      <Route
        path="/parametros"
        element={<ParametersPage />}
      />

      <Route
        path="/resultado"
        element={<ResultPage />}
      />

      <Route
        path="/resultado/detalhes"
        element={<ResultDetailsPage />}
      />

      <Route
        path="/auth/mercadolivre/callback"
        element={
          <MercadoLivreCallbackPage />
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
  );
}

export default App;