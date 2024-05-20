const express = require("express");
const router = express.Router();
const { GetObjectCommand, S3Client } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const HttpStatus = require("http-status-codes");
const mongoose = require("mongoose");
const Video = require("../models/Video"); // Ensure the path is correct


const s3Client = new S3Client({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  region: 'us-west-1',
  //endpoint: `https://s3-accelerate.amazonaws.com`,
});

// Get a random video
router.get('/random-video', async (req, res, next) => {
  try {
    const currentVideoId = req.query.currentVideoId;
    let query = [{ $sample: { size: 1 } }];

    if (currentVideoId) {
      query.unshift({
        $match: { _id: { $ne: new mongoose.Types.ObjectId(currentVideoId) } },
      });
    }

    const video = await Video.aggregate(query);

    if (!video.length) {
      return res.status(HttpStatus.NOT_FOUND).json({ message: 'No videos found' });
    }

    const videoData = video[0];
    const videoKey = videoData.url;

    const command = new GetObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: videoKey,
      Expires: 3600, // 1 hour
    });

    const videoUrl = await getSignedUrl(s3Client, command);

    // Set Cache-Control header to cache the video for one week
    res.setHeader('Cache-Control', 'public, max-age=604800'); // 604800 seconds = 1 week

    res.json({
      ...videoData,
      url: videoUrl,
    });
  } catch (err) {
    next(err); // Pass the error to the error handling middleware
  }
});

// Check answer
router.post('/videos/:id/guess', async (req, res, next) => {
  try {
    const { guess } = req.body;

    if (!guess || typeof guess !== 'string') {
      return res.status(HttpStatus.BAD_REQUEST).json({ message: 'Invalid guess provided' });
    }

    const video = await Video.findById(req.params.id);

    if (!video) {
      return res.status(HttpStatus.NOT_FOUND).json({ message: 'Video not found' });
    }

    const isCorrect = video.word.toLowerCase() === guess.toLowerCase();
    res.json({ correct: isCorrect });
  } catch (err) {
    next(err); // Pass the error to the error handling middleware
  }
});

// Error handling middleware
router.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal Server Error' });
});

module.exports = router;
