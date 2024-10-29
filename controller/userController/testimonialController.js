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
    )
      .sort({ createdAt: -1 })
      .populate('reviews.userID');

    const topRatedReviews = activeProductReviews
      .map(review => review.reviews.filter(r => r.rating >= 4))
      .flat()
      .slice(0, 3);

    res.status(200).json({ topRatedReviews });
  } catch (err) {
    console.log('Error while updating testimonial', err);

    res.status(500).json({ message: 'Error while updating testimonial' });
  }
};
/* -------------------------------------------------------------------------- */

module.exports = {
  updateTestimonialPost
};