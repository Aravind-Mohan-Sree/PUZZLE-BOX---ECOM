const couponSchema = require('../../model/couponSchema');
const voucherCodes = require('voucher-code-generator');

/* ---------------------------------- will render the coupon page ---------------------------------- */
const getCoupon = (req, res) => {
  try {

    res.render('admin/coupon', {
      title: 'Coupons',
      alert: req.flash('alert'),
      categories: []
    });
  } catch (err) {
    console.log('Error while rendering the coupon page', err);
  }
};
/* -------------------------------------------------------------------------- */

/* ---------------------------------- will add new coupon ---------------------------------- */
const addCoupon = async (req, res) => {
  try {
    /* --------------------- will parse the date from input --------------------- */
    function parseDate(dateString) {
      const [day, month, year] = dateString.split('/').map(Number);

      return new Date(year, month - 1, day);
    }

    /* ---------- generate a voucher code with specific options ---------- */
    const couponCode = voucherCodes.generate({
      length: 8,
      count: 1,
      charset: voucherCodes.charset("alphanumeric"),
      prefix: "PUZZLE-",
      postfix: "-BOX",
      pattern: "####-####",
    });

    /* ----------- check if a coupon with the same name already exists ---------- */
    const existingCoupon = await Coupon.aggregate([
      {
        $match: { couponName: couponName }
      }
    ]);

    if (existingCoupon.length > 0) {
      return res.status(400).json({ error: "Coupon already exists!" });
    }

    /* ------- if no coupon with the same name exists, add the new coupon ------- */
    await couponSchema.create({
      couponName,
      couponCode,
      discount: discountAmount,
      expiryDate: parseDate(expiryDate),
      minAmount: minimumAmount,
    });

    req.flash('alert', { message: 'Coupon created successfully!', color: 'bg-success' });
    res.status(201).json({ success: true });
  } catch (err) {
    console.log('Error while adding new coupon', err);
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