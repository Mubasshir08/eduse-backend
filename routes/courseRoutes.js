import express from 'express';
import Course from '../models/courseModel.js';
import { protectSeller } from '../middleware/sellerAuthMiddleware.js';
import multer from 'multer';
import path from 'path';

const router = express.Router();

// ==============================
// MULTER CONFIG
// ==============================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/courses/');
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'course-' + unique + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (mime && ext) return cb(null, true);
    cb(new Error('Only image files are allowed!'));
  }
});

// ==============================
// CREATE COURSE
// ==============================
router.post('/', protectSeller, upload.single('image'), async (req, res) => {
  try {
    const { title, name, authorName, description, price, originalPrice, category } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Course image is required' });
    }

    const course = await Course.create({
      title,
      name,
      authorName,
      description,
      price: parseFloat(price),
      originalPrice: parseFloat(originalPrice || price),
      category,
      image: `/uploads/courses/${req.file.filename}`,
      createdBy: req.seller._id,
      type: "course"
    });

    res.status(201).json({ success: true, data: course });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// ==============================
// GET ALL COURSES
// ==============================
router.get('/', async (req, res) => {
  try {
    const courses = await Course.find()
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: courses.length, data: courses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==============================
// GET COURSES BY SELLER ID
// ==============================
router.get('/seller/:sellerId', async (req, res) => {
  try {
    const courses = await Course.find({
      createdBy: req.params.sellerId,
      type: "course"
    })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: courses, count: courses.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==============================
// GET SINGLE COURSE
// ==============================
router.get('/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    res.json({ success: true, data: course });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==============================
// UPDATE COURSE
// ==============================
router.put('/:id', protectSeller, upload.single('image'), async (req, res) => {
  try {
    let course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    if (course.createdBy.toString() !== req.seller._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const updateData = {
      title: req.body.title || course.title,
      name: req.body.name || course.name,
      authorName: req.body.authorName || course.authorName,
      description: req.body.description || course.description,
      price: req.body.price ? parseFloat(req.body.price) : course.price,
      originalPrice: req.body.originalPrice ? parseFloat(req.body.originalPrice) : course.originalPrice,
      category: req.body.category || course.category
    };

    if (req.file) {
      updateData.image = `/uploads/courses/${req.file.filename}`;
    }

    course = await Course.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });

    res.json({ success: true, data: course });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// ==============================
// DELETE COURSE
// ==============================
router.delete('/:id', protectSeller, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    if (course.createdBy.toString() !== req.seller._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await course.deleteOne();
    res.json({ success: true, message: 'Course deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
