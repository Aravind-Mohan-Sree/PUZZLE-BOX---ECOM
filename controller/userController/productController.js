const productSchema = require('../../model/productSchema');
const categorySchema = require('../../model/categorySchema');
const cartSchema = require('../../model/cartSchema');

// will list products based on the conditions
const product = async (req, res) => {
  try {
    let selectedCategory;
    let content;
    const search = req.query.searchTerm || '';
    const minPrice = parseFloat(req.query.minPrice) || 0;
    const maxPrice = parseFloat(req.query.maxPrice) || Infinity;

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

    // query for products with filters  
    const productQuery = {
      productName: { $regex: search, $options: "i" },
      productCategory: productCategoryQuery,
      isActive: true,
      productDiscountedPrice: { $gte: minPrice, $lte: maxPrice },
      // productRating: { $gte: productRating }
    };

    const productsCount = await productSchema.countDocuments(productQuery);

    const activeProductsQuery = productSchema.find(productQuery)
      .skip(skip)
      .limit(productsPerPage)
      .populate('productCategory');

    // apply sorting only if a option is selected
    if (req.query.sort) {
      if (req.query.sort === 'lowToHigh' || req.query.sort === 'highToLow') {
        const sortOrder = req.query.sort === 'lowToHigh' ? 1 : -1;
        activeProductsQuery.sort({ productDiscountedPrice: sortOrder, _id: 1 });
      } else if (req.query.sort === 'aToZ' || req.query.sort === 'zToA') {
        const sortOrder = req.query.sort === 'aToZ' ? 1 : -1;
        activeProductsQuery.sort({ productName: sortOrder, _id: 1 });
      } else {
        const sortOrder = -1;
        activeProductsQuery.sort({ createdAt: sortOrder, _id: 1 });
      }
    }

    const activeProducts = await activeProductsQuery;

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
      activeCategoryNames,
      search,
      selectedCategory,
      minPrice,
      maxPrice,
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