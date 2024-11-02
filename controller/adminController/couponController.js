const couponSchema = require('../../model/couponSchema');

/* ---------------------------------- will ---------------------------------- */
const getCoupon = (req, res) => {
  try {

    res.render('admin/coupon', {
      title: 'Coupons',
      alert: req.flash('alert'),
      categories: []
    });
  } catch (err) {
    console.log();
  }
};
/* -------------------------------------------------------------------------- */

/* ---------------------------------- will ---------------------------------- */
const addCoupon = (req, res) => {
  try {

  } catch (err) {
    console.log();
  }
};
/* -------------------------------------------------------------------------- */

/* ---------------------------------- will ---------------------------------- */
const editCoupon = (req, res) => {
  try {

  } catch (err) {
    console.log();
  }
};
/* -------------------------------------------------------------------------- */

/* ---------------------------------- will ---------------------------------- */
const blockCoupon = (req, res) => {
  try {

  } catch (err) {
    console.log();
  }
};
/* -------------------------------------------------------------------------- */

/* ---------------------------------- will ---------------------------------- */
const unBlockCoupon = (req, res) => {
  try {

  } catch (err) {
    console.log();
  }
};
/* -------------------------------------------------------------------------- */

/* ---------------------------------- will ---------------------------------- */
const deleteCoupon = (req, res) => {
  try {

  } catch (err) {
    console.log();
  }
};
/* -------------------------------------------------------------------------- */

module.exports = {
  getCoupon,
  addCoupon,
  editCoupon,
  blockCoupon,
  unBlockCoupon,
  deleteCoupon
};