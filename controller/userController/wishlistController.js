const wishlistSchema = require('../../model/wishlistSchema');
const productSchema = require('../../model/productSchema');
const categorySchema = require('../../model/categorySchema');
const reviewSchema = require('../../model/reviewSchema');

/* ------------------------ will render the wishlist ------------------------ */
const getWishlist = async (req, res) => {
  try {
    const wishlist = await wishlistSchema.findOne({ userID: req.session.user })
      .populate('product.productID');

    const reviews = await reviewSchema.find();

    /* --------------------- will get the active categories --------------------- */
    const activeCategories = await productSchema.find({
      isActive: true,
      productCategory: { $in: await categorySchema.find({ isActive: true }).select('_id') }
    })
      .populate('productCategory');

    const activeCategoryNames = Array.from(new Set(activeCategories.map(product => product.productCategory.categoryName))).sort((a, b) => a.localeCompare(b));

    res.render('user/wishlist', {
      title: 'Wishlist',
      alert: req.flash('alert'),
      user: req.session.user,
      wishlist,
      reviews,
      activeCategoryNames,
      content: ''
    });
  } catch (err) {
    console.log('Error while rendering wishlist', err);
  }
};
/* -------------------------------------------------------------------------- */

/* ------------------------ will add item to wishlist ------------------------ */
const addToWishlist = async (req, res) => {
  try {
    const productID = req.query.productId;

    /* ---------------------- getting current user wishlist --------------------- */
    const wishlist = await wishlistSchema.findOne({ userID: req.session.user })
      .populate('product.productID');

    /* ---------------------- checking if user has wishlist --------------------- */
    if (wishlist) {
      /* --------------- checking if item already exists in wishlist -------------- */
      wishlist.products.forEach(product => {
        if (product.productID._id === productID) {
          req.flash('alert', { message: 'Item already exist in wishlist', color: 'bg-danger' });

          return res.status(404).json({ error: true });
        }
      });

      /* -------------------- if item not exist then add to wishlist ------------------- */
      wishlist.products = [{
        productID
      }];

      wishlist.save();
    } else {
      /* ---------------- creates a new wishlist if user do not have one ---------------- */
      const newWishlist = new wishlistSchema({
        userID: req.session.user,
        products: [{
          productID
        }]
      });

      newWishlist.save();
    }

    res.status(200).json({ success: 'Product added to wishlist' });
  } catch (err) {
    console.log('Error while adding item to wishlist', err);

    res.status(500).json({ err });
  }
};
/* -------------------------------------------------------------------------- */

module.exports = {
  getWishlist,
  addToWishlist,
  // removeFromWishlist
};