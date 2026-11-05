const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');
const db = require('../db');

/**
 * Register a new customer
 */
async function register(req, res, next) {
  try {
    const { fullName, phone, email, password } = req.body;

    if (!fullName || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Full name, phone number, and password are required.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    }

    // Check if phone or email already registered
    const existing = db.findUserByIdentifier(phone) || (email ? db.findUserByIdentifier(email) : null);
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'An account with this phone number or email already exists.',
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = db.createUser({
      fullName: fullName.trim(),
      phone: phone.trim(),
      email: email ? email.trim().toLowerCase() : null,
      passwordHash,
      role: 'CUSTOMER',
    });

    const token = jwt.sign(
      { id: user.id, fullName: user.fullName, phone: user.phone, role: user.role },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    return res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        phone: user.phone,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Login customer with phone/email and password
 */
async function login(req, res, next) {
  try {
    const { loginIdentifier, password } = req.body;

    if (!loginIdentifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Phone number or email and password are required.',
      });
    }

    const user = db.findUserByIdentifier(loginIdentifier);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. User not found.',
      });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Incorrect password.',
      });
    }

    const token = jwt.sign(
      { id: user.id, fullName: user.fullName, phone: user.phone, role: user.role },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        phone: user.phone,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get current authenticated user profile
 */
async function getProfile(req, res, next) {
  try {
    const user = db.findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found.',
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        fullName: user.fullName,
        phone: user.phone,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register,
  login,
  getProfile,
};

