const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    offerTarget: {
      type: String,
      required: true,
      enum: ["Category", "Product"],
    },

    offerCategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "category",
    },

    offerProductId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "product",
    },

    offerValue: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("offer", schema);
