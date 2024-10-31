const wishlistSchema = require('../../model/wishlistSchema');
const productSchema = require('../../model/productSchema');
const categorySchema = require('../../model/categorySchema');
const reviewSchema = require('../../model/reviewSchema');

/* ------------------------ will render the wishlist ------------------------ */
const getWishlist = async (req, res) => {
  try {
    /* ---------------------- getting current user wishlist using aggregation --------------------- */
    const wishlist = await wishlistSchema.aggregate([
      {
        $match: { userID: req.session.user }
      },
      {
        $unwind: "$products"
      },
      {
        $sort: { "products.createdAt": -1 }
      },
      {
        $lookup: {
          from: "products",
          localField: "products.productID",
          foreignField: "_id",
          as: "productDetails"
        }
      },
      {
        $unwind: "$productDetails"
      },
      {
        $lookup: {
          from: "categories",
          localField: "productDetails.productCategory",
          foreignField: "_id",
          as: "productDetails.productCategoryDetails"
        }
      },
      {
        $unwind: {
          path: "$productDetails.productCategoryDetails",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $group: {
          _id: "$_id",
          userID: { $first: "$userID" },
          products: {
            $push: {
              productID: "$products.productID",
              productDetails: "$productDetails"
            }
          },
          createdAt: { $first: "$createdAt" },
          updatedAt: { $first: "$updatedAt" }
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $project: {
          _id: 0,
          userID: 1,
          products: 1,
          createdAt: 1,
          updatedAt: 1
        }
      }
    ]);

    const productReviews = await reviewSchema.find().populate('reviews.userID');

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
      productReviews,
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
    const wishlist = await wishlistSchema.findOne({ userID: req.session.user });

    /* ---------------------- checking if user has wishlist --------------------- */
    if (wishlist) {
      /* --------------- checking if item already exists in wishlist -------------- */
      for (const product of wishlist.products) {
        if (product.productID._id.toString() === productID.toString()) {
          return res.status(404).json({ error: 'Item already exist in wishlist' });
        }
      };

      /* -------------------- if item not exist then add to wishlist ------------------- */
      wishlist.products.push({
        productID
      });

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