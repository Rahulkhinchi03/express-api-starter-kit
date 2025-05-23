const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const fs = require('fs');
const path = require('path');

// File-based user storage
const USERS_FILE = path.join(__dirname, '../data/users.json');

// Ensure data directory exists
const dataDir = path.dirname(USERS_FILE);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Load users from file
function loadUsers() {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const data = fs.readFileSync(USERS_FILE, 'utf8');
      return new Map(Object.entries(JSON.parse(data)));
    }
  } catch (error) {
    console.error('Error loading users:', error.message);
  }
  return new Map();
}

// Save users to file
function saveUsers(users) {
  try {
    const data = JSON.stringify(Object.fromEntries(users), null, 2);
    fs.writeFileSync(USERS_FILE, data, 'utf8');
  } catch (error) {
    console.error('Error saving users:', error.message);
  }
}

// Initialize users from file
const users = loadUsers();

// Generate JWT token
const generateToken = (userId, email) => {
  return jwt.sign(
    { userId, email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
};

// Register user
const register = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array(),
        message: 'Please check your input and try again'
      });
    }

    const { email, password, name } = req.body;

    // Check if user already exists
    if (users.has(email)) {
      return res.status(409).json({
        error: 'User already exists',
        message: 'A user with this email already exists. Please try logging in instead.'
      });
    }

    // Hash password with lower salt rounds for faster registration
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const userId = Date.now().toString();
    const user = {
      id: userId,
      email,
      name,
      password: hashedPassword,
      createdAt: new Date().toISOString()
    };

    // Save user to memory and file
    users.set(email, user);
    saveUsers(users);

    // Generate token
    const token = generateToken(userId, email);

    console.log(`✅ New user registered: ${email}`);

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: userId,
        email,
        name,
        createdAt: user.createdAt
      },
      token,
      expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    });

  } catch (error) {
    console.error('Registration error:', error.message);
    next(error);
  }
};

// Login user
const login = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array(),
        message: 'Please provide valid email and password'
      });
    }

    const { email, password } = req.body;

    // Check if user exists
    const user = users.get(email);
    if (!user) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'No account found with this email. Please register first.'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Incorrect password. Please try again.'
      });
    }

    // Generate token
    const token = generateToken(user.id, email);

    console.log(`✅ User logged in: ${email}`);

    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      token,
      expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    });

  } catch (error) {
    console.error('Login error:', error.message);
    next(error);
  }
};

// Get current user profile
const getProfile = async (req, res, next) => {
  try {
    const user = users.get(req.user.email);
    
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User profile could not be found'
      });
    }

    res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    next(error);
  }
};

// Get user stats (for debugging)
const getStats = () => {
  return {
    totalUsers: users.size,
    userEmails: Array.from(users.keys()),
    storageFile: USERS_FILE
  };
};

console.log(`📊 User storage initialized: ${users.size} users loaded`);

module.exports = {
  register,
  login,
  getProfile,
  getStats
};