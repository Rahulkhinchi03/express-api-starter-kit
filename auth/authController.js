const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

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

    // Create user
    const user = await User.create({
      email: email.toLowerCase().trim(),
      name: name.trim(),
      password
    });

    // Generate token
    const token = generateToken(user.id, user.email);

    console.log(`✅ New user registered: ${user.email} (ID: ${user.id})`);

    res.status(201).json({
      message: 'User registered successfully',
      user: user.toSafeObject(),
      token,
      expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    });

  } catch (error) {
    if (error.message.includes('already exists')) {
      return res.status(409).json({
        error: 'User already exists',
        message: 'A user with this email already exists. Please try logging in instead.'
      });
    }

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

    // Find user
    const user = await User.findByEmail(email.toLowerCase().trim());
    if (!user) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'No account found with this email. Please register first.'
      });
    }

    // Verify password
    const isPasswordValid = await user.verifyPassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Incorrect password. Please try again.'
      });
    }

    // Update last login
    await user.updateLastLogin();

    // Generate token
    const token = generateToken(user.id, user.email);

    console.log(`✅ User logged in: ${user.email} (ID: ${user.id})`);

    res.status(200).json({
      message: 'Login successful',
      user: user.toSafeObject(),
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
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User profile could not be found'
      });
    }

    // Get user's classification count
    const classificationCount = await user.getClassificationCount();

    const userProfile = user.toSafeObject();
    userProfile.classification_count = classificationCount;

    res.status(200).json({
      user: userProfile
    });

  } catch (error) {
    console.error('Get profile error:', error.message);
    next(error);
  }
};

// Update user profile
const updateProfile = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User profile could not be found'
      });
    }

    const { name, email } = req.body;

    // Update user
    await user.update({
      name: name?.trim(),
      email: email?.toLowerCase().trim()
    });

    console.log(`✅ User profile updated: ${user.email} (ID: ${user.id})`);

    res.status(200).json({
      message: 'Profile updated successfully',
      user: user.toSafeObject()
    });

  } catch (error) {
    if (error.message.includes('already in use') || error.message.includes('already exists')) {
      return res.status(409).json({
        error: 'Email already in use',
        message: 'Another user is already using this email address'
      });
    }

    console.error('Update profile error:', error.message);
    next(error);
  }
};

// Change password
const changePassword = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User profile could not be found'
      });
    }

    const { currentPassword, newPassword } = req.body;

    // Verify current password
    const isCurrentPasswordValid = await user.verifyPassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        error: 'Invalid password',
        message: 'Current password is incorrect'
      });
    }

    // Change password
    await user.changePassword(newPassword);

    console.log(`✅ Password changed for user: ${user.email} (ID: ${user.id})`);

    res.status(200).json({
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error.message);
    next(error);
  }
};

// Regenerate API key
const regenerateApiKey = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User profile could not be found'
      });
    }

    const newApiKey = await user.regenerateApiKey();

    console.log(`✅ API key regenerated for user: ${user.email} (ID: ${user.id})`);

    res.status(200).json({
      message: 'API key regenerated successfully',
      api_key: newApiKey
    });

  } catch (error) {
    console.error('Regenerate API key error:', error.message);
    next(error);
  }
};

// Get user statistics (for admin or user dashboard)
const getUserStats = async (req, res, next) => {
  try {
    const userId = req.params.userId || req.user.userId;

    // Check if user is requesting their own stats or if they're admin
    if (userId !== req.user.userId && req.user.email !== 'admin@treblle.com') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only access your own statistics'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Get classification stats for this user
    const Classification = require('../models/Classification');
    const classificationStats = await Classification.getStats(userId);

    res.status(200).json({
      user: user.toPublicObject(),
      statistics: classificationStats
    });

  } catch (error) {
    console.error('Get user stats error:', error.message);
    next(error);
  }
};

// Get all users stats (admin only)
const getAllUsersStats = async (req, res, next) => {
  try {
    // Simple admin check - in production, implement proper role-based access
    if (req.user.email !== 'admin@treblle.com') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Admin access required'
      });
    }

    const stats = await User.getStats();

    res.status(200).json({
      statistics: stats
    });

  } catch (error) {
    console.error('Get all users stats error:', error.message);
    next(error);
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  regenerateApiKey,
  getUserStats,
  getAllUsersStats
};