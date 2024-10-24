const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  userID: { type: String },

  products: [{
    productID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "product"
    },

    productName: {
      type: String
    },

    quantity: {
      type: Number
    },

    price: {
      type: Number
    },

    discount: {
      type: Number
    },

    productImage: {
      type: String
    },

    status: {
      type: String,
      enum: ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Pending-Return', 'Returned', 'Cancelled']
    },

    deliveryDate: {
      type: Date,
    },

    returnedDate: {
      type: Date,
    },

    reasonForCancel: {
      type: String
    },

    reasonForReturn: {
      type: String
    },

    reasonForRejection: {
      type: String
    }
  }],

  totalQuantity: {
    type: Number
  },

  totalPrice: {
    type: Number
  },

  address: {
    contactName: String,
    phone: String,
    pincode: String,
    state: String,
    city: String,
    house: String,
    area: String
  },

  paymentMethod: {
    type: String,
    required: true,
    enum: ['Cash on delivery']
  },
}, { timestamps: true })

module.exports = mongoose.model("Order", schema);