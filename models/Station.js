const mongoose = require('mongoose');

const stationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['ground_station', 'satellite'],
    required: true
  },
  location: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['online', 'offline', 'maintenance'],
    default: 'online'
  },
  lastPing: {
    type: Date,
    default: Date.now
  },
  signalStrength: {
    type: Number,
    min: 0,
    max: 100,
    default: 100
  }
});

module.exports = mongoose.model('Station', stationSchema);
