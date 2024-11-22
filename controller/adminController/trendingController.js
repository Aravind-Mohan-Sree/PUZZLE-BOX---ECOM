const orderSchema = require("../../model/orderSchema");

/* ----------------------- Top 10 Products Aggregation ---------------------- */
const getTopProducts = async () => {
  const topProducts = await orderSchema.aggregate([
    // Unwind the products array to work with individual products
    { $unwind: "$products" },

    // Only include valid sales (not pending, cancelled, or returned)
    {
      $match: {
        "products.status": {
          $nin: ["Pending", "Cancelled", "Pending-Return", "Returned"],
        },
      },
    },

    // Group by productID and sum quantities
    {
      $group: {
        _id: "$products.productID",
        totalQuantitySold: { $sum: "$products.quantity" },
      },
    },

    // Sort by total quantity sold in descending order
    { $sort: { totalQuantitySold: -1, _id: 1 } },

    // Limit to top 10
    { $limit: 10 },

    // Lookup to get complete product details
    {
      $lookup: {
        from: "products",
        localField: "_id",
        foreignField: "_id",
        as: "productDetails",
      },
    },

    // Unwind the productDetails array
    { $unwind: "$productDetails" },

    // Lookup to get category details
    {
      $lookup: {
        from: "categories", // Assumes the collection name for categories
        localField: "productDetails.productCategory",
        foreignField: "_id",
        as: "categoryDetails",
      },
    },

    // Unwind the category details
    { $unwind: "$categoryDetails" },

    // Project the final structure
    {
      $project: {
        _id: "$productDetails._id",
        productName: "$productDetails.productName",
        productPrice: "$productDetails.productPrice",
        productDescription: "$productDetails.productDescription",
        productDimension: "$productDetails.productDimension",
        productDifficultyRate: "$productDetails.productDifficultyRate",
        productQuantity: "$productDetails.productQuantity",
        productCategory: {
          _id: "$categoryDetails._id",
          name: "$categoryDetails.categoryName",
        },
        productImage: "$productDetails.productImage",
        productDiscount: "$productDetails.productDiscount",
        productDiscountedPrice: "$productDetails.productDiscountedPrice",
        isFeatured: "$productDetails.isFeatured",
        isActive: "$productDetails.isActive",
        totalQuantitySold: 1,
      },
    },
  ]);

  return topProducts;
};
/* -------------------------------------------------------------------------- */

/* ---------------------- Top 10 Categories Aggregation --------------------- */
const getTopCategories = async () => {
  const topCategories = await orderSchema.aggregate([
    // Unwind the products array
    { $unwind: "$products" },

    // Only include valid sales
    {
      $match: {
        "products.status": {
          $nin: ["Pending", "Cancelled", "Pending-Return", "Returned"],
        },
      },
    },

    // Lookup to get product details (to access category)
    {
      $lookup: {
        from: "products",
        localField: "products.productID",
        foreignField: "_id",
        as: "productDetails",
      },
    },

    // Unwind product details
    { $unwind: "$productDetails" },

    // Group by category and count occurrences
    {
      $group: {
        _id: "$productDetails.productCategory",
        totalOrders: { $sum: 1 },
        totalQuantitySold: { $sum: "$products.quantity" },
      },
    },

    // Lookup to get category details
    {
      $lookup: {
        from: "categories",
        localField: "_id",
        foreignField: "_id",
        as: "categoryDetails",
      },
    },

    // Unwind category details
    { $unwind: "$categoryDetails" },

    // Sort by total quantity sold
    { $sort: { totalQuantitySold: -1, _id: 1 } },

    // Limit to top 10
    { $limit: 10 },

    // Project final structure
    {
      $project: {
        _id: "$_id",
        categoryName: "$categoryDetails.categoryName",
        totalOrders: 1,
        totalQuantitySold: 1,
      },
    },
  ]);

  return topCategories;
};
/* -------------------------------------------------------------------------- */

/* ---------------------------------- will render the trending page ---------------------------------- */
const getTrending = async (req, res) => {
  try {
    const [topProducts, topCategories] = await Promise.all([
      getTopProducts(),
      getTopCategories(),
    ]);

    res.render("admin/trending", {
      title: "Trending",
      alert: req.flash("alert"),
      topProducts,
      topCategories,
    });
  } catch (err) {
    console.log("Error while rendering the trending page", err);
  }
};
/* -------------------------------------------------------------------------- */

module.exports = {
  getTrending,
};
