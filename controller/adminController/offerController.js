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

/* ---------------------------------- will update the current offer ---------------------------------- */
const editOffer = async (req, res) => {
  try {
    const { offerId, discount } = req.body;

    const offer = await offerSchema.findById(offerId);

    if (offer.offerTarget === "Category") {
      const products = await productSchema.find({
        productCategory: offer.offerCategoryId,
      });

      for (const product of products) {
        product.productDiscount = discount;

        product.productDiscountedPrice = Math.round(
          product.productPrice * (1 - discount / 100)
        );

        await product.save();
      }
    }

    if (offer.offerTarget === "Product") {
      const product = await productSchema.findById(offer.offerProductId);

      product.productDiscount = discount;

      product.productDiscountedPrice = Math.round(
        product.productPrice * (1 - discount / 100)
      );

      await product.save();
    }

    offer.offerValue = discount;

    await offer.save();

    req.flash("alert", {
      message: "Offer updated successfully!",
      color: "bg-success",
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: true });

    console.log("Error while updating the current offer", err);
  }
};
/* -------------------------------------------------------------------------- */

/* ---------------------------------- will delete the current offer ---------------------------------- */
const deleteOffer = async (req, res) => {
  try {
    const { offerId } = req.body;

    const offer = await offerSchema.findByIdAndDelete(offerId);

    if (offer.offerTarget === "Category") {
      const products = await productSchema.find({
        productCategory: offer.offerCategoryId,
      });

      for (const product of products) {
        product.productDiscount = 0;

        product.productDiscountedPrice = Math.round(
          product.productPrice * (1 - 0 / 100)
        );

        await product.save();
      }
    }

    if (offer.offerTarget === "Product") {
      const product = await productSchema.findById(offer.offerProductId);

      product.productDiscount = 0;

      product.productDiscountedPrice = Math.round(
        product.productPrice * (1 - 0 / 100)
      );

      await product.save();
    }

    req.flash("alert", {
      message: "Offer deleted successfully!",
      color: "bg-success",
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: true });

    console.log("Error while deleting the current offer", err);
  }
};
/* -------------------------------------------------------------------------- */

module.exports = {
  getOffer,
  addOffer,
  editOffer,
  deleteOffer,
};
