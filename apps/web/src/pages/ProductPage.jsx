import { useState } from "react";
import { useNavigate } from "react-router-dom";

function ProductPage() {
  const navigate = useNavigate();
  const [productName, setProductName] = useState("");

  function handleSubmit(event) {
    event.preventDefault();

    const name = productName.trim();

    if (!name) {
      return;
    }

    navigate("/parametros", {
      state: {
        productName: name,
      },
    });
  }

  return (
    <main className="app">
      <section className="container product-container">
        <header className="header">
          <span className="brand">KERPTA</span>

          <h1>Qual produto você está analisando?</h1>

          <p>
            Informe o produto que você encontrou e vamos calcular quanto você
            pode pagar por ele.
          </p>
        </header>

        <form className="form" onSubmit={handleSubmit}>
          <label>
            Produto
            <input
              type="text"
              value={productName}
              onChange={(event) => setProductName(event.target.value)}
              placeholder="Ex.: Khamrah Lattafa 100ml"
              autoFocus
            />
          </label>

          <button type="submit">Continuar</button>
        </form>

        <p className="positioning">
          A KERPTA calcula a compra. Você decide a venda.
        </p>
      </section>
    </main>
  );
}

export default ProductPage;