const userSchema = require("../../model/userSchema");
const categorySchema = require("../../model/categorySchema");
const productSchema = require("../../model/productSchema");
const orderSchema = require("../../model/orderSchema");
// const reviewSchema = require("../../model/reviewSchema");

/* ----------------------- will render the order page ----------------------- */
const order = async (req, res) => {
  try {
    /* -------------------------- pagination parameters ------------------------- */
    const productsPerPage = 5;
    const currentPage = parseInt(req.query.page) || 1;
    const skip = (currentPage - 1) * productsPerPage;

    let orders = await orderSchema
      .find({ userID: req.session.user })
      .populate({
        path: 'products.productID',
        populate: {
          path: 'productCategory'
        }
      })      
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(productsPerPage);

    const orderCount = await orderSchema.countDocuments();

    // const paginatedOrderDetails = orderDetails.slice(skip, skip + productsPerPage);

    /* ---------- querying active categories for including in the navbar --------- */
    const activeCategories = await productSchema.find({
      isActive: true,
      productCategory: { $in: await categorySchema.find({ isActive: true }).select('_id') }
    })
      .populate('productCategory');

    const activeCategoryNames = Array.from(new Set(activeCategories.map(product => product.productCategory.categoryName))).sort((a, b) => a.localeCompare(b));

    res.render("user/orders", {
      title: "Orders",
      alert: req.flash('alert'),
      user: req.session.user,
      orders,
      pageNumber: Math.ceil(orderCount / productsPerPage),
      currentPage,
      totalPages: Math.ceil(orderCount / productsPerPage),
      orderCount,
      activeCategoryNames,
      content: ''
    });
  } catch (err) {
    console.log(`Error rendering the order page ${err}`);
  }
};
/* -------------------------------------------------------------------------- */

module.exports = {
  order,
};