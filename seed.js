require("dotenv").config();
const mongoose = require("mongoose");
const Video = require("./models/Video");

mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("MongoDB Connected");
    addVideo().then(() => {
      mongoose.disconnect();
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
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
      url: "HanaNiNatte.webm",
      sentence: "＿になって　ほらニヒルに笑って",
      word: "花",
      startTime: 59500,
      endTime: 64600,
    });

    const video2 = await Video.create({
      url: "HanaNiNatte.webm",
      sentence: "その＿にぞくぞくして目が離せない",
      word: "顔",
      startTime: 64600,
      endTime: 69600,
    });

    const video3 = await Video.create({
      url: "HanaNiNatte.webm",
      sentence: "_にして守るのがいいんじゃない",
      word: "秘密",
      startTime: 25517,
      endTime: 30400,
    });

    const video4 = await Video.create({
      url: "HanaNiNatte.webm",
      sentence: "秘密にして_のがいいんじゃない",
      word: "守る",
      startTime: 25517,
      endTime: 30400,
    });

    const video5 = await Video.create({
      url: "HanaNiNatte.webm",
      sentence: "その_がくだんない",
      word: "判断",
      startTime: 38000,
      endTime: 40500,
    });

    console.log("Video added:", video1);
    console.log("Video added:", video2);
    console.log("Video added:", video3);
    console.log("Video added:", video4);
    console.log("Video added:", video5);
  } catch (error) {
    console.error("Error adding video:", error);
  }
}
