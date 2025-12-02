const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Course title is required'],
    trim: true,
  },
  name: {
    type: String,
    required: [true, 'Course name is required'],
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
    required: [true, 'Course image is required'],
  },
  duration: {
    type: String,
    default: 'Self-paced',
  },
  level: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Beginner',
  },
  enrolledStudents: {
    type: Number,
    default: 0,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

// Add indexes
courseSchema.index({ category: 1 });
courseSchema.index({ level: 1 });
courseSchema.index({ createdBy: 1 });

module.exports = mongoose.model('Course', courseSchema);