const categorySchema = require('../../model/categorySchema');

// will render admin category page
const category = async (req, res) => {
  try {
    let categories;

    if (req.query.searchTerm) {
      // Use a case-insensitive regex to search for the term in the 'name' field
      const regex = new RegExp(req.query.searchTerm, 'i');
      
      categories = await categorySchema.find({categoryName: regex});
    } else {
      categories = await categorySchema.find();
    }

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
        const categoryExist = await categorySchema.findOne({categoryName: new RegExp(`^${req.body.categoryName}$`, 'i')});

        if (categoryExist) {
          res.json({ exist: true });
        } else {
          await categorySchema.create({
            categoryName: req.body.categoryName
          });

          req.flash('alert', { message: 'Category added successfully', color: 'bg-success' });

          res.json({ add: true });
        }
      } else if (req.body.status) {
        const category = await categorySchema.findById(req.body.categoryId);

        await categorySchema.updateOne({ _id: category._id }, { isActive: category.isActive ? false : true });

        const updatedCategory = await categorySchema.findById(category._id);

        res.json({ lastUpdated: updatedCategory.updatedAt, isActive: updatedCategory.isActive });
      } else if (req.body.newCategoryName) {
        const categoryExist = await categorySchema.findOne({categoryName: new RegExp(`^${req.body.newCategoryName}$`, 'i')});

        if (categoryExist) {
          res.json({exist: true});
        } else {
          await categorySchema.findByIdAndUpdate(req.body.categoryId, { categoryName: req.body.newCategoryName });
  
          const category = await categorySchema.findById(req.body.categoryId);
  
          res.json({ lastUpdated: category.updatedAt });
        }
      } else {
        await categorySchema.findByIdAndDelete(req.body.categoryId);

        req.flash('alert', { message: 'Category deleted successfully', color: 'bg-success' });

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
  categoryPost
};