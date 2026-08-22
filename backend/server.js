const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());


let expenses = [];
let nextId = 1;


app.get("/", (req, res) => {
    res.json({ message: "Currency Expense API is running" });
});


app.get("/expenses", (req, res) => {
    res.status(200).json(expenses);
});


app.post("/expenses", (req, res) => {
    const { title, amount, currency } = req.body;

    const validCurrencies = ["USD", "NPR", "EUR", "INR", "GBP"];

    if (!title || typeof title !== "string" || title.trim() === "") {
        return res.status(400).json({
            error: "Title is required"
        });
    }

    if (amount === undefined || amount === null || typeof amount !== "number" || amount <= 0) {
        return res.status(400).json({
            error: "Amount must be a positive number"
        });
    }

    if (!currency || !validCurrencies.includes(currency.toUpperCase())) {
        return res.status(400).json({
            error: "Invalid currency code"
        });
    }

    const expense = {
        id: nextId++,
        title: title.trim(),
        amount,
        currency: currency.toUpperCase(),
        date: new Date().toISOString()
    };

    expenses.push(expense);

    res.status(201).json(expense);
});


app.delete("/expenses/:id", (req, res) => {
    const id = Number(req.params.id);

    const expenseIndex = expenses.findIndex(expense => expense.id === id);

    if (expenseIndex === -1) {
        return res.status(404).json({
            error: "Expense not found"
        });
    }

    expenses.splice(expenseIndex, 1);

    res.status(204).send();
});
app.get("/convert", async (req, res) => {
    const { from, to, amount } = req.query;

    // Validate the request
    if (!from || !to || !amount) {
        return res.status(400).json({
            error: "from, to, and amount are required"
        });
    }

    const numericAmount = Number(amount);

    if (isNaN(numericAmount) || numericAmount <= 0) {
        return res.status(400).json({
            error: "Amount must be a positive number"
        });
    }

    try {
        const response = await fetch(
            `https://api.frankfurter.dev/v2/rate/${from.toUpperCase()}/${to.toUpperCase()}`
        );

        if (!response.ok) {
            return res.status(502).json({
                error: "Currency conversion service unavailable"
            });
        }

        const data = await response.json();

        const convertedAmount = numericAmount * data.rate;

        res.status(200).json({
            from: from.toUpperCase(),
            to: to.toUpperCase(),
            amount: numericAmount,
            rate: data.rate,
            convertedAmount
        });

    } catch (error) {
        res.status(502).json({
            error: "Unable to connect to currency conversion service"
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});