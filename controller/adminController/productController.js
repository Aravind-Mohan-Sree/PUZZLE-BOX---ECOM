const productSchema = require('../../model/productSchema');
const categorySchema = require('../../model/categorySchema');

// will render admin product list
const product = async (req, res) => {
  try {
    const products = await productSchema.find();
    
    res.render('admin/product', { title: 'Products', alert: req.flash('alert'), products })
  } catch (err) {
    console.log('Error while rendering admin product list', err);
  }
};

// will render add product page
const addProduct = async (req, res) => {
  try {  
    const categories = await categorySchema.find({isActive: true});

    res.render('admin/addProduct', { title: 'Add Product', alert: req.flash('alert'), categories })
  } catch (err) {
    console.log('Error while rendering admin product list', err);
  }
};

module.exports = {
  product,
  addProduct,
};