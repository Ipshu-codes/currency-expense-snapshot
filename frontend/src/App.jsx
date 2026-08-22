import { useEffect, useState } from "react";

const API_URL = "http://localhost:5000";

function App() {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("NPR");

  const [expenses, setExpenses] = useState([]);
  const [error, setError] = useState("");

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

      // Remove deleted expense from frontend
      setExpenses(
        expenses.filter((expense) => expense.id !== id)
      );
    } catch (error) {
      setError("Could not delete expense");
    }
  };

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

      <h2>Expenses</h2>

      {expenses.map((expense) => (
        <div key={expense.id}>
          <h3>{expense.title}</h3>

          <p>
            {expense.amount} {expense.currency}
          </p>

          <button onClick={() => handleDelete(expense.id)}>
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}

export default App;