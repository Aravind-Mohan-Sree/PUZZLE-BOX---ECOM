const userSchema = require("../../model/userSchema");
const categorySchema = require("../../model/categorySchema");
const productSchema = require("../../model/productSchema");
const cartSchema = require("../../model/cartSchema");
const orderSchema = require("../../model/orderSchema");
const walletSchema = require("../../model/walletSchema");
const Razorpay = require("razorpay");

const getWallet = async (req, res) => {
  try {
    const wallet = await walletSchema
      .findOne({ userID: req.session.user })
      .populate("orderID.order");

    /* ---------- querying active categories for including in the navbar --------- */
    const activeCategories = await productSchema
      .find({
        isActive: true,
        productCategory: {
          $in: await categorySchema.find({ isActive: true }).select("_id"),
        },
      })
      .populate("productCategory");

    const activeCategoryNames = Array.from(
      new Set(
        activeCategories.map((product) => product.productCategory.categoryName)
      )
    ).sort((a, b) => a.localeCompare(b));

    res.render("user/wallet", {
      title: "Wallet",
      alert: req.flash("alert"),
      user: req.session.user,
      wallet,
      activeCategoryNames,
      content: "",
    });
  } catch (err) {
    console.log("Error while rendering wallet");
  }
};

module.exports = {
  getWallet,
};
