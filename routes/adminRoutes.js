import express from 'express';
import User from '../models/userModel.js';
import Course from '../models/courseModel.js';
import Product from '../models/productModel.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import Seller from '../models/sellerModel.js';

const router = express.Router();

// Middleware to check if user is admin
const isAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role !== 'admin')
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    next();
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ================= Dashboard Stats =================
router.get('/stats', authMiddleware, isAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalCourses = await Course.countDocuments();
    const totalProducts = await Product.countDocuments();

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

// ================= Users =================
router.get('/users', authMiddleware, isAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Fetch normal users and admins
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Fetch sellers
    const sellers = await Seller.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Add role field to sellers (so front-end can display)
    const sellersWithRole = sellers.map((seller) => ({
      ...seller,
      role: 'seller',
    }));

    // Merge users + sellers
    const allUsers = [...users, ...sellersWithRole];

    // Sort merged users by createdAt descending
    allUsers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Total count
    const totalUsersCount =
      (await User.countDocuments()) + (await Seller.countDocuments());

    // Pagination (calculate pages based on total count)
    const totalPages = Math.ceil(totalUsersCount / limit);

    // Slice the merged array for current page
    const paginatedUsers = allUsers.slice(skip, skip + limit);

    res.json({
      users: paginatedUsers,
      pagination: {
        total: totalUsersCount,
        page,
        pages: totalPages,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


router.delete('/users/:id', authMiddleware, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user._id.toString() === req.user.id)
      return res.status(400).json({ message: 'Cannot delete your own account' });

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ================= Courses =================
router.get('/courses', authMiddleware, isAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const courses = await Course.find()
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Course.countDocuments();

    res.json({
      courses,
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

router.delete('/courses/:id', authMiddleware, isAdmin, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    await Course.findByIdAndDelete(req.params.id);
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ================= Products =================
router.get('/products', authMiddleware, isAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const products = await Product.find()
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Product.countDocuments();

    res.json({
      products,
      pagination: {
        total,   // ✅ fixed from previous mistake
        page,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.delete('/products/:id', authMiddleware, isAdmin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
