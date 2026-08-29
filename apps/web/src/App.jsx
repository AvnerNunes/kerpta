import { Navigate, Route, Routes } from "react-router-dom";
import "./App.css";

import ProductPage from "./pages/ProductPage.jsx";
import ParametersPage from "./pages/ParametersPage.jsx";
import ResultPage from "./pages/ResultPage.jsx";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/produto" replace />} />
      <Route path="/produto" element={<ProductPage />} />
      <Route path="/parametros" element={<ParametersPage />} />
      <Route path="/resultado" element={<ResultPage />} />

      <Route path="*" element={<Navigate to="/produto" replace />} />
    </Routes>
  );
}

export default App;