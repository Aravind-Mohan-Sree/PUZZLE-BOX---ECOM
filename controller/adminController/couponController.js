const couponSchema = require('../../model/couponSchema');
const voucherCodes = require('voucher-code-generator');

/* ---------------------------------- will render the coupon page ---------------------------------- */
const getCoupon = async (req, res) => {
  try {
    const coupons = await couponSchema.aggregate([
      { $match: {} }
    ]);

    res.render('admin/coupon', {
      title: 'Coupons',
      alert: req.flash('alert'),
      coupons
    });
  } catch (err) {
    console.log('Error while rendering the coupon page', err);
  }
};
/* -------------------------------------------------------------------------- */

/* ---------------------------------- will add new coupon ---------------------------------- */
const addCoupon = async (req, res) => {
  try {
    const { couponName, discountAmount, minimumAmount, expiryDate } = req.body;

    /* ----------- check if a coupon with the same name already exists ---------- */
    const existingCouponName = await couponSchema.aggregate([
      {
        $match: { couponName: { $regex: new RegExp(`^${couponName}$`, 'i') } }
      }
    ]);

    if (existingCouponName.length > 0) {
      return res.status(400).json({ error: "Coupon already exists!" });
    }

    /* --------------------- will parse the date --------------------- */
    function parseDate(dateString) {
      const [day, month, year] = dateString.split('/').map(Number);

      return new Date(year, month - 1, day);
    }

    let uniqueCouponCode = false;
    let couponCode;

    /* ------ will loop continuously until a unique code is being generated ----- */
    while (!uniqueCouponCode) {
      /* ---------- generate a voucher code with specific options ---------- */
      couponCode = voucherCodes.generate({
        length: 8,
        count: 1,
        charset: voucherCodes.charset("alphabetic").toUpperCase(),
        pattern: "####-####",
      });

      const existingCouponCode = await couponSchema.aggregate([
        {
          $match: { couponCode }
        }
      ]);

      if (existingCouponCode.length === 0) {
        uniqueCouponCode = true;
      }
    }

    /* ------- if no coupon with the same name exists, add the new coupon ------- */
    await couponSchema.create({
      couponName,
      couponCode: couponCode[0],
      discount: discountAmount,
      expiryDate: parseDate(expiryDate),
      minAmount: minimumAmount
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