const userSchema = require('../../model/userSchema');
const categorySchema = require('../../model/categorySchema');
const productSchema = require('../../model/productSchema');

/* ------------------------ will render profile page ------------------------ */
const profile = async (req, res) => {
  try {
    const userDetails = await userSchema.findById(req.session.user);

    /* -- if by any chance, userdetails is not available, then redirect to home - */
    if (userDetails) {
      const activeCategories = await productSchema.find({
        isActive: true,
        productCategory: { $in: await categorySchema.find({ isActive: true }).select('_id') }
      })
        .populate('productCategory');

      const activeCategoryNames = Array.from(new Set(activeCategories.map(product => product.productCategory.categoryName))).sort((a, b) => a.localeCompare(b));

      res.render('user/profile', { title: 'Home', alert: req.flash('alert'), user: req.session.user, userDetails, activeCategoryNames, content: '' })
    } else {
      req.flash('alert', { message: 'An error occurred while getting user details. Try again later', color: 'bg-danger' });
      res.redirect('/home');
    }
  } catch (err) {
    console.log('Error while rendering user profile page', err);
  }
};
/* -------------------------------------------------------------------------- */

/* ----------------- for updating user details and password ----------------- */
const profilePost = async (req, res) => {
  try {
    const userDetails = await userSchema.findById(req.session.user);

    if (req.query.updateProfile) {
      userDetails.name = req.body.contactName;
      userDetails.phone = req.body.phone;

      await userDetails.save();

      req.flash('alert', { message: 'Profile updated successfully!', color: 'bg-success' });

      res.json({ url: '/profile' });
    }
  } catch (err) {
    res.json({ error: true });
    
    console.log('Error while updating user details');
  }
};

/* --------------- for adding new user address -------------- */
const addAddress = async (req, res) => {
  try {
    const userDetails = await userSchema.findById(req.session.user);

    if (userDetails.address.length === 5) {
      req.flash('alert', { message: 'Maximum 5 addresses allowed!', color: 'bg-danger' });

      res.redirect('/profile');
    } else {
      const userAddress = {
        contactName: req.body.contactName,
        phone: req.body.phone,
        pincode: req.body.pincode,
        state: req.body.state,
        city: req.body.city,
        house: req.body.house,
        area: req.body.area
      };

      userDetails.address.push(userAddress);

      await userDetails.save();

      req.flash('alert', { message: 'Address saved successfully!', color: 'bg-success' });

      res.redirect('/profile');
    }
  } catch (err) {
    console.log('Error while saving new user address', err);
  }
};
/* -------------------------------------------------------------------------- */

/* ------------------------ for updating user address ----------------------- */
const updateAddress = async (req, res) => {
  try {
    const userDetails = await userSchema.findById(req.session.user);
    const addressIndex = req.query.index;

    const userAddress = {
      contactName: req.body.contactName,
      phone: req.body.phone,
      pincode: req.body.pincode,
      state: req.body.state,
      city: req.body.city,
      house: req.body.house,
      area: req.body.area
    };

    userDetails.address[addressIndex] = userAddress;

    await userDetails.save();

    req.flash('alert', { message: 'Address updated successfully!', color: 'bg-success' });

    res.redirect('/profile');
  } catch (err) {
    console.log('Error while updating user address', err);
  }
};
/* -------------------------------------------------------------------------- */

/* ------------------------ for deleting user address ----------------------- */
const deleteAddress = async (req, res) => {
  try {
    const userDetails = await userSchema.findById(req.session.user);
    const addressIndex = req.query.index;

    userDetails.address.splice(addressIndex, 1);

    await userDetails.save();

    req.flash('alert', { message: 'Address deleted successfully!', color: 'bg-success' });

    res.json({ url: '/profile' });
  } catch (err) {
    res.json({ error: true });

    console.log('Error while deleting user address', err);
  };
};
/* -------------------------------------------------------------------------- */

module.exports = {
  profile,
  profilePost,
  addAddress,
  updateAddress,
  deleteAddress
};