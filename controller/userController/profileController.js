const userSchema = require('../../model/userSchema');
const categorySchema = require('../../model/categorySchema');
const productSchema = require('../../model/productSchema');

/* ------------------------ will render profile page ------------------------ */
const profile = async (req, res) => {
  const userDetails = await userSchema.findById(req.session.user);

  /* -- if by any chance, userdetails is not available, then redirect to home - */
  if (userDetails) {
    const activeCategories = await productSchema.find({
      isActive: true,
      productCategory: { $in: await categorySchema.find({ isActive: true }).select('_id') }
    })
      .populate('productCategory');

    const activeCategoryNames = Array.from(new Set(activeCategories.map(product => product.productCategory.categoryName))).sort((a, b) => a.localeCompare(b));

    res.render('user/profile', { title: 'Home', alert: req.flash('alert'), user: req.session.user, userDetails, activeCategoryNames, content: '' })
  } else {
    req.flash('alert', { message: 'An error occurred while getting user details. Try again later', color: 'bg-danger' });
    res.redirect('/home');
  }
};
/* -------------------------------------------------------------------------- */

const profilePost = async (req, res) => {

};

module.exports = {
  profile,
  profilePost
};