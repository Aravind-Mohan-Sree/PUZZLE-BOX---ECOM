const productSchema = require('../../model/productSchema');
const categorySchema = require('../../model/categorySchema');
const cloudinaryUpload = require('../../services/cloudinary');

// will render admin product list
const product = async (req, res) => {
  try {
    let products;

    if (req.query.searchTerm) {
      // Use a case-insensitive regex to search for the term in the 'name' field
      const regex = new RegExp(req.query.searchTerm, 'i');

      products = await productSchema.find({ productName: regex });
    } else {
      products = await productSchema.find();
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
        await productSchema.findByIdAndDelete(req.body.productId);

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
    const checkProduct = await productSchema.findOne({
      $or: [
        { productName: req.body.productName },
        { productCategory: req.body.productCategory }
      ]
    });    

    const productDimension = req.body.length + '-' + req.body.width + '-' + req.body.height;

    // find the productDiscount Price
    let discountPrice;

    if (req.body.discount != 0) {
      discountPrice = req.body.price * (1 - (req.body.discount) / 100)
    } else {
      discountPrice = req.body.price;
    }

    // if product not exist then product is added to collection
    if (!checkProduct) {
      const imageArray = [];

      // stores images to cloud using cloudinary
      const uploadPromises = req.files.map(async (img) => {
        try {
          const imageUrl = await cloudinaryUpload.uploadImage(img.path);

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
        productCategory: req.body.productCategory,
        productPrice: req.body.price,
        productQuantity: req.body.stock,
        productDiscount: req.body.discount,
        productDimension,
        productDifficultyRate: req.body.difficulty,
        productDescription: req.body.description,
        productDiscountedPrice: discountPrice,
        productImage: imageArray,
      })

      await newProduct.save();

      req.flash('alert', { message: 'Product added successfully', color: 'bg-success' });
    } else {
      req.flash('alert', { message: 'Product Already exist', color: 'bg-danger' });
    }

    res.redirect('/admin/products');
  } catch (err) {
    console.log('Error on add product post', err);
  }
};

// will render admin edit product page 
const editProduct = async (req, res) => {
  try {
    const product = await productSchema.findById(req.query.id);
    const categories = await categorySchema.find();

    if (product) {
      res.render('admin/editProduct', { title: "Edit Product", alert: req.flash('alert'), product, categories })
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
    const { productPrice, productDescription, productQuantity, productCategory } = req.body;

    // get the id of the product
    const productID = req.query.id;

    // Delete images from the backend
    const imagesToDelete = JSON.parse(req.body.deletedImages || '[]');

    // Remove deleted images from DB
    if (imagesToDelete.length > 0) {
      await productSchema.findByIdAndUpdate(productID, {
        $pull: { productImage: { $in: imagesToDelete } }
      });
    }

    // Add new image paths to DB
    if (req.files && req.files.length > 0) {
      const imagePaths = req.files.map(file => file.path.replace(/\\/g, '/'));
      await productSchema.findByIdAndUpdate(productID, {
        $push: { productImage: { $each: imagePaths } }
      });
    }

    // update the product using the values from form
    productSchema.findByIdAndUpdate(productID, { productPrice: productPrice, productDescription: productDescription, productQuantity: productQuantity })
      .then((elem) => {
        req.flash('errorMessage', 'Product Updated successfully');
        res.redirect('/admin/products')
      }).catch((err) => {
        console.log(`Error while updating the product ${err}`);
        req.flash('errorMessage', 'Product is not updated')
        res.redirect('/admin/products')
      })
  } catch (err) {
    console.log(`Error during updating the product on database ${err}`);
    req.flash('errorMessage', 'Oops the action is not completed')
    res.redirect('/admin/products')
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