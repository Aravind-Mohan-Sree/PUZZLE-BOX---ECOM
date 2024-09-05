const productSchema = require('../../model/productSchema');
const categorySchema = require('../../model/categorySchema');

// will list products based on the conditions
const product = async (req, res) => {
  try {
    let selectedCategory;
    let content;
    const search = req.query.searchTerm || '';

    // Pagination parameters
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
      // productPrice: { $gte: minPrice, $lte: maxPrice },
      // productRating: { $gte: productRating }
    };

    const productsCount = await productSchema.countDocuments(productQuery);

    const activeProducts = await productSchema.find(productQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(productsPerPage)
      .populate('productCategory');

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
      user: req.session.user, activeProducts,
      activeCategoryNames,
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
    const products = await productSchema.findById(req.query.productId);

    res.render('user/productDetail', { title: 'Product Details', products });
  } catch (err) {
    console.log(err);
  }
};

module.exports = {
  product,
  productDetail,
};