require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const Video = require("./models/Video");
const videoRoutes = require("./routes/videos");

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000", // Change to your frontend URL in production
}));
app.use(express.json());
app.use("/videos", express.static("public/videos")); // Ensure you have the videos in a public directory
app.use("/api", videoRoutes);

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("MongoDB Connected");
    addVideo(); // Call addVideo function after connection is established
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

// Define routes
app.get("/", (req, res) => {
  res.send("Hello World!");
});

// Function to drop the database
async function dropDatabase() {
  await mongoose.connection.dropDatabase();
  console.log("Database dropped.");
}

// Function to add video documents
async function addVideo() {
  try {
    await dropDatabase();
    const video1 = await Video.create({
      url: "http://localhost:5000/videos/HanaNiNatte.mp4",
      sentence: "＿になって　ほらニヒルに笑って",
      word: "花",
      startTime: 59500,
      endTime: 64600,
    });

    const video2 = await Video.create({
      url: "http://localhost:5000/videos/HanaNiNatte.mp4",
      sentence: "その＿にぞくぞくして目が離せない",
      word: "顔",
      startTime: 64600,
      endTime: 69600,
    });

    console.log("Video added:", video1);
    console.log("Video added:", video2);
  } catch (error) {
    console.error("Error adding video:", error);
  }
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
