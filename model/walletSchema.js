const mongoose = require("mongoose");
const voucherCodes = require("voucher-code-generator");

const transaction = new mongoose.Schema(
  {
    transactionID: {
      type: String,
    },
    reason: {
      type: String,
      enum: [
        "Order Payment",
        "Return Refund",
        "Cancellation Refund",
        "Referral Reward",
      ],
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

/* ------ pre-save middleware to generate transactionID if not provided ----- */
transaction.pre("save", function (next) {
  if (!this.transactionID) {
    this.transactionID = voucherCodes.generate({
      length: 14,
      count: 1,
      charset: voucherCodes.charset("alphanumeric"),
      prefix: "pay_",
      pattern: "##############",
    })[0];
  }
  next();
});

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
