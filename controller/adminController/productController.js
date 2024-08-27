const productSchema = require('../../model/productSchema');

// will render admin product list
const product = async (req, res) => {
  try {
    const products = await productSchema.find();
    
    res.render('admin/product', { title: 'Products', alert: req.flash('alert'), products })
  } catch (err) {
    console.log('Error while rendering admin product list', err);
  }
};

module.exports = {
  product,
};