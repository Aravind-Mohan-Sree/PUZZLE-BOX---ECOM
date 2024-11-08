const userSchema = require("../../model/userSchema");
const categorySchema = require("../../model/categorySchema");
const productSchema = require("../../model/productSchema");
const cartSchema = require("../../model/cartSchema");
const orderSchema = require("../../model/orderSchema");
const walletSchema = require("../../model/walletSchema");
const Razorpay = require("razorpay");

/* ------------------- will render the order confirm page ------------------- */
const orderConfirmation = async (req, res) => {
  try {
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

    res.render("user/orderConfirmation", {
      title: "Order Confirmation",
      alert: req.flash("alert"),
      user: req.session.user,
      activeCategoryNames,
      content: "",
    });
  } catch (err) {
    console.log("Error while rendering order confirmation page", err);
  }
};
/* -------------------------------------------------------------------------- */

/* ---------------------- will render the checkout page --------------------- */
const checkout = async (req, res) => {
  try {
    /* ---------------------- finding current user address ---------------------- */
    const userAddress = await userSchema.findById(req.session.user);

    /* ----------------- getting addresses from the user address ---------------- */
    const addresses = userAddress.address;

    const cart = await cartSchema
      .findOne({ userID: req.session.user })
      .populate({
        path: "items.productID",
        populate: {
          path: "productCategory",
        },
      });

    const wallet = await walletSchema.findOne({ userID: req.session.user });

    if (cart?.coupon && new Date() >= new Date(cart.coupon.expiryDate)) {
      cart.coupon = undefined;

      req.flash("alert", { message: "Coupon expired!", color: "bg-danger" });

      return res.redirect("/cart");
    }

    let totalProductQuantity = 0;

    /* ---- checking whether any of the product is available or not ---- */
    if (cart) {
      cart.totalPrice = 0;

      for (const product of cart.items) {
        totalProductQuantity += product.productCount;
        product.productPrice = product.productID.productPrice;
        cart.totalPrice +=
          product.productID.productPrice * product.productCount;

        if (
          product.productID.productQuantity === 0 ||
          product.productID.productQuantity < product.productCount ||
          product.productCount === 0
        ) {
          req.flash("alert", {
            message: "One or more products is not available. Try again!",
            color: "bg-danger",
          });

          return res.redirect("/cart");
        }
      }
    } else {
      req.flash("alert", {
        message: "Your cart is empty. Try again!",
        color: "bg-danger",
      });

      return res.redirect("/home");
    }

    /* ----------------- will add delivery charge if applicable ----------------- */
    if (cart.payableAmount < 500) {
      cart.payableAmount += 40 * totalProductQuantity;
    }

    await cart.save();

    cart.items.sort((a, b) => b.createdAt - a.createdAt);

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

    res.render("user/checkout", {
      title: "Checkout",
      alert: req.flash("alert"),
      cart,
      wallet,
      products: cart.items,
      userAddress,
      addresses,
      user: req.session.user,
      activeCategoryNames,
      content: "",
    });
  } catch (err) {
    console.log("Error while rendering the checkout page", err);
  }
};
/* -------------------------------------------------------------------------- */

