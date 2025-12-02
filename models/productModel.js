const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Product title is required'],
    trim: true,
  },
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
  },
  authorName: {
    type: String,
    required: [true, 'Author name is required'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative'],
  },
  originalPrice: {
    type: Number,
    required: [true, 'Original price is required'],
    min: [0, 'Original price cannot be negative'],
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true,
  },
  image: {
    type: String,
    required: [true, 'Product image is required'],
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

// Add index for better query performance
productSchema.index({ category: 1 });
productSchema.index({ createdBy: 1 });

module.exports = mongoose.model('Product', productSchema);