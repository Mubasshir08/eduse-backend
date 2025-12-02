import express from 'express';
import Course from '../models/courseModel.js';
import { protectSeller } from '../middleware/sellerAuthMiddleware.js';
import multer from 'multer';
import path from 'path';

const router = express.Router();

// Configure multer
const storage2 = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/courses/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'course-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload2 = multer({
  storage: storage2,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed!'));
  }
});

// Create course
router.post('/', protectSeller, upload2.single('image'), async (req, res) => {
  try {
    const { title, name, authorName, description, price, originalPrice, category, duration, level } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Course image is required' });
    }

    const course = await Course.create({
      title,
      name,
      authorName,
      description,
      price: parseFloat(price),
      originalPrice: parseFloat(originalPrice),
      category,
      image: `/uploads/courses/${req.file.filename}`,
      duration,
      level,
      createdBy: req.seller._id,
    });

    res.status(201).json({ success: true, data: course });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Get all courses
router.get('/', async (req, res) => {
  try {
    const { category, level, minPrice, maxPrice, search } = req.query;
    let query = {};

    if (category) query.category = category;
    if (level) query.level = level;
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const courses = await Course.find(query).populate('createdBy', 'name email').sort({ createdAt: -1 });
    res.json({ success: true, count: courses.length, data: courses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get single course
router.get('/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate('createdBy', 'name email');
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    res.json({ success: true, data: course });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update course
router.put('/:id', protectSeller, upload2.single('image'), async (req, res) => {
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
      category: req.body.category || course.category,
      duration: req.body.duration || course.duration,
      level: req.body.level || course.level,
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

// Delete course
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

// Enroll in course
router.post('/:id/enroll', protectSeller, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    course.enrolledStudents += 1;
    await course.save();

    res.json({ success: true, message: 'Successfully enrolled', data: course });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;