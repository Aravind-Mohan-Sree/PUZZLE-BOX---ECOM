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
        "Cancellation Refund",
        "Return Refund",
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

/* ------ pre-save middleware to generate unique transactionID ----- */
transaction.pre("save", async function (next) {
  if (!this.transactionID) {
    let unique = false;
    let newID;

    while (!unique) {
      newID = voucherCodes.generate({
        length: 14,
        count: 1,
        charset: voucherCodes.charset("alphanumeric"),
        prefix: "T",
        pattern: "##############",
      })[0];

      const existingTransaction = await mongoose
        .model("wallet")
        .findOne({ transactionID: newID });
      if (!existingTransaction) unique = true;
    }

    this.transactionID = newID;
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
