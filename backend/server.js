const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

let expenses = [];
let nextId = 1;

let supportedCurrencies = null;

async function getSupportedCurrencies() {
  if (supportedCurrencies) {
    return supportedCurrencies;
  }

  const response = await fetch(
    "https://api.frankfurter.dev/v2/currencies"
  );

  if (!response.ok) {
    throw new Error("Currency service unavailable");
  }

  supportedCurrencies = await response.json();

  return supportedCurrencies;
}

function isSupportedCurrency(currencyCode) {
  return supportedCurrencies.some(
    (currency) => currency.iso_code === currencyCode
  );
}



app.get("/", (req, res) => {
  res.json({
    message: "Currency Expense API is running",
  });
});


app.get("/expenses", (req, res) => {
  res.status(200).json(expenses);
});


app.post("/expenses", async (req, res) => {
  const { title, amount, currency } = req.body;

  if (!title || typeof title !== "string" || title.trim() === "") {
    return res.status(400).json({
      error: "Title is required",
    });
  }

  if (
    amount === undefined ||
    amount === null ||
    typeof amount !== "number" ||
    amount <= 0
  ) {
    return res.status(400).json({
      error: "Amount must be a positive number",
    });
  }

  try {
    await getSupportedCurrencies();
  } catch (error) {
    console.error("Currency list error:", error.message);

    return res.status(502).json({
      error: "Unable to fetch supported currencies",
    });
  }

  const expenseCurrency = currency?.toUpperCase();

  if (
    !expenseCurrency ||
    !isSupportedCurrency(expenseCurrency)
  ) {
    return res.status(400).json({
      error: "Invalid currency code",
    });
  }

  const expense = {
    id: nextId++,
    title: title.trim(),
    amount,
    currency: expenseCurrency,
    date: new Date().toISOString(),
  };

  expenses.push(expense);

  res.status(201).json(expense);
});

app.delete("/expenses/:id", (req, res) => {
  const id = Number(req.params.id);

  const expenseIndex = expenses.findIndex(
    (expense) => expense.id === id
  );

  if (expenseIndex === -1) {
    return res.status(404).json({
      error: "Expense not found",
    });
  }

  expenses.splice(expenseIndex, 1);

  res.status(204).send();
});

app.get("/currencies", async (req, res) => {
  try {
    const currencies = await getSupportedCurrencies();

    res.status(200).json(currencies);
  } catch (error) {
    console.error("Currency list error:", error.message);

    res.status(502).json({
      error: "Unable to fetch supported currencies",
    });
  }
});


app.get("/convert", async (req, res) => {
  const { from, to, amount } = req.query;

  if (!from || !to || !amount) {
    return res.status(400).json({
      error: "from, to, and amount are required",
    });
  }

  const numericAmount = Number(amount);

  if (
    Number.isNaN(numericAmount) ||
    numericAmount <= 0
  ) {
    return res.status(400).json({
      error: "Amount must be a positive number",
    });
  }

  const fromCurrency = from.toUpperCase();
  const toCurrency = to.toUpperCase();

  try {
    await getSupportedCurrencies();
  } catch (error) {
    console.error("Currency list error:", error.message);

    return res.status(502).json({
      error: "Unable to fetch supported currencies",
    });
  }

  if (
    !isSupportedCurrency(fromCurrency) ||
    !isSupportedCurrency(toCurrency)
  ) {
    return res.status(400).json({
      error: "Invalid currency code",
    });
  }

  if (fromCurrency === toCurrency) {
    return res.status(200).json({
      from: fromCurrency,
      to: toCurrency,
      amount: numericAmount,
      rate: 1,
      convertedAmount: numericAmount,
    });
  }

  try {
    const response = await fetch(
      `https://api.frankfurter.dev/v2/rate/${fromCurrency}/${toCurrency}`
    );

    if (!response.ok) {
      return res.status(502).json({
        error: "Currency conversion service unavailable",
      });
    }

    const data = await response.json();

    const convertedAmount =
      numericAmount * data.rate;

    return res.status(200).json({
      from: fromCurrency,
      to: toCurrency,
      amount: numericAmount,
      rate: data.rate,
      convertedAmount,
    });

  } catch (error) {
    console.error("Conversion error:", error.message);

    return res.status(502).json({
      error: "Unable to connect to currency conversion service",
    });
  }
});


app.listen(PORT, () => {
  console.log(
    `Server running on http://localhost:${PORT}`
  );
});