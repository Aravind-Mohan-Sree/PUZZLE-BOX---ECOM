const productSchema = require('../../model/productSchema');
const categorySchema = require('../../model/categorySchema');
const cloudinaryDrive = require('../../services/cloudinary');

// will render admin product list
const product = async (req, res) => {
  try {
    let products;

    if (req.query.searchTerm) {
      // Use a case-insensitive regex to search for the term in the 'name' field
      const regex = new RegExp(req.query.searchTerm, 'i');

      products = await productSchema.find({ productName: regex }).populate('productCategory');
    } else {
      products = await productSchema.find().populate('productCategory');
    }

    // sorting categories based on created date
    products.sort((a, b) => b.createdAt - a.createdAt);

    res.render('admin/product', { title: 'Products', alert: req.flash('alert'), products });
  } catch (err) {
    console.log('Error while rendering admin product list', err);
  }
};

// used to active/inactive and delete products
const productPost = async (req, res) => {
  try {
    if (req.body.status || req.body.delete) {
      if (req.body.status) {
        const product = await productSchema.findById(req.body.productId);

        await productSchema.updateOne({ _id: product._id }, { isActive: product.isActive ? false : true });

        const updatedProduct = await productSchema.findById(product._id);

        res.json({ lastUpdated: updatedProduct.updatedAt, isActive: updatedProduct.isActive });
      } else {
        const product = await productSchema.findByIdAndDelete(req.body.productId);

        await cloudinaryDrive.deleteImages(product.productImage);

        req.flash('alert', { message: 'Product deleted successfully', color: 'bg-success' });

        res.json({ delete: true });
      }
    }
  } catch (err) {
    res.json({ error: true });

    console.log('Error on product post', err);
  }
};

// will render add product page
const addProduct = async (req, res) => {
  try {
    const categories = await categorySchema.find({ isActive: true });

    res.render('admin/addProduct', { title: 'Add Product', alert: req.flash('alert'), categories })
  } catch (err) {
    console.log('Error while rendering admin add product page', err);
  }
};

// will add product in database
const addProductPost = async (req, res) => {
  try {
    // check product already exist in the product collection
    const category = await categorySchema.findOne({ categoryName: req.body.productCategory });
    const checkProduct = await productSchema.findOne({ productName: req.body.productName, productCategory: category._id });

    const productDimension = req.body.length + '-' + req.body.width + '-' + req.body.height;

    // find the productDiscount Price
    let discountPrice;

    if (req.body.discount != 0) {
      discountPrice = Math.round(req.body.price * (1 - (req.body.discount) / 100));
    } else {
      discountPrice = req.body.price;
    }

    // if product not exist then product is added to collection
    if (!checkProduct) {
      // stores images to cloud using cloudinary
      const imageArray = [];

      const uploadPromises = req.files.map(async (img) => {
        try {
          const imageUrl = await cloudinaryDrive.uploadImages(img.path);

          return imageUrl;
        } catch (error) {
          console.error('Error uploading image:', error);

          return null;
        }
      });

      // Wait for all uploads to complete
      const imageUrls = await Promise.all(uploadPromises);

      imageArray.push(...imageUrls);

      const newProduct = new productSchema({
        productName: req.body.productName,
        productCategory: category._id,
        productPrice: req.body.price,
        productQuantity: req.body.stock,
        productDiscount: req.body.discount,
        productDimension,
        productDifficultyRate: req.body.difficulty,
        productDescription: req.body.description,
        productDiscountedPrice: discountPrice,
        productImage: imageArray
      })

      await newProduct.save();

      req.flash('alert', { message: 'Product added successfully', color: 'bg-success' });
    } else {
      req.flash('alert', { message: 'Product already exist', color: 'bg-danger' });
    }

    res.redirect('/admin/products');
  } catch (err) {
    console.log('Error on add product post', err);
  }
};

// will render admin edit product page 
const editProduct = async (req, res) => {
  try {
    const product = await productSchema.findById(req.query.id).populate('productCategory');

    if (product) {
      res.render('admin/editProduct', { title: "Edit Product", alert: req.flash('alert'), product })
    } else {
      req.flash('alert', { message: 'Unable to edit the product. Try again', color: 'bg-danger' });

      res.redirect('/admin/products');
    }
  } catch (err) {
    console.log(`Error during edit product page render ${err}`);
  }
};

// update the product based on the admin edit
const editProductPost = async (req, res) => {
  try {
    const { price, stock, discount, description } = req.body;

    // get the id of the product
    const productID = req.query.id;

    const product = await productSchema.findById(productID);

    // Delete images from the cloudinary
    await cloudinaryDrive.deleteImages(product.productImage);

    // stores images to cloud using cloudinary
    const imageArray = [];

    const uploadPromises = req.files.map(async (img) => {
      try {
        const imageUrl = await cloudinaryDrive.uploadImages(img.path);

        return imageUrl;
      } catch (error) {
        console.error('Error uploading image:', error);

        return null;
      }
    });

    // Wait for all uploads to complete
    const imageUrls = await Promise.all(uploadPromises);

    imageArray.push(...imageUrls);

    // find the productDiscount Price
    let discountPrice;

    if (req.body.discount != 0) {
      discountPrice = Math.round(req.body.price * (1 - (req.body.discount) / 100));
    } else {
      discountPrice = req.body.price;
    }

    // update the product using the values from form
    productSchema.findByIdAndUpdate(productID, { productPrice: price, productQuantity: stock, productDiscount: discount, productDiscountedPrice: discountPrice, productDescription: description, productImage: imageArray })
      .then((elem) => {
        req.flash('alert', { message: 'Product updated successfully', color: 'bg-success' });

        res.redirect('/admin/products');
      }).catch((err) => {
        console.log(`Error while updating the product ${err}`);

        req.flash('alert', { message: 'Product is not updated', color: 'bg-danger' });

        res.redirect('/admin/products');
      })
  } catch (err) {
    console.log(`Error during updating the product on database ${err}`);

    req.flash('alert', { message: 'Oops the action is not completed', color: 'bg-danger' });

    res.redirect('/admin/products');
  }
};

module.exports = {
  product,
  productPost,
  addProduct,
  addProductPost,
  editProduct,
  editProductPost
};