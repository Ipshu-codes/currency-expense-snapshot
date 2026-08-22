import { useEffect, useState } from "react";

const API_URL = "http://localhost:5000";

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
          title: title,
          amount: Number(amount),
          currency: currency,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error);
        return;
      }

      setExpenses([...expenses, data]);

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

      setExpenses(
        expenses.filter((expense) => expense.id !== id)
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
          // No API call needed if currencies are the same
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
    (sum, expense) => sum + expense.convertedAmount,
    0
  );

  return (
    <div>
      <h1>Currency & Expense Snapshot</h1>

      <h2>Add Expense</h2>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Expense title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <input
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
        >
          <option value="NPR">NPR</option>
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
          <option value="INR">INR</option>
          <option value="GBP">GBP</option>
        </select>

        <button type="submit">Add Expense</button>
      </form>

      {error && <p>{error}</p>}

      <h2>Home Currency</h2>

      <select
        value={homeCurrency}
        onChange={(e) => setHomeCurrency(e.target.value)}
      >
        <option value="NPR">NPR</option>
        <option value="USD">USD</option>
        <option value="EUR">EUR</option>
        <option value="INR">INR</option>
        <option value="GBP">GBP</option>
      </select>

      <h2>Expenses</h2>

      {conversionLoading && <p>Converting expenses...</p>}

      {!conversionLoading &&
        convertedExpenses.map((expense) => (
          <div key={expense.id}>
            <h3>{expense.title}</h3>

            <p>
              Original: {expense.amount} {expense.currency}
            </p>

            <p>
              Converted:{" "}
              {Number(expense.convertedAmount).toFixed(2)}{" "}
              {homeCurrency}
            </p>

            <button onClick={() => handleDelete(expense.id)}>
              Delete
            </button>
          </div>
        ))}

      <h2>
        Total: {total.toFixed(2)} {homeCurrency}
      </h2>
    </div>
  );
}

export default App;