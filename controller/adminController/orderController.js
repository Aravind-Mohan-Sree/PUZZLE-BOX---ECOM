const orderSchema = require("../../model/orderSchema");
const productSchema = require("../../model/productSchema");
const walletSchema = require("../../model/walletSchema");

/* -------------------- will render the admin order page -------------------- */
const order = async (req, res) => {
  try {
    const orders = await orderSchema
      .find()
      .populate("products.productID")
      .sort({ createdAt: -1 });

    res.render("admin/orders", {
      title: "Orders",
      alert: req.flash("alert"),
      orders,
    });
  } catch (err) {
    console.log("Error while rendering admin order page", err);
  }
};
/* -------------------------------------------------------------------------- */

/* ------------------ will render admin order details page ------------------ */
const viewOrder = async (req, res) => {
  try {
    const orderID = req.query.orderID;

    const order = await orderSchema
      .findById(orderID)
      .populate("products.productID");

    res.render("admin/orderDetail", {
      title: "Order Details",
      alert: req.flash("alert"),
      order,
    });
  } catch (err) {
    console.log("Error while rendering order details page in admin", err);
  }
};
/* -------------------------------------------------------------------------- */

/* ------------------- will update the status of an order ------------------- */
const editOrderStatus = async (req, res) => {
  try {
    const statusEnum = ["Shipped", "Delivered", "Returned"];
    const orderStatus = req.query.orderStatus;
    const productIndex = req.query.productIndex;
    const orderID = req.query.orderID;

    const order = await orderSchema
      .findById(orderID)
      .populate("products.productID");

    const wallet = await walletSchema.findOne({ userID: order.userID });

    const product = await productSchema.findById(
      order.products[productIndex].productID
    );

    if (order.products[productIndex].status !== "Cancelled") {
      if (statusEnum[orderStatus] === "Shipped") {
        order.products[productIndex].status = statusEnum[orderStatus];
      }

      if (statusEnum[orderStatus] === "Delivered") {
        order.products[productIndex].status = statusEnum[orderStatus];
        order.products[productIndex].deliveryDate = new Date();
      }

      if (statusEnum[orderStatus] === "Returned") {
        order.products[productIndex].status = statusEnum[orderStatus];
        order.products[productIndex].returnedDate = new Date();
        product.productQuantity += order.products[productIndex].quantity;
      }

      let orderTotalPrice = 0;
      let refundableAmount = 0;
      let productShare = 0; // returning product share for calculating coupon discount
      let couponDiscount = 0; // share of coupon discount for the returning item, if any

      order.products.forEach((ele) => {
        orderTotalPrice += ele.productID.productDiscountedPrice * ele.quantity;
      });

      productShare =
        (order.products[productIndex].productID.productDiscountedPrice *
          order.products[productIndex].quantity) /
        orderTotalPrice;

      refundableAmount =
        order.products[productIndex].productID.productDiscountedPrice *
        order.products[productIndex].quantity;

      if (order.couponDiscount > 0) {
        orderTotalPrice -= order.couponDiscount;

        couponDiscount = order.couponDiscount * productShare;
        refundableAmount -= Math.round(couponDiscount);
      }

      if (orderTotalPrice < 500) {
        refundableAmount += 40 * order.products[productIndex].quantity;
      }

      if (!wallet && statusEnum[orderStatus] === "Returned") {
        await walletSchema.create({
          userID: order.userID,
          balance: refundableAmount,
          transactions: [
            {
              ...(order.paymentId && { transactionID: order.paymentId }),
              reason: "Return Refund",
              amount: refundableAmount,
              type: "credit",
              runningBalance: refundableAmount,
            },
          ],
        });
      } else if (statusEnum[orderStatus] === "Returned") {
        wallet.balance += refundableAmount;
        wallet.transactions.push({
          ...(order.paymentId && { transactionID: order.paymentId }),
          reason: "Return Refund",
          amount: refundableAmount,
          type: "credit",
          runningBalance: wallet.balance,
        });

        await wallet.save();
      }

      await order.save();
      await product.save();

      req.flash("alert", {
        message: "Order status changed successfully!",
        color: "bg-success",
      });
    } else {
      req.flash("alert", {
        message: "Error while changing order status!",
        color: "bg-danger",
      });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error });

    console.log("Error while updating order status", error);
  }
};
/* -------------------------------------------------------------------------- */

/* ------------------- for rejecting order return request ------------------- */
const rejectReturnOrder = async (req, res) => {
  try {
    const productIndex = req.query.productIndex;
    const rejectReason = req.query.rejectReason;
    const orderID = req.query.orderID;

    const order = await orderSchema
      .findById(orderID)
      .populate("products.productID");

    order.products[productIndex].status = "Delivered";
    order.products[productIndex].reasonForRejection = rejectReason;

    await order.save();

    req.flash("alert", {
      message: "Return request rejected!",
      color: "bg-success",
    });
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error });

    console.log("Error while rejecting order return request", error);
  }
};
/* -------------------------------------------------------------------------- */

module.exports = {
  order,
  viewOrder,
  editOrderStatus,
  rejectReturnOrder,
};
