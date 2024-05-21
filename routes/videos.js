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

    const videosCount = await Video.countDocuments({
      _id: currentVideoId ? { $ne: new mongoose.Types.ObjectId(currentVideoId) } : {},
    });

    if (videosCount === 0) {
      return res.status(HttpStatus.NOT_FOUND).send('No videos found');
    }

    const randomSkip = Math.floor(Math.random() * videosCount);

    let query = [
      { $match: currentVideoId ? { _id: { $ne: new mongoose.Types.ObjectId(currentVideoId) } } : {} },
      { $skip: randomSkip },
      { $sample: { size: 1 } },
    ];

    const video = await Video.aggregate(query);

    if (!video.length) {
      return res.status(HttpStatus.NOT_FOUND).send('No videos found');
    }

    res.json(video[0]);
  } catch (err) {
    console.error('Random video fetch error:', err);
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).send('Server error');
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
