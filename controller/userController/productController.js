const mongoose = require('mongoose');
const productSchema = require('../../model/productSchema');
const categorySchema = require('../../model/categorySchema');
const cartSchema = require('../../model/cartSchema');
const wishlistSchema = require('../../model/wishlistSchema');
const orderSchema = require('../../model/orderSchema');
const reviewSchema = require('../../model/reviewSchema');

// will list products based on the conditions
const product = async (req, res) => {
  try {
    let selectedCategory;
    let content;
    const search = req.query.searchTerm || '';
    const minPrice = parseFloat(req.query.minPrice) || 0;
    const maxPrice = parseFloat(req.query.maxPrice) || Infinity;
    const featured = req.query.featured && true;
    const inStock = req.query.inStock;
    const outOfStock = req.query.outOfStock;
    const productRating = parseInt(req.query.productRating);

    // pagination parameters
    const productsPerPage = 8;
    const currentPage = parseInt(req.query.page) || 1;
    const skip = (currentPage - 1) * productsPerPage;

    if (req.query.productCategory) {
      selectedCategory = req.query.productCategory;
      content = 'category';
    } else {
      selectedCategory = null;
      content = 'explore';
    }

    const productCategoryQuery = selectedCategory
      ? { $in: await categorySchema.find({ categoryName: selectedCategory }).select('_id') }
      : { $in: await categorySchema.find({ isActive: true }).select('_id') };

    const ratedProductIds = await reviewSchema
      .find({})
      .populate("productID")
      .then(reviews => {
        return reviews
          .filter(review => + review.averageRating.toFixed() === productRating)
          .map(review => review.productID._id);
      });

    // query for products with filters  
    const productQuery = {
      productName: { $regex: search, $options: "i" },
      productCategory: productCategoryQuery,
      isActive: true,
      productDiscountedPrice: { $gte: minPrice, $lte: maxPrice },
      ...((ratedProductIds.length > 0 || productRating) && { _id: { $in: ratedProductIds } }),
      ...(featured && { isFeatured: featured }),
      ...(inStock && { productQuantity: { $gte: parseInt(inStock) } }),
      ...(outOfStock && { productQuantity: parseInt(outOfStock) })
    };

    const productReviews = await reviewSchema.find();

    const activeProductsQuery = productSchema.find(productQuery)
      .populate('productCategory');

    // get sales count if popularity sort is requested
    let salesCountMap = {};

    if (req.query.sort === 'popularity') {
      const salesData = await orderSchema.aggregate([
        { $unwind: "$products" },
        { $group: { _id: "$products.productID", totalSales: { $sum: "$products.quantity" } } }
      ]);

      // create a mapping of product ids to sales count
      salesCountMap = salesData.reduce((acc, item) => {
        acc[item._id.toString()] = item.totalSales;
        return acc;
      }, {});
    }

    let activeProducts = await activeProductsQuery;

    // apply sorting only if a option is selected
    if (req.query.sort === 'lowToHigh') {
      activeProducts.sort((a, b) => a.productDiscountedPrice - b.productDiscountedPrice);
    } else if (req.query.sort === 'highToLow') {
      activeProducts.sort((a, b) => b.productDiscountedPrice - a.productDiscountedPrice);
    } else if (req.query.sort === 'aToZ') {
      activeProducts.sort((a, b) => a.productName.localeCompare(b.productName));
    } else if (req.query.sort === 'zToA') {
      activeProducts.sort((a, b) => b.productName.localeCompare(a.productName));
    } else if (req.query.sort === 'newArrivals') {
      activeProducts.sort((a, b) => b.createdAt - a.createdAt);
    } else if (req.query.sort === 'popularity') {
      activeProducts.sort((a, b) => {
        const salesA = salesCountMap[a._id.toString()] || 0;
        const salesB = salesCountMap[b._id.toString()] || 0;
        return salesB - salesA;
      });
    }

    const productsCount = activeProducts.length;

    activeProducts = activeProducts.slice(skip, skip + productsPerPage);

    if (activeProducts.length === 0) {
      req.flash('alert', { message: 'Nothing match your search', color: 'bg-danger' });
    }

    const activeCategories = await productSchema.find({
      isActive: true,
      productCategory: { $in: await categorySchema.find({ isActive: true }).select('_id') }
    })
      .populate('productCategory');

    const activeCategoryNames = Array.from(new Set(activeCategories.map(product => product.productCategory.categoryName))).sort((a, b) => a.localeCompare(b));

    res.render('user/product', {
      title: 'Products',
      alert: req.flash('alert'),
      user: req.session.user,
      activeProducts,
      productReviews,
      activeCategoryNames,
      search,
      selectedCategory,
      minPrice,
      maxPrice,
      featured,
      inStock,
      outOfStock,
      productRating,
      sort: req.query.sort,
      pageNumber: Math.ceil(productsCount / productsPerPage),
      currentPage,
      totalPages: productsCount,
      content
    });
  } catch (err) {
    console.log(err);
  }
};

// will show the details of a particular product
const productDetail = async (req, res) => {
  try {
    const product = await productSchema.findOne({
      _id: req.query.productId,
      isActive: true,
      productCategory: { $in: await categorySchema.find({ categoryName: req.query.productCategory, isActive: true }).select('_id') }
    })
      .populate('productCategory');

    const productReviews = await reviewSchema.find().populate('reviews.userID');

    /* ------------ using aggregation to find the product in wishlist, if any ----------- */
    const inWishlist = await wishlistSchema.aggregate([
      {
        $match: { userID: req.session.user }
      },
      {
        $unwind: "$products"
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
        $match: { "productDetails._id": new mongoose.Types.ObjectId(String(req.query.productId)) }
      }     
    ]);

    if (product) {
      const similarProducts = await productSchema.find({
        _id: { $nin: [req.query.productId] },
        productCategory: { $in: await categorySchema.find({ categoryName: req.query.productCategory }).select('_id') }
      })
        .sort({ createdAt: -1 })
        .limit(4)
        .populate('productCategory');

      const activeCategories = await productSchema.find({
        isActive: true,
        productCategory: { $in: await categorySchema.find({ isActive: true }).select('_id') }
      })
        .populate('productCategory');

      const activeCategoryNames = Array.from(new Set(activeCategories.map(product => product.productCategory.categoryName))).sort((a, b) => a.localeCompare(b));

      const cart = await cartSchema
        .findOne({ userID: req.session.user })
        .populate('items.productID');

      res.render('user/productDetail', {
        title: 'Product Details',
        alert: req.flash('alert'),
        user: req.session.user,
        product,
        productReviews,
        inWishlist,
        similarProducts,
        activeCategoryNames,
        content: '',
        cart
      });
    } else {
      req.flash('alert', { message: 'Unable to view product. Try again', color: 'bg-danger' });

      res.redirect('/home');
    }
  } catch (err) {
    console.log(err);
  }
};

module.exports = {
  product,
  productDetail,
};