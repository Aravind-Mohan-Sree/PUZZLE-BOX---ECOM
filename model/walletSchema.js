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
    amount: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      enum: ["credit", "debit"],
    },
    runningBalance: {
      type: Number,
      required: true,
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
