const userSchema = require('../../model/userSchema');
const categorySchema = require('../../model/categorySchema');
const productSchema = require('../../model/productSchema');
const cartSchema = require('../../model/cartSchema');

/* ------------------- will render the order confirm page ------------------- */
const orderConfirmation = (req, res) => {
  try {
    res.render('user/orderConfirmation', { title: "Order confirmed" })
  } catch (err) {
    console.log('Error on rendering the confirm order tick page', err);
  }
}
/* -------------------------------------------------------------------------- */

/* ---------------------- will render the checkout page --------------------- */
const checkout = async (req, res) => {
  try {
    /* ---------------------- finding current user address ---------------------- */
    const userAddress = await userSchema.findById(req.session.user);

    /* ----------------- getting addresses from the user address ---------------- */
    const addresses = userAddress.address;

    const cart = await cartSchema.findOne({ userID: req.session.user }).populate("items.productID");

    /* ------------------- getting the products from the cart ------------------- */
    const products = cart.items;

    /* ---- checking whether any of the product is available or not ---- */
    for (const product of products) {
      if (product.productID.productQuantity === 0 || product.productID.productQuantity < product.productCount) {
        req.flash('alert', { message: 'One or more products is not available. Try again!', color: 'bg-danger' });

        return res.redirect('/cart');
      }
    }

    /* ---------- querying active categories for including in the navbar --------- */
    const activeCategories = await productSchema.find({
      isActive: true,
      productCategory: { $in: await categorySchema.find({ isActive: true }).select('_id') }
    })
      .populate('productCategory');

    const activeCategoryNames = Array.from(new Set(activeCategories.map(product => product.productCategory.categoryName))).sort((a, b) => a.localeCompare(b));

    res.render('user/checkout', {
      title: 'Checkout',
      alert: req.flash('alert'),
      cart,
      products,
      userAddress,
      addresses,
      user: req.session.user,
      activeCategoryNames,
      content: ''
    });
  } catch (err) {
    console.log('Error on rendering the checkout page', err);
  }
}
/* -------------------------------------------------------------------------- */

module.exports = {
  orderConfirmation,
  checkout,
};