const mongoose = require('mongoose');

const nonceChallengeSchema = new mongoose.Schema({
  nonce: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  username: {
    type: String,
    required: false // Optional, in case we want to associate with a specific user attempt
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 300 // Auto-delete after 5 minutes (300 seconds)
  },
  used: {
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model('NonceChallenge', nonceChallengeSchema);