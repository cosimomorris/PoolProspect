// server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const connectDB = require('./config/database');
const User = require('./models/User');
const Lead = require('./models/Lead');
const { sendEmail, testLeadEmail } = require('./utils/emailService');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Middleware for JWT verification
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is running' });
});

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// Auth routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user
    const user = new User({
      name,
      email,
      password
    });

    await user.save();

    // Generate token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(201).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({ message: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const validPassword = await user.comparePassword(password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      user: {
        id: user._id,
        email: user.email
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(400).json({ message: error.message });
  }
});

// Protected route example
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Lead routes
app.post('/api/leads/bulk', authenticateToken, async (req, res) => {
  try {
    const { leads, emailInterval } = req.body;
    const leadDocs = leads.map(email => ({
      email,
      emailInterval: emailInterval || 10
    }));

    await Lead.insertMany(leadDocs);
    res.status(201).json({ message: 'Leads imported successfully' });
  } catch (error) {
    console.error('Lead import error:', error);
    res.status(400).json({ message: error.message });
  }
});

app.get('/api/leads', authenticateToken, async (req, res) => {
  try {
    const leads = await Lead.find();
    res.json(leads);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Test route to add a lead and send immediate email
app.post('/api/test-lead-email', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const result = await testLeadEmail(email);
    res.json({
      message: 'Test lead created and email sent',
      lead: result.lead,
      emailSent: result.emailSent
    });
  } catch (error) {
    console.error('Test lead email route error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Test email route
app.post('/api/test-email', async (req, res) => {
  try {
    const result = await sendEmail(
      'cosimobusiness1@gmail.com',
      'Test Email',
      '<h1>Test Email</h1><p>This is a test email to verify the email service is working.</p>'
    );
    
    if (result) {
      res.json({ message: 'Test email sent successfully' });
    } else {
      res.status(500).json({ message: 'Failed to send test email' });
    }
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Test SendGrid route
app.get('/api/test-sendgrid', async (req, res) => {
  try {
    const result = await sendEmail();
    if (result) {
      res.json({ message: 'Email sent successfully!' });
    } else {
      res.status(500).json({ message: 'Failed to send email' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add this with your other lead routes
app.delete('/api/leads', authenticateToken, async (req, res) => {
  try {
    await Lead.deleteMany({});
    res.json({ message: 'All leads deleted successfully' });
  } catch (error) {
    console.error('Delete all leads error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Use the PORT provided by the hosting platform or fall back to 3001
const PORT = process.env.PORT || 3001;
const RENDER_URL = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Test endpoint: ${RENDER_URL}/api/test`);
  console.log(`Health check: ${RENDER_URL}/api/health`);
});