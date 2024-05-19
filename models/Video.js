const mongoose = require("mongoose");

// Schema for the video
const videoSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true,
  },
  sentence: {
    type: String,
    required: true,
  },
  word: {
    type: String,
    required: true,
  },
  startTime: {
    type: Number, // or use Date if you prefer
    required: true,
  },
  endTime: {
    type: Number, // or use Date if you prefer
    required: true,
  },
});

// Create the model from the schema
const Video = mongoose.model("Video", videoSchema);

module.exports = Video;