/* --------- will be used to place order based on the payment method -------- */
const orderPlacement = async (req, res) => {
  try {
    const addressIndex = req.query.addressIndex;
    const paymentMode = parseInt(req.query.paymentMode);
    let paymentId = "";

    const cart = await cartSchema
      .findOne({ userID: req.session.user })
      .populate("items.productID");

    const wallet = await walletSchema
      .findOne({ userID: req.session.user })
      .populate("transactions.orderID");

    const paymentMethod = ["Cash on delivery", "Razorpay", "Wallet"];
    const products = [];
    let totalQuantity = 0;

    if (cart?.coupon && new Date() >= new Date(cart.coupon.expiryDate)) {
      return res.status(404).json({ failed: true });
    }

    if (paymentMode === 0 && cart.payableAmount >= 1000) {
      return res.status(404).json({ CODNotAvailable: true });
    }

    if (paymentMode === 1) {
      const razorpay_payment_id = req.body.razorpay_payment_id;
      const razorpay_order_id = req.body.razorpay_order_id;
      const razorpay_signature = req.body.razorpay_signature;

      paymentId = razorpay_payment_id;
    }

    if (
      paymentMode === 2 &&
      (!wallet || wallet?.balance < cart.payableAmount)
    ) {
      return res.status(404).json({ insufficientFunds: true });
    }

    for (const ele of cart.items) {
      /* ------ if any of the products quantity is zero then redirect to cart ----- */
      if (
        ele.productID.productQuantity === 0 ||
        ele.productID.productQuantity < ele.productCount
      ) {
        req.flash("alert", {
          message: "One or more products is not available. Try again!",
          color: "bg-danger",
        });

        return res.status(404).json({ failed: true });
      }

      products.push({
        productID: ele.productID._id,
        productName: ele.productID.productName,
        quantity: ele.productCount,
        price: ele.productID.productPrice,
        discount: ele.productID.productDiscount,
        productImage: ele.productID.productImage[0],
        status: "Confirmed",
      });

      totalQuantity += ele.productCount;
    }

    const userDetails = await userSchema.findById(req.session.user);

    /* ------------- creating new order with the products from cart ------------- */
    const newOrder = new orderSchema({
      userID: req.session.user,
      products,
      totalQuantity,
      totalPrice: cart.payableAmount,
      address: {
        contactName: userDetails.address[addressIndex].contactName,
        phone: userDetails.address[addressIndex].phone,
        pincode: userDetails.address[addressIndex].pincode,
        state: userDetails.address[addressIndex].state,
        city: userDetails.address[addressIndex].city,
        house: userDetails.address[addressIndex].house,
        area: userDetails.address[addressIndex].area,
      },
      couponDiscount: cart.coupon?.discount || 0,
      paymentMethod: paymentMethod[paymentMode],
    });

    await newOrder.save();

    if (paymentMode === 2) {
      wallet.balance -= newOrder.totalPrice;
      wallet.transactions.push({
        orderID: newOrder._id,
        reason: "Order Payment",
        amount: newOrder.totalPrice,
        type: "debit",
        runningBalance: wallet.balance,
      });

      await wallet.save();
    }

    /* ------- updating actual product quantity by deducting product count ------ */
    for (const ele of cart.items) {
      const product = await productSchema.findById(ele.productID._id);

      if (product) {
        product.productQuantity -= ele.productCount;
        product.productQuantity = Math.max(product.productQuantity, 0);

        await product.save();
      }
    }

    /* --------------- deleting user cart after order confirmation -------------- */
    await cartSchema.deleteOne({ userID: req.session.user });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.log("Error while placing order", err);

    return res
      .status(500)
      .json({ error: `Error while placing order: ${err.message}` });
  }
};
/* -------------------------------------------------------------------------- */

/* -------------- payment renderer for Razorpay payment method -------------- */
const paymentRenderer = async (req, res) => {
  try {
    const cart = await cartSchema
      .findOne({ userID: req.session.user })
      .populate({
        path: "items.productID",
        populate: {
          path: "productCategory",
        },
      });

    if (cart?.coupon && new Date() >= new Date(cart.coupon.expiryDate)) {
      return res.status(404).json({ failed: true });
    }

    for (const product of cart.items) {
      if (
        product.productID.productQuantity === 0 ||
        product.productID.productQuantity < product.productCount
      ) {
        req.flash("alert", {
          message: "One or more products is not available. Try again!",
          color: "bg-danger",
        });

        return res.status(400).json({ failed: true });
      }
    }

    const payableAmount = cart.payableAmount;

    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    /* ------------------------ creates an order instance ----------------------- */
    instance.orders.create(
      {
        amount: payableAmount * 100,
        currency: "INR",
        receipt: "receipt#1",
      },
      (err, order) => {
        if (err) {
          console.error("Failed to create order", err);

          return res
            .status(500)
            .json({ error: `Failed to create order: ${err.message}` });
        }

        return res.status(201).json({
          order,
        });
      }
    );
  } catch (err) {
    console.error("Error while rendering payment", err);

    return res.status(500).json({ error: "Internal server error" });
  }
};
/* -------------------------------------------------------------------------- */

