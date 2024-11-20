const categorySchema = require("../../model/categorySchema");
const productSchema = require("../../model/productSchema");
const orderSchema = require("../../model/orderSchema");
const walletSchema = require("../../model/walletSchema");
const reviewSchema = require("../../model/reviewSchema");
const generatePDFInvoice = require("../../services/generatePDFInvoice");

/* ----------------------- will render the order page ----------------------- */
const order = async (req, res) => {
  try {
    /* -------------------------- pagination parameters ------------------------- */
    const productsPerPage = 5;
    const currentPage = parseInt(req.query.page) || 1;
    const skip = (currentPage - 1) * productsPerPage;

    const orders = await orderSchema
      .find({ userID: req.session.user })
      .populate({
        path: "products.productID",
        populate: {
          path: "productCategory",
        },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(productsPerPage);

    const orderCount = await orderSchema.countDocuments({
      userID: req.session.user,
    });

    /* ---------- querying active categories for including in the navbar --------- */
    const activeCategories = await productSchema
      .find({
        isActive: true,
        productCategory: {
          $in: await categorySchema.find({ isActive: true }).select("_id"),
        },
      })
      .populate("productCategory");

    const activeCategoryNames = Array.from(
      new Set(
        activeCategories.map((product) => product.productCategory.categoryName)
      )
    ).sort((a, b) => a.localeCompare(b));

    res.render("user/orders", {
      title: "Orders",
      alert: req.flash("alert"),
      user: req.session.user,
      orders,
      pageNumber: Math.ceil(orderCount / productsPerPage),
      currentPage,
      totalPages: Math.ceil(orderCount / productsPerPage),
      orderCount,
      activeCategoryNames,
      content: "",
    });
  } catch (err) {
    console.log(`Error rendering the order page ${err}`);
  }
};
/* -------------------------------------------------------------------------- */

/* --------------- will initialize order cancellation -------------- */
const cancelOrderPost = async (req, res) => {
  try {
    const orderID = req.query.orderID;
    const productIndex = req.query.productIndex;
    const cancelReason = req.query.cancelReason;

    const order = await orderSchema
      .findById(orderID)
      .populate("products.productID");
    const wallet = await walletSchema.findOne({ userID: order.userID });
    const product = await productSchema.findById(
      order.products[productIndex].productID
    );

    if (order.products[productIndex].status !== "Delivered") {
      order.products[productIndex].status = "Cancelled";
      order.products[productIndex].reasonForCancel = cancelReason;
      product.productQuantity += order.products[productIndex].quantity;

      if (
        order.paymentMethod === "Razorpay" ||
        order.paymentMethod === "Wallet"
      ) {
        let orderTotalPrice = 0;
        let refundableAmount = 0;
        let productShare = 0; // returning product share for calculating coupon discount
        let couponDiscount = 0; // share of coupon discount for the returning item, if any

        order.products.forEach((ele) => {
          orderTotalPrice +=
            ele.productID.productDiscountedPrice * ele.quantity;
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

        if (!wallet) {
          await walletSchema.create({
            userID: order.userID,
            balance: refundableAmount,
            transactions: [
              {
                reason: "Cancellation Refund",
                amount: refundableAmount,
                type: "credit",
                runningBalance: refundableAmount,
              },
            ],
          });
        } else {
          wallet.balance += refundableAmount;
          wallet.transactions.push({
            reason: "Cancellation Refund",
            amount: refundableAmount,
            type: "credit",
            runningBalance: wallet.balance,
          });

          await wallet.save();
        }
      }

      await order.save();
      await product.save();

      req.flash("alert", {
        message: "Order cancellation successful!",
        color: "bg-success",
      });
    } else {
      req.flash("alert", {
        message: "Order cancellation unsuccessful!",
        color: "bg-danger",
      });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.log("Error while cancelling order", error);

    res.status(500).json({ error });
  }
};
/* -------------------------------------------------------------------------- */

/* --------------- will initialize request for returning order -------------- */
const returnOrderPost = async (req, res) => {
  try {
    const orderID = req.query.orderID;
    const productIndex = req.query.productIndex;
    const returnReason = req.query.returnReason;

    const order = await orderSchema
      .findById(orderID)
      .populate("products.productID");

    const currentDate = new Date();
    const returnExpiryDate = order.products[productIndex].deliveryDate;

    returnExpiryDate.setDate(returnExpiryDate.getDate() + 7);

    if (currentDate <= returnExpiryDate) {
      if (order.products[productIndex].reasonForRejection) {
        await orderSchema.updateOne(
          { _id: orderID },
          { $unset: { [`products.${productIndex}.reasonForRejection`]: "" } }
        );
      }

      order.products[productIndex].status = "Pending-Return";
      order.products[productIndex].reasonForReturn = returnReason;

      await order.save();

      req.flash("alert", {
        message: "Return request successful!",
        color: "bg-success",
      });
    } else {
      req.flash("alert", {
        message: "Return request unsuccessful!",
        color: "bg-danger",
      });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.log("Error while requesting return", error);

    res.status(500).json({ error });
  }
};
/* -------------------------------------------------------------------------- */

/* --------------- for adding reviews for products -------------- */
const addReview = async (req, res) => {
  try {
    const productID = req.query.productID;
    const rating = req.query.rating;
    const description = req.query.review;
    let totalRating = 0;
    let userReviewed = false;

    const productReview = await reviewSchema.findOne({ productID });

    /* ---------------------- checks if product has reviews --------------------- */
    if (productReview) {
      /* ------------------ if user already reviewed then update ------------------ */
      productReview.reviews.forEach((review) => {
        if (review.userID.toString() === req.session.user.toString()) {
          review.rating = rating;
          review.description = description;
          userReviewed = true;
        }
      });

      /* ------------ if user didn't reviewed yet then post new review ----------- */
      if (!userReviewed) {
        productReview.reviews.push({
          userID: req.session.user,
          rating,
          description,
        });
      }
    } else {
      /* ---------------- if product has no review, then create one --------------- */
      const newReview = new reviewSchema({
        productID,
        averageRating: rating,
        reviews: [
          {
            userID: req.session.user,
            rating,
            description,
          },
        ],
      });

      await newReview.save();

      req.flash("alert", {
        message: "Review posted successfully!",
        color: "bg-success",
      });
      return res.status(200).json({ success: true });
    }

    /* ----------------- calculating total rating of the product ---------------- */
    productReview.reviews.forEach((review) => {
      totalRating += review.rating;
    });

    /* --- average rating is being calculated and assigned to product review --- */
    productReview.averageRating = (
      totalRating / productReview.reviews.length
    ).toFixed(1);

    await productReview.save();

    req.flash("alert", {
      message: "Review posted successfully!",
      color: "bg-success",
    });
    res.status(200).json({ success: true });
  } catch (error) {
    console.log("Error while adding product review", error);

    res.status(500).json({ error });
  }
};
/* -------------------------------------------------------------------------- */

/* --------------- for downloading invoice  -------------- */
const generateInvoice = async (req, res) => {
  try {
    function scrambleString(str) {
      const shufflePattern = [
        12, 5, 19, 2, 17, 0, 22, 9, 14, 8, 3, 15, 1, 18, 6, 11, 4, 13, 7, 10,
        16, 21, 20, 23,
      ];
      const scrambledArray = shufflePattern.map((i) => str[i]).slice(0, 20);
      return scrambledArray.join("");
    }

    const { orderID, index } = req.body;

    const order = await orderSchema.findById(orderID);
    const product = order.products[index];

    let orderTotalPrice = 0;
    let productAmount = 0;
    let productShare = 0; //  product share for calculating coupon discount
    let couponDiscount = 0; // share of coupon discount for the item, if any
    let discount = 0;
    let deliveryCharge = 0;

    discount = (product.price * product.discount / 100) * product.quantity;

    order.products.forEach((ele) => {
      orderTotalPrice += ele.productID.productDiscountedPrice * ele.quantity;
    });

    productShare =
      (order.products[index].productID.productDiscountedPrice *
        order.products[index].quantity) /
      orderTotalPrice;

    productAmount =
      order.products[index].productID.productDiscountedPrice *
      order.products[index].quantity;

    if (order.couponDiscount > 0) {
      orderTotalPrice -= order.couponDiscount;

      couponDiscount = order.couponDiscount * productShare;
      productAmount -= Math.round(couponDiscount);
    }

    if (orderTotalPrice < 500) {
      deliveryCharge += 40 * order.products[index].quantity;
      productAmount += deliveryCharge;
    }
    console.log(productAmount);

    const data = {
      invoiceId: scrambleString(order._id.toString()),
      productName: product.productName,
      quantity: product.quantity,
      price: product.price,
      discount,
      couponDiscount,
      total: productAmount,
    };

    // Generate PDF buffer
    const pdfBuffer = await generatePDFInvoice(data);

    // Set response headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment;");

    // Send the PDF buffer
    res.send(pdfBuffer);
  } catch (error) {
    console.log("Error while generating invoice", error);

    res.status(500).json({ error });
  }
};
/* -------------------------------------------------------------------------- */

module.exports = {
  order,
  cancelOrderPost,
  returnOrderPost,
  addReview,
  generateInvoice,
};
