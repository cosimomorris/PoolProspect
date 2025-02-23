const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'completed'],
    default: 'active'
  },
  lastContactedAt: Date,
  emailInterval: {
    type: Number,
    required: true,
    default: 10, // Number of minutes between emails
    validate: {
      validator: Number.isInteger,
      message: 'Email interval must be a whole number of minutes'
    }
  }
}, {
  timestamps: true
});

const Lead = mongoose.model('Lead', leadSchema);
module.exports = Lead;