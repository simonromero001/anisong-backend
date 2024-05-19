require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const Video = require("./models/Video");
const videoRoutes = require("./routes/videos");

// Middleware
app.use(
  cors({
    origin: "http://localhost:3000", // Change to your frontend URL in production
  })
);
app.use(express.json());
app.use("/videos", express.static("public/videos"));
app.use("/api", videoRoutes);

// MongoDB Connection
// Connect to MongoDB without deprecated options
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected");
    // Call the addVideo function here, after the connection is established
    addVideo();
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

// Define routes
app.get("/", (req, res) => {
  res.send("Hello World!");
});

async function dropDatabase() {
  await mongoose.connection.dropDatabase();
  console.log("Database dropped.");
}

// Function to add a video document
async function addVideo() {
  try {
    dropDatabase();
    const video = await Video.create({
      url: "http://localhost:5000/videos/HanaNiNatte.mp4",
      sentence: "＿になって　ほらニヒルに笑って",
      word: "花",
      startTime: 59500, // startTime in milliseconds (e.g., 10 seconds)
      endTime: 64600,
    });

    const video2 = await Video.create({
        url: "http://localhost:5000/videos/HanaNiNatte.mp4",
        sentence: "その＿にぞくぞくして目が離せない",
        word: "顔",
        startTime: 64600, // startTime in milliseconds (e.g., 10 seconds)
        endTime: 69600,
      });
    console.log("Video added:", video);
    console.log("Video2 added:", video2);
  } catch (error) {
    console.error("Error adding video:", error);
  }
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
