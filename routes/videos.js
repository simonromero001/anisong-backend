const express = require("express");
const router = express.Router();
const { GetObjectCommand, S3Client } = require("@aws-sdk/client-s3");
const HttpStatus = require("http-status-codes");
const mongoose = require("mongoose");
const Video = require("../models/Video"); // Ensure the path is correct

const s3Client = new S3Client({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  region: 'us-west-1',
});

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
    const range = req.headers.range;
    const videoSize = videoData.size; // Ensure 'size' field in videoData contains the size of the video

    let start, end;

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      start = parseInt(parts[0], 10);
      end = parts[1] ? parseInt(parts[1], 10) : videoSize - 1;
    } else {
      start = videoData.startTime || 0;
      end = videoData.endTime || videoSize - 1;
    }

    const contentLength = end - start + 1;
    const headers = {
      "Content-Range": `bytes ${start}-${end}/${videoSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": contentLength,
      "Content-Type": "video/mp4", // Change as necessary
    };

    res.writeHead(206, headers);

    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: videoData.url,
      Range: `bytes=${start}-${end}`,
    });

    const response = await s3Client.send(command);
    const stream = response.Body;

    stream.pipe(res);
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
