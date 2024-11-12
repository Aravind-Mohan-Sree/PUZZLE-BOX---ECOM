const categorySchema = require("../../model/categorySchema");
const productSchema = require("../../model/productSchema");
const offerSchema = require("../../model/offerSchema");
const voucherCodes = require("voucher-code-generator");

/* ---------------------------------- will render the offer page ---------------------------------- */
const getOffer = async (req, res) => {
  try {
    const offers = await offerSchema.aggregate([
      { $match: {} },
      { $sort: { createdAt: -1 } },
    ]);

    /* ----------------------- querying active products ----------------------- */
    const activeProducts = await productSchema
      .find({
        isActive: true,
        productCategory: {
          $in: await categorySchema.find({ isActive: true }).select("_id"),
        },
      })
      .sort({ createdAt: -1 })
      .populate("productCategory");

    /* ----------------------- querying active categories ----------------------- */
    const activeCategories = Array.from(
      new Set(activeProducts.map((product) => product.productCategory))
    ).sort((a, b) => b.createdAt - a.createdAt);

    res.render("admin/offer", {
      title: "Offers",
      alert: req.flash("alert"),
      activeCategories,
      activeProducts,
      offers,
    });
  } catch (err) {
    console.log("Error while rendering the offer page", err);
  }
};
/* -------------------------------------------------------------------------- */

/* ---------------------------------- will ---------------------------------- */
const addOffer = (req, res) => {
  try {
  } catch (err) {
    console.log();
  }
};
/* -------------------------------------------------------------------------- */

/* ---------------------------------- will ---------------------------------- */
const editOffer = (req, res) => {
  try {
  } catch (err) {
    console.log();
  }
};
/* -------------------------------------------------------------------------- */

/* ---------------------------------- will ---------------------------------- */
const deleteOffer = (req, res) => {
  try {
  } catch (err) {
    console.log();
  }
};
/* -------------------------------------------------------------------------- */

module.exports = {
  getOffer,
  addOffer,
  editOffer,
  deleteOffer,
};
