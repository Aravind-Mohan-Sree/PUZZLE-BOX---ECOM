const categorySchema = require("../../model/categorySchema");
const productSchema = require("../../model/productSchema");
const walletSchema = require("../../model/walletSchema");

const getWallet = async (req, res) => {
  try {
    const wallet = await walletSchema.aggregate([
      {
        $match: { userID: req.session.user },
      },
      {
        $addFields: {
          transactions: {
            $sortArray: { input: "$transactions", sortBy: { createdAt: -1 } },
          },
        },
      },
      {
        $unwind: "$transactions",
      },
      {
        $lookup: {
          from: "orders",
          localField: "transactions.orderID",
          foreignField: "_id",
          as: "transactions.orderDetails",
        },
      },
      {
        $unwind: "$transactions.orderDetails",
      },
      {
        $group: {
          _id: "$_id",
          userID: { $first: "$userID" },
          balance: { $first: "$balance" },
          transactions: { $push: "$transactions" },
        },
      },
    ]);

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
    console.log("Error while rendering wallet", err);
  }
};

module.exports = {
  getWallet,
};
