import express from 'express';
import Product from '../models/productModel.js';
import { protectSeller } from '../middleware/sellerAuthMiddleware.js';
import multer from 'multer';
import path from 'path';

const router = express.Router();

// =====================================
// MULTER SETUP
// =====================================
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
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) return cb(null, true);
    cb(new Error('Only image files are allowed!'));
  }
});

// =====================================
// CREATE PRODUCT
// =====================================
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
      originalPrice: parseFloat(originalPrice || price),
      category,
      image: `/uploads/products/${req.file.filename}`,
      createdBy: req.seller._id,

      // ⭐ FIX: This prevents products from showing as courses
      type: "product"
    });

    res.status(201).json({ success: true, data: product });

  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// =====================================
// GET ALL PRODUCTS (PUBLIC)
// =====================================
router.get('/', async (req, res) => {
  try {
    const products = await Product.find({ type: "product" })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: products, count: products.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// =====================================
// GET PRODUCTS BY SELLER
// =====================================
router.get('/seller/:sellerId', async (req, res) => {
  try {
    const products = await Product.find({
      createdBy: req.params.sellerId,
      type: "product" // ⭐ FIX
    })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: products,
      count: products.length
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// =====================================
// GET SINGLE PRODUCT
// =====================================
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({ success: true, data: product });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// =====================================
// UPDATE PRODUCT
// =====================================
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

    product = await Product.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    });

    res.json({ success: true, data: product });

  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// =====================================
// DELETE PRODUCT
// =====================================
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
