// backend/src/tests/testSetup.js
require('dotenv').config();
const connectDB = require('../config/database');
const emailService = require('../services/emailService');

async function testSetup() {
  try {
    // Test MongoDB connection
    await connectDB();
    console.log('MongoDB connection test successful');

    // Test email sending
    await emailService.sendTestEmail('your-test-email@example.com');
    console.log('Email test successful');

    process.exit(0);
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

testSetup();