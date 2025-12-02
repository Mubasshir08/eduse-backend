import express from 'express';
import Product from '../models/productModel.js';
import { protectSeller } from '../middleware/sellerAuthMiddleware.js';
import multer from 'multer';
import path from 'path';

const router = express.Router();

// Configure multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/products/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'product-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
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

// Create product
router.post('/', protectSeller, upload.single('image'), async (req, res) => {
  try {
    const { title, name, authorName, description, price, originalPrice, category } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Product image is required' });
    }

    const product = await Product.create({
      title,
      name,
      authorName,
      description,
      price: parseFloat(price),
      originalPrice: parseFloat(originalPrice),
      category,
      image: `/uploads/products/${req.file.filename}`,
      createdBy: req.seller._id,
    });

    res.status(201).json({ success: true, data: product });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Get all products
router.get('/', async (req, res) => {
  try {
    const { category, minPrice, maxPrice, search } = req.query;
    let query = {};

    if (category) query.category = category;
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

    const products = await Product.find(query).populate('createdBy', 'name email').sort({ createdAt: -1 });
    res.json({ success: true, count: products.length, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get single product
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('createdBy', 'name email');
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update product
router.put('/:id', protectSeller, upload.single('image'), async (req, res) => {
  try {
    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (product.createdBy.toString() !== req.seller._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const updateData = {
      title: req.body.title || product.title,
      name: req.body.name || product.name,
      authorName: req.body.authorName || product.authorName,
      description: req.body.description || product.description,
      price: req.body.price ? parseFloat(req.body.price) : product.price,
      originalPrice: req.body.originalPrice ? parseFloat(req.body.originalPrice) : product.originalPrice,
      category: req.body.category || product.category,
    };

    if (req.file) {
      updateData.image = `/uploads/products/${req.file.filename}`;
    }

    product = await Product.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Delete product
router.delete('/:id', protectSeller, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (product.createdBy.toString() !== req.seller._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await product.deleteOne();
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;