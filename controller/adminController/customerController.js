const userSchema = require('../../model/userSchema');

// will render customers list
const customer = async (req, res) => {
  try {
    let users;

    if (req.query.searchTerm) {
      // Use a case-insensitive regex to search for the term in the 'name' field
      const regex = new RegExp(req.query.searchTerm, 'i');
      
      users = await userSchema.find({name: regex});
    } else {
      users = await userSchema.find();
    }  

    // sorting users based on created date
    users.sort((a, b) => b.createdAt - a.createdAt);

    res.render('admin/customer', { title: 'Customers', alert: req.flash('alert'), users });
  } catch (err) {
    console.log('Error while rendering users list', err);
  }
};

// will block/unblock users based on fetch request
const customerPost = async (req, res) => {
  try {
    const user = await userSchema.findById(req.body.userId);

    await userSchema.updateOne({ _id: user._id }, { isBlocked: user.isBlocked ? false : true });

    const updatedUser = await userSchema.findById(user._id);

    res.json({ lastUpdated: updatedUser.updatedAt, isBlocked: updatedUser.isBlocked });
  } catch (err) {
    res.json({ error: true });

    console.log('Error on users post', err);
  }
};

module.exports = {
  customer,
  customerPost
};  