const userSchema = require('../../model/userSchema');
const productSchema = require('../../model/productSchema');
const categorySchema = require('../../model/categorySchema');

// will render user home page
const home = async (req, res) => {
  try {
    if (req.query.login) {
      req.flash('alert', { message: 'Login successful!', color: 'bg-success' });
    }

    const products = await productSchema.find({ isActive: true })
      .populate({
        path: 'productCategory',
        match: { isActive: true }
      })

    const activeProducts = products.filter(product => product.productCategory !== null);
      
    const latestProducts = activeProducts.sort((a, b) => b.createdAt - a.createdAt).slice(0, 4);
    const topProducts = activeProducts.sort((a, b) => a.productName - b.productName).slice(0, 4);

    res.render('user/home', { title: 'Home', alert: req.flash('alert'), user: req.session.user, latestProducts, topProducts });
  } catch (err) {
    console.log('Error while rendering user home page', err);
  }
};

module.exports = {
  home,
};