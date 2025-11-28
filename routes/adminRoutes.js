// routes/adminRoutes.js
import express from 'express';
import User from '../models/userModel.js';
// Import your existing auth middleware
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// Middleware to check if user is admin
const isAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    next();
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET Admin Dashboard Stats
router.get('/stats', authMiddleware, isAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    
    // If you have Course and Product models, import and count them
    // const Course = require('../models/Course');
    // const Product = require('../models/Product');
    // const totalCourses = await Course.countDocuments();
    // const totalProducts = await Product.countDocuments();
    
    const totalCourses = 0; // Replace with actual count
    const totalProducts = 0; // Replace with actual count
    
    const recentUsers = await User.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      stats: {
        totalUsers,
        totalCourses,
        totalProducts,
      },
      recentUsers,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET All Users with pagination
router.get('/users', authMiddleware, isAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments();

    res.json({
      users,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// DELETE User
router.delete('/users/:id', authMiddleware, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Don't allow deleting yourself
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET All Courses with pagination (when you have Course model)
router.get('/courses', authMiddleware, isAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Import Course model when you create it
    // const courses = await Course.find()
    //   .populate('author', 'name email')
    //   .sort({ createdAt: -1 })
    //   .skip(skip)
    //   .limit(limit);
    // const total = await Course.countDocuments();

    // Temporary response
    res.json({
      courses: [],
      pagination: {
        total: 0,
        page,
        pages: 0,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// DELETE Course (when you have Course model)
router.delete('/courses/:id', authMiddleware, isAdmin, async (req, res) => {
  try {
    // const course = await Course.findById(req.params.id);
    // if (!course) {
    //   return res.status(404).json({ message: 'Course not found' });
    // }
    // await Course.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET All Products with pagination (when you have Product model)
router.get('/products', authMiddleware, isAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Import Product model when you create it
    // const products = await Product.find()
    //   .populate('seller', 'name email')
    //   .sort({ createdAt: -1 })
    //   .skip(skip)
    //   .limit(limit);
    // const total = await Product.countDocuments();

    // Temporary response
    res.json({
      products: [],
      pagination: {
        total: 0,
        page,
        pages: 0,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// DELETE Product (when you have Product model)
router.delete('/products/:id', authMiddleware, isAdmin, async (req, res) => {
  try {
    // const product = await Product.findById(req.params.id);
    // if (!product) {
    //   return res.status(404).json({ message: 'Product not found' });
    // }
    // await Product.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;