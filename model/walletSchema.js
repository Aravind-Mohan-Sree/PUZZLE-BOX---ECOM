const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    userID: {
      type: String,
    },

    balance: {
      type: Number,
      default: 0,
    },

    orderID: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "order",
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("wallet", schema);