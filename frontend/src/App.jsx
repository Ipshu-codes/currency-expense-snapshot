import { useEffect, useState } from "react";
import "./index.css";

const API_URL = "http://localhost:5000";

// Searchable currency selector
function CurrencySelector({
  label,
  value,
  onChange,
  currencies,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedCurrency = currencies.find(
    (currency) => currency.iso_code === value
  );

  const filteredCurrencies = currencies.filter((currency) => {
    const searchText = search.toLowerCase();

    return (
      currency.iso_code
        .toLowerCase()
        .includes(searchText) ||
      currency.name
        .toLowerCase()
        .includes(searchText)
    );
  });

  const handleSelect = (currency) => {
    onChange(currency.iso_code);
    setSearch("");
    setIsOpen(false);
  };

  return (
    <div className="currency-selector">
      <label>{label}</label>

      <button
        type="button"
        className="currency-selector-button"
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedCurrency ? (
          <>
            <span className="currency-code">
              {selectedCurrency.iso_code}
            </span>

            <span className="currency-name">
              {selectedCurrency.name}
            </span>
          </>
        ) : (
          <span>Select currency</span>
        )}

        <span className="currency-arrow">
          {isOpen ? "▲" : "▼"}
        </span>
      </button>

      {isOpen && (
        <div className="currency-dropdown">

          <input
            type="text"
            className="currency-search"
            placeholder="Search currency..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            autoFocus
          />

          <div className="currency-options">
            {filteredCurrencies.length > 0 ? (
              filteredCurrencies.map((currency) => (
                <button
                  type="button"
                  className={`currency-option ${
                    currency.iso_code === value
                      ? "selected"
                      : ""
                  }`}
                  key={currency.iso_code}
                  onClick={() =>
                    handleSelect(currency)
                  }
                >
                  <span className="currency-option-code">
                    {currency.iso_code}
                  </span>

                  <span className="currency-option-name">
                    {currency.name}
                  </span>
                </button>
              ))
            ) : (
              <div className="no-currencies">
                No currencies found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


function App() {
  const [homeCurrency, setHomeCurrency] = useState("NPR");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("NPR");

  const [currencies, setCurrencies] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [convertedExpenses, setConvertedExpenses] = useState([]);
  const [conversionLoading, setConversionLoading] =
    useState(false);
  const [error, setError] = useState("");

  // Fetch supported currencies
  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        const response = await fetch(
          `${API_URL}/currencies`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ||
              "Could not fetch currencies"
          );
        }

        // Keep the complete currency objects
        // instead of only extracting iso_code.
        const validCurrencies = data.filter(
          (item) =>
            item && item.iso_code && item.name
        );

        setCurrencies(validCurrencies);

        // Default to NPR if available
        const nprExists = validCurrencies.some(
          (item) => item.iso_code === "NPR"
        );

        if (nprExists) {
          setHomeCurrency("NPR");
          setCurrency("NPR");
        } else if (validCurrencies.length > 0) {
          setHomeCurrency(
            validCurrencies[0].iso_code
          );

          setCurrency(
            validCurrencies[0].iso_code
          );
        }
      } catch (error) {
        console.error(
          "Currency loading error:",
          error
        );

        setError(
          "Could not load supported currencies"
        );
      }
    };

    fetchCurrencies();
  }, []);


  // Fetch expenses
  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        const response = await fetch(
          `${API_URL}/expenses`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ||
              "Could not fetch expenses"
          );
        }

        setExpenses(data);
      } catch (error) {
        console.error(
          "Expense loading error:",
          error
        );

        setError(
          "Could not connect to backend"
        );
      }
    };

    fetchExpenses();
  }, []);


  // Add expense
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/expenses`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title,
            amount: Number(amount),
            currency,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.error ||
            "Could not add expense"
        );

        return;
      }

      setExpenses((previousExpenses) => [
        ...previousExpenses,
        data,
      ]);

      setTitle("");
      setAmount("");
    } catch (error) {
      console.error(
        "Add expense error:",
        error
      );

      setError(
        "Could not connect to backend"
      );
    }
  };


  // Delete expense
  const handleDelete = async (id) => {
    try {
      const response = await fetch(
        `${API_URL}/expenses/${id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to delete expense"
        );
      }

      setExpenses((previousExpenses) =>
        previousExpenses.filter(
          (expense) =>
            expense.id !== id
        )
      );
    } catch (error) {
      console.error(
        "Delete expense error:",
        error
      );

      setError(
        "Could not delete expense"
      );
    }
  };


  // Convert all expenses to home currency
  const convertExpenses = async () => {
    if (
      !homeCurrency ||
      expenses.length === 0
    ) {
      setConvertedExpenses([]);
      return;
    }

    setConversionLoading(true);
    setError("");

    try {
      const converted =
        await Promise.all(
          expenses.map(
            async (expense) => {
              // No conversion needed
              if (
                expense.currency ===
                homeCurrency
              ) {
                return {
                  ...expense,
                  convertedAmount:
                    expense.amount,
                };
              }

              const response =
                await fetch(
                  `${API_URL}/convert?from=${encodeURIComponent(
                    expense.currency
                  )}&to=${encodeURIComponent(
                    homeCurrency
                  )}&amount=${encodeURIComponent(
                    expense.amount
                  )}`
                );

              const data =
                await response.json();

              if (!response.ok) {
                throw new Error(
                  data.error ||
                    "Currency conversion failed"
                );
              }

              return {
                ...expense,
                convertedAmount:
                  data.convertedAmount,
              };
            }
          )
        );

      setConvertedExpenses(
        converted
      );
    } catch (error) {
      console.error(
        "Conversion error:",
        error
      );

      setConvertedExpenses([]);

      setError(
        "Could not convert expenses"
      );
    } finally {
      setConversionLoading(false);
    }
  };


  // Convert whenever expenses or home currency changes
  useEffect(() => {
    if (
      expenses.length > 0 &&
      homeCurrency
    ) {
      convertExpenses();
    } else {
      setConvertedExpenses([]);
    }
  }, [expenses, homeCurrency]);


  // Calculate total
  const total =
    convertedExpenses.reduce(
      (sum, expense) =>
        sum +
        Number(
          expense.convertedAmount
        ),
      0
    );


  return (
    <div className="app">
      <main className="container">

        <header className="hero">

          <div className="hero-content">
            <div className="brand">
              <span>
                CURRENCY-EXPENSE-SNAPSHOT
              </span>
            </div>

            <p className="subtitle">
              Where do you spend the most?
            </p>

            <div className="hero-note">
              Spend mindfully
            </div>
          </div>


          <div className="cat-wrapper">
            <img
              src="/cat-money.png"
              alt="Cute cat holding money and a calculator"
              className="cat-image"
            />
          </div>

          <CurrencySelector
            label="Home currency"
            value={homeCurrency}
            onChange={setHomeCurrency}
            currencies={currencies}
          />

        </header>


        {error && (
          <div className="error">
            {error}
          </div>
        )}

        <section className="summary-grid">

          <div className="summary-card primary">
            <div className="card-label">
              TOTAL SPENT
            </div>

            <div className="total-amount">
              {homeCurrency}{" "}
              {total.toFixed(2)}
            </div>

            <div className="card-note">
              Across all your expenses
            </div>
          </div>


          <div className="summary-card">
            <div className="card-label">
              EXPENSES
            </div>

            <div className="summary-number">
              {expenses.length}
            </div>

            <div className="card-note">
              {expenses.length === 1
                ? "expense added"
                : "expenses added"}
            </div>
          </div>


          <div className="summary-card">
            <div className="card-label">
              CURRENCY
            </div>

            <div className="summary-number">
              {homeCurrency}
            </div>

            <div className="card-note">
              Your home currency
            </div>
          </div>

        </section>

        <section className="add-section">

          <div className="section-heading">
            <div>
              <span className="eyebrow">
                QUICK ADD
              </span>

              <h2>Add an expense</h2>
            </div>
          </div>


          <form
            onSubmit={handleSubmit}
            className="expense-form"
          >

            <div className="input-group title-input">
              <label htmlFor="title">
                What did you spend on?
              </label>

              <input
                id="title"
                type="text"
                placeholder="e.g. Coffee, groceries..."
                value={title}
                onChange={(e) =>
                  setTitle(e.target.value)
                }
                required
              />
            </div>


            <div className="input-group">
              <label htmlFor="amount">
                Amount
              </label>

              <input
                id="amount"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) =>
                  setAmount(e.target.value)
                }
                required
              />
            </div>

            <CurrencySelector
              label="Currency"
              value={currency}
              onChange={setCurrency}
              currencies={currencies}
            />


            <button
              className="add-button"
              type="submit"
            >
              Add expense
            </button>

          </form>

        </section>

        <section className="expenses-section">

          <div className="section-heading">
            <div>
              <span className="eyebrow">
                YOUR SPENDING
              </span>

              <h2>Recent expenses</h2>
            </div>

            {expenses.length > 0 && (
              <span className="expense-count">
                {expenses.length}
              </span>
            )}
          </div>


          {conversionLoading ? (
            <p>
              Converting your expenses...
            </p>
          ) : convertedExpenses.length ===
            0 ? (
            <div className="empty-state">

              <div className="empty-icon">
                —
              </div>

              <h3>
                No expenses yet
              </h3>

              <p>
                Add your first expense above
                and it'll appear here.
              </p>

            </div>
          ) : (

            <div className="expense-list">

              {convertedExpenses.map(
                (expense) => (

                  <div
                    className="expense-item"
                    key={expense.id}
                  >

                    <div className="expense-icon">
                      —
                    </div>


                    <div className="expense-info">

                      <h3>
                        {expense.title}
                      </h3>

                      <p>
                        {expense.amount}{" "}
                        {expense.currency}
                      </p>

                    </div>


                    <div className="expense-amount">

                      <strong>
                        {homeCurrency}{" "}
                        {Number(
                          expense.convertedAmount
                        ).toFixed(2)}
                      </strong>

                      {expense.currency !==
                        homeCurrency && (
                        <span>
                          converted from{" "}
                          {expense.currency}
                        </span>
                      )}

                    </div>


                    <button
                      className="delete-button"
                      onClick={() =>
                        handleDelete(
                          expense.id
                        )
                      }
                      aria-label={`Delete ${expense.title}`}
                    >
                      ×
                    </button>

                  </div>

                )
              )}

            </div>

          )}

        </section>


        <footer>
          Keep track of things!
        </footer>

      </main>
    </div>
  );
}

export default App;