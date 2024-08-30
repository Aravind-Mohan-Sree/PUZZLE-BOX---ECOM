const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  productName: {
    type: String,
    required: true
  },

  productPrice: {
    type: Number,
    required: true
  },

  productDescription: {
    type: String,
    required: true,
  },

  productDimension: {
    type: String,
    required: true,
  },

  productDifficultyRate: {
    type: Number,
    required: true
  },

  productQuantity: {
    type: Number,
    required: true
  },

  productCategory: {
    type: String,
    required: true,
  },

  productImage: {
    type: [String],
    required: true
  },

  productDiscount: {
    type: Number,
    default: 0
  },

  productDiscountedPrice: {
    type: Number,
  },

  isActive: {
    type: Boolean,
    default: true,
  }
}, { timestamps: true });

module.exports = mongoose.model('product', schema);