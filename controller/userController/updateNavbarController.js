const cartSchema = require('../../model/cartSchema');

/* --------------------------- for updating navbar -------------------------- */
const updateNavbarPost = async (req, res) => {
  try {
    const cart = await cartSchema
      .findOne({ userID: req.session.user })
      .populate("items.productID");

    res.json({ cart });
  } catch (err) {
    console.log('Error on update navbar post', err);
  }
};
/* -------------------------------------------------------------------------- */

module.exports = {
  updateNavbarPost,
};