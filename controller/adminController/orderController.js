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

/* ------------------- will update the status of an order ------------------- */
const editOrderStatus = async (req, res) => {
  try {
    const statusEnum = ['Shipped', 'Delivered', 'Returned'];
    const orderStatus = req.query.orderStatus;    
    const productIndex = req.query.productIndex;    
    const orderID = req.query.orderID;    

    const order = await orderSchema.findById(orderID).populate('products.productID')

    if (statusEnum[orderStatus] === 'Shipped') {
      order.products[productIndex].status = statusEnum[orderStatus];
    }

    if (statusEnum[orderStatus] === 'Delivered') {
      order.products[productIndex].status = statusEnum[orderStatus];
      order.products[productIndex].deliveryDate = new Date();
    }
    
    await order.save();
    
    req.flash('alert', { message: 'Order status changed successfully!', color: 'bg-success' });
    res.status(200).json({success: true});
  } catch (error) {
    res.status(500).json({error});

    console.log('Error while updating order status', err);
  }
};
/* -------------------------------------------------------------------------- */

module.exports = {
  order,
  viewOrder,
  editOrderStatus
};