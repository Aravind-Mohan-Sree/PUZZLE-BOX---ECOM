const orderSchema = require("../../model/orderSchema");

/* -------------------- will render the admin order page -------------------- */
const order = async (req, res) => {
  try {
    const orders = await orderSchema.find()
      .populate('products.productID')
      .sort({ createdAt: -1 })

    res.render('admin/orders', {
      title: "Orders",
      alert: req.flash('alert'),
      orders,
    })
  } catch (err) {
    console.log('Error while rendering admin order page', err);
  }
}
/* -------------------------------------------------------------------------- */

/* ------------------ will render admin order details page ------------------ */
const viewOrder = async (req, res) => {
  try {
    const orderID = req.query.orderID;

    const order = await orderSchema.findById(orderID).populate('products.productID')

    res.render('admin/orderDetail', {
      title: "Order Details",
      alert: req.flash('alert'),
      order    
    })
  } catch (err) {
    console.log('Error while rendering order details page in admin', err);
  }
}
/* -------------------------------------------------------------------------- */

module.exports = {
  order,
  viewOrder
};