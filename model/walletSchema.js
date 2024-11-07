const mongoose = require("mongoose");

const transaction = new mongoose.Schema(
  {
    orderID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "order",
    },
    reason: {
      type: String,
      enum: ["Order Payment", "Return Refund", "Cancellation Refund"],
    },
    date: {
      type: Date,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      enum: ["credit", "debit"],
    },
  },
  { timestamps: true, _id: false }
);

const schema = new mongoose.Schema(
  {
    userID: {
      type: String,
      required: true,
    },
    balance: {
      type: Number,
      default: 0,
    },
    transactions: [transaction],
  },
  { timestamps: true }
);

module.exports = mongoose.model("wallet", schema);
