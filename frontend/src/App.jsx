import { useEffect, useState } from "react";
import "./index.css";

const API_URL = "http://localhost:5000";

const currencies = ["NPR", "USD", "EUR", "INR", "GBP"];

function App() {
  const [homeCurrency, setHomeCurrency] = useState("NPR");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("NPR");

  const [expenses, setExpenses] = useState([]);
  const [convertedExpenses, setConvertedExpenses] = useState([]);
  const [conversionLoading, setConversionLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch expenses when app loads
  useEffect(() => {
    fetch(`${API_URL}/expenses`)
      .then((response) => response.json())
      .then((data) => {
        setExpenses(data);
      })
      .catch(() => {
        setError("Could not connect to backend");
      });
  }, []);

  // Add expense
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch(`${API_URL}/expenses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          amount: Number(amount),
          currency,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Could not add expense");
        return;
      }

      setExpenses((previousExpenses) => [
        ...previousExpenses,
        data,
      ]);

      setTitle("");
      setAmount("");
      setCurrency("NPR");
    } catch (error) {
      setError("Could not connect to backend");
    }
  };

  // Delete expense
  const handleDelete = async (id) => {
    try {
      const response = await fetch(`${API_URL}/expenses/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete expense");
      }

      setExpenses((previousExpenses) =>
        previousExpenses.filter((expense) => expense.id !== id)
      );
    } catch (error) {
      setError("Could not delete expense");
    }
  };

  // Convert all expenses to home currency
  const convertExpenses = async () => {
    setConversionLoading(true);
    setError("");

    try {
      const converted = await Promise.all(
        expenses.map(async (expense) => {
          if (expense.currency === homeCurrency) {
            return {
              ...expense,
              convertedAmount: expense.amount,
            };
          }

          const response = await fetch(
            `${API_URL}/convert?from=${expense.currency}&to=${homeCurrency}&amount=${expense.amount}`
          );

          const data = await response.json();

          if (!response.ok) {
            throw new Error(
              data.error || "Currency conversion failed"
            );
          }

          return {
            ...expense,
            convertedAmount: data.convertedAmount,
          };
        })
      );

      setConvertedExpenses(converted);
    } catch (error) {
      setError("Could not convert expenses");
    } finally {
      setConversionLoading(false);
    }
  };

  // Convert whenever expenses or home currency changes
  useEffect(() => {
    if (expenses.length > 0) {
      convertExpenses();
    } else {
      setConvertedExpenses([]);
    }
  }, [expenses, homeCurrency]);

  // Calculate total
  const total = convertedExpenses.reduce(
    (sum, expense) =>
      sum + Number(expense.convertedAmount),
    0
  );

  return (
    <div className="app">
      <main className="container">

        {/* HERO */}
        <header className="hero">
          <div className="hero-content">
            <div className="brand">
              <span>CURRENCY-EXPENSE-SNAPSHOT</span>
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

          <div className="currency-picker">
            <label htmlFor="homeCurrency">
              Home currency
            </label>

            <select
              id="homeCurrency"
              value={homeCurrency}
              onChange={(e) =>
                setHomeCurrency(e.target.value)
              }
            >
              {currencies.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
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
              {homeCurrency} {total.toFixed(2)}
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

            <div className="input-group">
              <label htmlFor="currency">
                Currency
              </label>

              <select
                id="currency"
                value={currency}
                onChange={(e) =>
                  setCurrency(e.target.value)
                }
              >
                {currencies.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <button
              className="add-button"
              type="submit"
            >
              Add expense
            </button>

          </form>
        </section>

        {/* EXPENSE LIST */}
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
          ) : convertedExpenses.length === 0 ? (
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

              {convertedExpenses.map((expense) => (
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

                    {expense.currency !== homeCurrency && (
                      <span>
                        converted from{" "}
                        {expense.currency}
                      </span>
                    )}

                  </div>

                  <button
                    className="delete-button"
                    onClick={() =>
                      handleDelete(expense.id)
                    }
                    aria-label={`Delete ${expense.title}`}
                  >
                    ×
                  </button>

                </div>
              ))}

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