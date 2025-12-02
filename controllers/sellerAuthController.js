import Seller from '../models/sellerModel.js';
import asyncHandler from 'express-async-handler';
import jwt from 'jsonwebtoken';

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// =========================
//   REGISTER SELLER
// =========================
export const registerSeller = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    password,
    confirmPassword,
    phone,
    institutionName,
    address,
  } = req.body;

  // Required fields check
  if (!name || !email || !password || !confirmPassword || !phone || !institutionName) {
    res.status(400);
    throw new Error('Please fill all required fields');
  }

  // *** EDU EMAIL CHECK ***
  if (!email.endsWith('@edu.com')) {
    res.status(400);
    throw new Error('Email must be an institutional @edu.com email');
  }

  // Password match check
  if (password !== confirmPassword) {
    res.status(400);
    throw new Error('Passwords do not match');
  }

  // Check if seller exists
  const sellerExists = await Seller.findOne({ email });
  if (sellerExists) {
    res.status(400);
    throw new Error('Seller with this email already exists');
  }

  // Create seller
  const seller = await Seller.create({
    name,
    email,
    password,
    phone,
    institutionName,
    address,
  });

  // Response
  res.status(201).json({
  success: true,
  message: 'Seller registered successfully',
  data: {
    token: generateToken(seller._id),
    seller: {
      _id: seller._id,
      name: seller.name,
      email: seller.email,
      phone: seller.phone,
      institutionName: seller.institutionName,
      address: seller.address,
      isVerified: seller.isVerified,
      isActive: seller.isActive,
    }
  }
});
});

// =========================
//   LOGIN SELLER
// =========================
export const loginSeller = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Required fields
  if (!email || !password) {
    res.status(400);
    throw new Error('Please provide email and password');
  }

  // *** EDU EMAIL CHECK ***
  if (!email.endsWith('@edu.com')) {
    res.status(400);
    throw new Error('Only @edu.com institutional emails are allowed');
  }

  // Find seller
  const seller = await Seller.findOne({ email });
  if (!seller) {
    res.status(400);
    throw new Error('Invalid email or password');
  }

  // Validate password
  const isMatch = await seller.matchPassword(password);
  if (!isMatch) {
    res.status(400);
    throw new Error('Invalid email or password');
  }

  res.json({
  success: true,
  message: 'Login successful',
  data: {
    token: generateToken(seller._id),
    seller: {
      _id: seller._id,
      name: seller.name,
      email: seller.email,
      phone: seller.phone,
      institutionName: seller.institutionName,
      address: seller.address,
      isVerified: seller.isVerified,
      isActive: seller.isActive,
    }
  }
});
});
