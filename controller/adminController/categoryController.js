const categorySchema = require('../../model/categorySchema');

// will render admin category page
const category = async (req, res) => {
  try {
    const categories = await categorySchema.find();

    // sorting categories based on created date
    categories.sort((a, b) => b.createdAt - a.createdAt);

    res.render('admin/category', { title: 'Categories', alert: req.flash('alert'), categories });
  } catch (err) {
    console.log('Error while rendering admin category', err);
  }
};

// for adding, activate/inactivate, edit and delete categories in category collection
const categoryPost = async (req, res) => {
  try {
    if (req.body.categoryName || req.body.status || req.body.newCategoryName || req.body.delete) {
      if (req.body.categoryName) {
        await categorySchema.create({
          categoryName: req.body.categoryName
        });

        res.json({ add: true });
      } else if (req.body.status) {
        const category = await categorySchema.findById(req.body.categoryId);
        
        await categorySchema.updateOne({ _id: category._id }, { isActive: category.isActive ? false : true });

        const updatedCategory = await categorySchema.findById(category._id);

        res.json({ lastUpdated: updatedCategory.updatedAt, isActive: updatedCategory.isActive });
      } else if (req.body.newCategoryName) {
        await categorySchema.findByIdAndUpdate(req.body.categoryId, { categoryName: req.body.newCategoryName });

        const category = await categorySchema.findById(req.body.categoryId);

        res.json({ lastUpdated: category.updatedAt });
      } else {
        await categorySchema.findByIdAndDelete(req.body.categoryId);

        res.json({ delete: true });
      }
    }
  } catch (err) {
    res.json({ error: true });

    console.log('Error on category post', err);
  }
};

module.exports = {
  category,
  categoryPost,
};