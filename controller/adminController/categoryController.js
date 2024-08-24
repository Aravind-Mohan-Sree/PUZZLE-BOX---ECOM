const categorySchema = require('../../model/categorySchema');

// will render admin category page
const category = async (req, res) => {
  try {
    const categories = await categorySchema.find();

    res.render('admin/category', {title: 'Categories', alert: req.flash('alert'), categories});
  } catch (err) {
    console.log('Error while rendering admin category', err);
  }
};

module.exports = {
  category,
};