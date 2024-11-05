const couponSchema = require('../../model/couponSchema');
const voucherCodes = require('voucher-code-generator');

/* ---------------------------------- will render the coupon page ---------------------------------- */
const getCoupon = async (req, res) => {
  const { searchTerm } = req.query;

  try {
    const coupons = await couponSchema.aggregate([
      { $match: { name: { $regex: new RegExp(searchTerm, 'i') } } },
      { $sort: { createdAt: -1 } }
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
        $match: { name: { $regex: new RegExp(`^${couponName}$`, 'i') } }
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
          $match: { code: couponCode }
        }
      ]);

      if (existingCouponCode.length === 0) {
        uniqueCouponCode = true;
      }
    }

    /* ------- if no coupon with the same name exists, add the new coupon ------- */
    await couponSchema.create({
      name: couponName,
      code: couponCode[0],
      discount: discountAmount,
      minPurchase: minimumAmount,
      expiryDate: parseDate(expiryDate)
    });

    req.flash('alert', { message: 'Coupon created successfully!', color: 'bg-success' });
    res.status(201).json({ success: true });
  } catch (err) {
    console.log('Error while adding new coupon', err);
  }
};
/* -------------------------------------------------------------------------- */

/* ---------------------------------- will update the coupon ---------------------------------- */
const editCoupon = async (req, res) => {
  try {
    /* --------------------- will parse the date --------------------- */
    function parseDate(dateString) {
      const [day, month, year] = dateString.split('/').map(Number);

      return new Date(year, month - 1, day);
    }

    const { couponId, discountAmount, minimumAmount, expiryDate } = req.body;

    const coupon = await couponSchema.findById(couponId);

    coupon.discount = discountAmount;
    coupon.minPurchase = minimumAmount;
    coupon.expiryDate = parseDate(expiryDate);

    coupon.save();

    req.flash('alert', { message: 'Coupon updated successfully!', color: 'bg-success' });
    res.status(201).json({ success: true });
  } catch (err) {
    console.log('Error while updating coupon', err);
  }
};
/* -------------------------------------------------------------------------- */

/* ---------------------------------- will change coupon status ---------------------------------- */
const toggleCouponStatus = async (req, res) => {
  try {
    const { couponId } = req.body;

    const coupon = await couponSchema.findById(couponId);

    coupon.isActive = coupon.isActive ? false : true;

    const message = coupon.isActive ? 'Coupon unblocked successfully!' : 'Coupon blocked successfully!';

    coupon.save();

    req.flash('alert', { message, color: 'bg-success' });
    res.status(201).json({ success: true });
  } catch (err) {
    console.log('Error while changing coupon status', err);
  }
};
/* -------------------------------------------------------------------------- */

/* ---------------------------------- will delete the coupon ---------------------------------- */
const deleteCoupon = async (req, res) => {
  try {
    const { couponId } = req.body;

    await couponSchema.findByIdAndDelete(couponId);

    req.flash('alert', { message: 'Coupon deleted successfully!', color: 'bg-success' });
    res.status(201).json({ success: true });
  } catch (err) {
    console.log('Error while deleting the coupon', err);
  }
};
/* -------------------------------------------------------------------------- */

module.exports = {
  getCoupon,
  addCoupon,
  editCoupon,
  toggleCouponStatus,
  deleteCoupon
};