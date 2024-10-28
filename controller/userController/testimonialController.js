const reviewSchema = require('../../model/reviewSchema');
const productSchema = require('../../model/productSchema');
const categorySchema = require('../../model/categorySchema');

/* --------------------------- for updating testimonial -------------------------- */
const updateTestimonialPost = async (req, res) => {
  try {
    const activeProducts = await productSchema.find({
      isActive: true,
      productCategory: {
        $in: await categorySchema.find({ isActive: true }).select('_id')
      }
    }).select('_id');

    const activeProductIds = activeProducts.map(product => product._id);

    const activeProductReviews = await reviewSchema.find(
      { productID: { $in: activeProductIds } },
      { productID: 1, averageRating: 1, reviews: 1 }
    ).populate('reviews.userID');

    const sortedReviews = activeProductReviews
      .sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))
      .slice(0, 3);

    const topRatedReviews = sortedReviews.map(review => review.reviews).flat();

    res.status(200).json({ topRatedReviews });
  } catch (err) {
    res.status(500).json({ err });

    console.log('Error while updating testimonial', err);
  }
};
/* -------------------------------------------------------------------------- */

module.exports = {
  updateTestimonialPost
};