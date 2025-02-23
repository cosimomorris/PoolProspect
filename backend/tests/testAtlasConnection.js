// backend/src/tests/testAtlasConnection.js
require('dotenv').config({ path: '.env.production' });
const connectDB = require('../config/database');

async function testAtlasConnection() {
  try {
    await connectDB();
    console.log('Successfully connected to MongoDB Atlas!');
    
    // Test basic operations
    const { User } = require('../models');
    const testUser = new User({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    });
    
    await testUser.save();
    console.log('Successfully wrote to database!');
    
    await User.findOneAndDelete({ email: 'test@example.com' });
    console.log('Successfully deleted test data!');
    
    process.exit(0);
  } catch (error) {
    console.error('Connection test failed:', error);
    process.exit(1);
  }
}

testAtlasConnection();