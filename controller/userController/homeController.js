const userSchema = require('../../model/userSchema');
const productSchema = require('../../model/productSchema');
const categorySchema = require('../../model/categorySchema');
const reviewSchema = require('../../model/reviewSchema');

// will render user home page
const home = async (req, res) => {
  try {
    if (req.query.login) {
      req.flash('alert', { message: 'Login successful!', color: 'bg-success' });
    }

    if (req.query.signup) {
      req.flash("alert", { message: "Signup successful!", color: "bg-success" });
    }

    const activeProducts = await productSchema.find({
      isActive: true,
      productCategory: {
        $in: await categorySchema.find({ isActive: true }).select('_id')
      }
    }).populate('productCategory');

    const productReviews = await reviewSchema.find().populate('reviews.userID');
    const ratings = await reviewSchema.find({}, { productID: 1, averageRating: 1, createdAt: 1 });

    const ratingsMap = ratings.reduce((acc, review) => {
      acc[review.productID.toString()] = {
        averageRating: review.averageRating,
        createdAt: review.createdAt
      };

      return acc;
    }, {});

    const activeCategoryNames = Array.from(new Set(activeProducts.map(product => product.productCategory.categoryName))).sort((a, b) => a.localeCompare(b));

    const users = await userSchema.find({ isBlocked: false });
    const latestProducts = activeProducts.sort((a, b) => b.createdAt - a.createdAt).slice(0, 4);
    const topProducts = activeProducts
      .filter(product => ratingsMap[product._id.toString()] !== undefined)
      .sort((a, b) => {
        const ratingA = ratingsMap[a._id.toString()] || { averageRating: 0, createdAt: new Date(0) };
        const ratingB = ratingsMap[b._id.toString()] || { averageRating: 0, createdAt: new Date(0) };

        if (ratingB.averageRating !== ratingA.averageRating) {
          return ratingB.averageRating - ratingA.averageRating;
        }
        
        return ratingB.createdAt - ratingA.createdAt;
      })
      .slice(0, 4);

    res.render('user/home', { title: 'Home', alert: req.flash('alert'), user: req.session.user, users, activeProducts, productReviews, latestProducts, topProducts, activeCategoryNames, content: '' });
  } catch (err) {
    console.log('Error while rendering user home page', err);
  }
};

module.exports = {
  home,
};