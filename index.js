require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");

const app = express();
const videoRoutes = require("./routes/videos");

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000", // Change to your frontend URL in production
  methods: 'GET,POST',
  allowedHeaders: 'Content-Type'
}));
app.use(express.json());
app.use("/api", videoRoutes);

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("MongoDB Connected");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

// Define routes
app.get("/", (req, res) => {
  res.send("Hello World!");
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});



// Ensure necessary environment variables are set
if (!process.env.MONGODB_URI ) {
  throw new Error("Missing MONGODB_URI. Please check your .env file.");
}

if (!process.env.AWS_ACCESS_KEY_ID) {
  throw new Error("Missing AWS_ACCESS_KEY_ID. Please check your .env file.");
}

if (!process.env.AWS_SECRET_ACCESS_KEY) {
  throw new Error("Missing AWS_SECRET_ACCESS_KEY. Please check your .env file.");
}

if (!process.env.S3_BUCKET_NAME) {
  throw new Error("Missing S3_BUCKET_NAME. Please check your .env file.");
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
