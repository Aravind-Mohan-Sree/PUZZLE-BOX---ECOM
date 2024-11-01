const cartSchema = require('../../model/cartSchema');
const wishlistSchema = require('../../model/wishlistSchema');

/* --------------------------- for updating navbar -------------------------- */
const updateNavbarPost = async (req, res) => {
  try {
    const cart = await cartSchema
      .findOne({ userID: req.session.user })
      .populate("items.productID");

    const wishlist = await wishlistSchema
      .findOne({ userID: req.session.user })
      .populate("products.productID");

    res.json({ cart, wishlist });
  } catch (err) {
    console.log('Error on update navbar post', err);
  }
};
/* -------------------------------------------------------------------------- */

module.exports = {
  updateNavbarPost,
};