const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  productID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "product"
  },

  averageRating: {
    type: Number,
    default: 0
  },

  reviews: [
    {
      userID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user"
      },

      rating: {
        type: Number,
        enum: [1, 2, 3, 4, 5]
      },

      description: {
        type: String
      }
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('review', schema);