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
});

const bucketName = process.env.S3_BUCKET_NAME;

// Get a random video
router.get('/random-video', async (req, res, next) => {
  try {
    const currentVideoId = req.query.currentVideoId;

    const filter = currentVideoId ? { _id: { $ne: new mongoose.Types.ObjectId(currentVideoId) } } : {};

    const videosCount = await Video.countDocuments(filter);

    if (videosCount === 0) {
      return res.status(HttpStatus.NOT_FOUND).json({ message: 'No videos found' });
    }

    const randomSkip = Math.floor(Math.random() * videosCount);

    const query = [
      { $match: filter },
      { $skip: randomSkip },
      { $limit: 1 },
    ];

    const video = await Video.aggregate(query);

    if (!video || video.length === 0) {
      return res.status(HttpStatus.NOT_FOUND).json({ message: 'No video found' });
    }

    const videoData = video[0];
    const videoKey = videoData.url;
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: videoKey,
    });

    const videoUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    // Create a simple ETag for the video URL
    const eTag = `W/"${Buffer.from(videoUrl).toString('base64')}"`;

    // Set Cache-Control and ETag headers
    const maxAge = 604800; // 604800 seconds = 1 week
    res.setHeader('Cache-Control', `public, max-age=${maxAge}`);
    res.setHeader('ETag', eTag);
    res.setHeader('Expires', new Date(Date.now() + maxAge * 1000).toUTCString());

    // Check if the ETag matches the client's If-None-Match header
    if (req.headers['if-none-match'] === eTag) {
      return res.status(HttpStatus.NOT_MODIFIED).end();
    }

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
