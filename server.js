const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

dotenv.config();
connectDB();

const app = express();

app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:3001", "https://lanceconnect.netlify.app"],
  credentials: true
}));

// Raw body parsing for Stripe webhooks (must come before JSON parsing)
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

app.use(express.json());

// Root route
app.get("/", (req, res) => {
  res.json({
    message: "LanceConnect API is running!",
    version: "1.0.0",
    endpoints: {
      auth: "/api/auth",
      gigs: "/api/gigs",
      reviews: "/api/reviews",
      orders: "/api/orders",
      payments: "/api/payments"
    }
  });
});

app.use("/api/auth", require("./routes/auth"));
app.use("/api/gigs", require("./routes/gig"));
app.use("/api/reviews", require("./routes/review"));
app.use("/api/orders", require("./routes/order"));
app.use("/api/payments", require("./routes/payment"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));