const mongoose = require("mongoose");

// Schema for the video
const videoSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^(http|https):\/\/[^ "]+$/.test(v);
      },
      message: props => `${props.value} is not a valid URL!`
    }
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
    min: [0, 'Start time must be a positive number'],
  },
  endTime: {
    type: Number, // or use Date if you prefer
    required: true,
    validate: {
      validator: function(value) {
        return value > this.startTime;
      },
      message: 'End time must be greater than start time',
    },
  },
});

// Create the model from the schema
const Video = mongoose.model("Video", videoSchema);

module.exports = Video;