/* ---------------- controller which handles failed payments ---------------- */
const failedPayment = async (req, res) => {
  try {
    const products = [];
    let totalQuantity = 0;

    const cart = await cartSchema
      .findOne({ userID: req.session.user })
      .populate("items.productID");

    cart.items.forEach((ele) => {
      products.push({
        productID: ele.productID._id,
        productName: ele.productID.productName,
        brand: ele.productID.productBrand,
        quantity: ele.productCount,
        price: ele.productID.productPrice,
        discount: ele.productID.productDiscount,
        productImage: ele.productID.productImage[0],
      });

      totalQuantity += ele.productCount;
    });

    /* -------------------------- creating a new order -------------------------- */
    const newOrder = new orderSchema({
      userID: req.session.user,
      products,
      totalQuantity,
      totalPrice:
        cart.payableAmount < 550 ? cart.payableAmount - 50 : cart.payableAmount,
      paymentMethod: "Razorpay",
      orderStatus: "Pending",
      couponDiscount: cart.couponDiscount,
    });

    /* ---------------------------- saving the new order ---------------------------- */
    await newOrder.save();

    /* --------------- deleting user cart after saving the order --------------- */
    await cartSchema.deleteOne({ userID: req.session.user });

    req.flash("alert", {
      message: "Payment could not be processed. Try again!",
      color: "bg-danger",
    });

    res.redirect("/orders");
  } catch (err) {
    console.log("Error while handling failed payment", err);
  }
};
/* -------------------------------------------------------------------------- */

/* ------------------------ will proceed with payment ----------------------- */
const proceedPayment = async (req, res) => {
  try {
    const orderID = req.query.orderID;

    const order = await orderSchema.findById(orderID);

    const cart = await cartSchema.findOne({ userID: req.session.user });

    const items = [];
    let totalPrice = 0;
    let totalQuantity = 0;

    order.products.forEach((product) => {
      items.push({
        productID: product.productID,
        productCount: product.quantity,
        productPrice: product.price,
      });
      totalPrice += product.price * product.quantity;
      totalQuantity += product.quantity;
    });

    if (cart) {
      /* ------------------------- deleting the user cart ------------------------- */
      await cartSchema.findByIdAndDelete(cart.id);

      /* --------------------------- creating a new cart -------------------------- */
      const newCart = new cartSchema({
        userID: req.session.user,
        items: items,
        payableAmount: order.totalPrice,
        totalPrice: totalPrice,
        couponDiscount: 0,
      });

      /* --------------------------- saving the new cart -------------------------- */
      await newCart.save();

      /* --------------------------- deleting the order --------------------------- */
      await orderSchema.findByIdAndDelete(orderID);

      return res.status(200).json({ success: true, url: "/proceed-checkout" });
    } else {
      const newCart = new cartSchema({
        userID: req.session.user,
        items: items,
        payableAmount: order.totalPrice,
        totalPrice: totalPrice,
        couponDiscount: 0,
      });

      await newCart.save();

      await orderSchema.findByIdAndDelete(orderID);

      return res.status(200).json({ success: true, url: "/proceed-checkout" });
    }
  } catch (err) {
    console.log("Error while proceeding with failed payment", err);
  }
};

module.exports = {
  orderConfirmation,
  checkout,
  orderPlacement,
  paymentRenderer,
  failedPayment,
  proceedPayment,
};
