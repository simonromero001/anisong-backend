const express = require("express");
const router = express.Router();
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  region: 'us-west-1',
})

const HttpStatus = require("http-status-codes");
const mongoose = require("mongoose");
const Video = require("../models/Video"); // Ensure the path is correct

const bucketName = process.env.S3_BUCKET_NAME;

// Get a random video
router.get("/random-video", async (req, res) => {
  try {
    const currentVideoId = req.query.currentVideoId;
    let query = [{ $sample: { size: 1 } }];

    if (currentVideoId) {
      query.unshift({
        $match: { _id: { $ne: new mongoose.Types.ObjectId(currentVideoId) } },
      }); // Exclude the current video only if ID is provided
    }

    const video = await Video.aggregate(query);

    if (!video.length) {
      return res.status(HttpStatus.NOT_FOUND).send("No videos found");
    }

    const videoData = video[0];
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: videoData.url,
    })
    const videoUrl = getSignedUrl(s3Client, command);

    res.json({
      ...videoData,
      url: videoUrl, // Override the url with the signed URL
    });
  } catch (err) {
    console.error("Random video fetch error:", err);
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).send("Server error");
  }
});

// Check answer
router.post("/videos/:id/guess", async (req, res) => {
  try {
    const { guess } = req.body;
    if (!guess || typeof guess !== "string") {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json({ message: "Invalid guess provided" });
    }
    const video = await Video.findById(req.params.id);

    if (!video) {
      return res
        .status(HttpStatus.NOT_FOUND)
        .json({ message: "Video not found" });
    }

    const isCorrect = video.word.toLowerCase() === guess.toLowerCase();
    res.json({ correct: isCorrect });
  } catch (err) {
    console.error("Guess check error:", err);
    res
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .json({ message: "Server error" });
  }
});

module.exports = router;
