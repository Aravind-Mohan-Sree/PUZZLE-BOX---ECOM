const categorySchema = require("../../model/categorySchema");
const productSchema = require("../../model/productSchema");
const offerSchema = require("../../model/offerSchema");

/* ---------------------------------- will render the offer page ---------------------------------- */
const getOffer = async (req, res) => {
  try {
    const offers = await offerSchema.aggregate([
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: "categories",
          localField: "offerCategoryId",
          foreignField: "_id",
          as: "offerCategoryDetails",
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "offerProductId",
          foreignField: "_id",
          as: "offerProductDetails",
        },
      },
      {
        $unwind: {
          path: "$offerCategoryDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: "$offerProductDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
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

/* ---------------------------------- will create new offer ---------------------------------- */
const addOffer = async (req, res) => {
  try {
    const { offerTarget, id, discount } = req.body;

    if (offerTarget === "Category") {
      const offer = await offerSchema.findOne({ offerCategoryId: id });
      const products = await productSchema.find({ productCategory: id });

      if (offer) {
        return res.status(400).json({ categoryExists: true });
      }

      for (const product of products) {
        product.productDiscount = discount;

        product.productDiscountedPrice = Math.round(
          product.productPrice * (1 - discount / 100)
        );

        await product.save();
      }

      await offerSchema.create({
        offerTarget,
        offerCategoryId: id,
        offerValue: discount,
      });

      req.flash("alert", {
        message: "Offer created successfully!",
        color: "bg-success",
      });

      return res.status(200).json({ success: true });
    }

    if (offerTarget === "Product") {
      const offer = await offerSchema.findOne({ offerProductId: id });
      const product = await productSchema.findById(id);

      if (offer) {
        return res.status(400).json({ productExists: true });
      }
      console.log(id);
      product.productDiscount = discount;

      product.productDiscountedPrice = Math.round(
        product.productPrice * (1 - discount / 100)
      );

      await product.save();

      await offerSchema.create({
        offerTarget,
        offerProductId: id,
        offerValue: discount,
      });

      req.flash("alert", {
        message: "Offer created successfully!",
        color: "bg-success",
      });

      return res.status(200).json({ success: true });
    }
  } catch (err) {
    res.status(500).json({ error: true });

    console.log("Error while creating new offer", err);
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
