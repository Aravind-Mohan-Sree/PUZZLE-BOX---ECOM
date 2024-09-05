const productSchema = require('../../model/productSchema');
const categorySchema = require('../../model/categorySchema');

// will render user home page
const home = async (req, res) => {
  try {
    if (req.query.login) {
      req.flash('alert', { message: 'Login successful!', color: 'bg-success' });
    }

    const activeProducts = await productSchema.find({
      isActive: true,
      productCategory: {
        $in: await categorySchema.find({ isActive: true }).select('_id')
      }
    }).populate('productCategory');

    const activeCategoryNames = Array.from(new Set(activeProducts.map(product => product.productCategory.categoryName))).sort((a, b) => a.localeCompare(b));

    const latestProducts = activeProducts.sort((a, b) => b.createdAt - a.createdAt).slice(0, 4);
    const topProducts = activeProducts.sort((a, b) => a.productName.localeCompare(b.productName)).slice(0, 4);

    res.render('user/home', { title: 'Home', alert: req.flash('alert'), user: req.session.user, activeProducts, latestProducts, topProducts, activeCategoryNames, content: '' });
  } catch (err) {
    console.log('Error while rendering user home page', err);
  }
};

module.exports = {
  home,
};