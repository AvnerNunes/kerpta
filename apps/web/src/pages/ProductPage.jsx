import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

function ProductPage() {
  const navigate = useNavigate();

  const [
    productName,
    setProductName,
  ] = useState("");

  const [
    categoryQuery,
    setCategoryQuery,
  ] = useState("");

  const [
    selectedCategory,
    setSelectedCategory,
  ] = useState(null);

  const [
    categories,
    setCategories,
  ] = useState([]);

  const [
    loadingCategories,
    setLoadingCategories,
  ] = useState(false);

  const [
    categoryError,
    setCategoryError,
  ] = useState("");

  useEffect(() => {
    const query =
      categoryQuery.trim();

    if (
      query.length < 2 ||
      selectedCategory
    ) {
      setCategories([]);
      setCategoryError("");
      return;
    }

    const controller =
      new AbortController();

    const timer = setTimeout(
      async () => {
        setLoadingCategories(true);
        setCategoryError("");

        try {
          const response =
            await fetch(
              `/api/mercadolivre/category-search?q=${encodeURIComponent(
                query
              )}`,
              {
                signal:
                  controller.signal,
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
                "Não foi possível buscar categorias."
            );
          }

          setCategories(
            data.categories || []
          );
        } catch (error) {
          if (
            error.name ===
            "AbortError"
          ) {
            return;
          }

          setCategories([]);

          setCategoryError(
            error.message ||
              "Não foi possível buscar categorias."
          );
        } finally {
          if (
            !controller.signal.aborted
          ) {
            setLoadingCategories(
              false
            );
          }
        }
      },
      400
    );

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [
    categoryQuery,
    selectedCategory,
  ]);

  function handleCategoryChange(
    event
  ) {
    setCategoryQuery(
      event.target.value
    );

    setSelectedCategory(null);
  }

  function handleCategorySelect(
    category
  ) {
    setSelectedCategory(
      category
    );

    setCategoryQuery(
      category.name
    );

    setCategories([]);
    setCategoryError("");
  }

  function handleSubmit(event) {
    event.preventDefault();

    const name =
      productName.trim();

    if (
      !name ||
      !selectedCategory
    ) {
      return;
    }

    navigate(
      "/parametros",
      {
        state: {
          productName:
            name,

          category: {
            id:
              selectedCategory.id,

            name:
              selectedCategory.name,
          },
        },
      }
    );
  }

  const canContinue =
    productName.trim().length > 0 &&
    Boolean(selectedCategory);

  return (
    <main className="app">
      <section className="container product-container">
        <header className="header">
          <span className="brand">
            KERPTA
          </span>

          <h1>
            Qual produto você está
            analisando?
          </h1>

          <p>
            Informe o produto e selecione
            a categoria correspondente no
            Mercado Livre.
          </p>
        </header>

        <form
          className="form"
          onSubmit={handleSubmit}
        >
          <label>
            Produto

            <input
              type="text"
              value={productName}
              onChange={(event) =>
                setProductName(
                  event.target.value
                )
              }
              placeholder="Ex.: Khamrah Lattafa 100ml"
              autoFocus
            />
          </label>

          <div className="category-field">
            <label>
              Categoria

              <input
                type="text"
                value={categoryQuery}
                onChange={
                  handleCategoryChange
                }
                placeholder="Ex.: Perfumes"
                autoComplete="off"
              />
            </label>

            {loadingCategories && (
              <p className="field-status">
                Buscando categorias...
              </p>
            )}

            {categoryError && (
              <div className="error">
                {categoryError}
              </div>
            )}

            {!loadingCategories &&
              !categoryError &&
              categoryQuery
                .trim()
                .length >= 2 &&
              !selectedCategory &&
              categories.length ===
                0 && (
                <p className="field-status">
                  Nenhuma categoria
                  encontrada.
                </p>
              )}

            {categories.length >
              0 && (
              <div className="category-results">
                {categories.map(
                  (category) => (
                    <button
                      key={
                        category.id
                      }
                      type="button"
                      className="category-option"
                      onClick={() =>
                        handleCategorySelect(
                          category
                        )
                      }
                    >
                      <strong>
                        {
                          category.name
                        }
                      </strong>

                      {Array.isArray(
                        category.path
                      ) && (
                        <span>
                          {category.path
                            .map(
                              (
                                item
                              ) =>
                                item.name
                            )
                            .join(
                              " → "
                            )}
                        </span>
                      )}
                    </button>
                  )
                )}
              </div>
            )}

            {selectedCategory && (
              <p className="selected-category">
                Categoria selecionada:{" "}
                <strong>
                  {
                    selectedCategory.name
                  }
                </strong>
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={
              !canContinue
            }
          >
            Continuar
          </button>
        </form>

        <p className="positioning">
          A KERPTA calcula a compra. Você
          decide a venda.
        </p>
      </section>
    </main>
  );
}

export default ProductPage;