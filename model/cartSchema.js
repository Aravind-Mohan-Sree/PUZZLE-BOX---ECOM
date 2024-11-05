const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  productID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'product'
  },

  productCount: {
    type: Number,
  },

  productPrice: {
    type: Number,
  }
}, { _id: false, timestamps: true });

const cartSchema = new mongoose.Schema({
  userID: {
    type: String,
    required: true
  },

  items: [itemSchema],

  payableAmount: {
    type: Number,
    default: 0
  },

  totalPrice: {
    type: Number,
    default: 0
  },

  coupon: {
    type: {
      name: { type: String },
      code: { type: String },
      discount: { type: Number },
      minPurchase: { type: Number },
      expiryDate: { type: Date }
    },
    _id: false
  }
});

module.exports = mongoose.model('cart', cartSchema);