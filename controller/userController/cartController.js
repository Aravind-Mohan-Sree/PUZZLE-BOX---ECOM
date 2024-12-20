const categorySchema = require("../../model/categorySchema");
const productSchema = require("../../model/productSchema");
const cartSchema = require("../../model/cartSchema");
const couponSchema = require("../../model/couponSchema");

/* --------------------- will render the user cart page --------------------- */
const cart = async (req, res) => {
  try {
    /* -------------------- get the carts from the collection ------------------- */
    const cart = await cartSchema
      .findOne({ userID: req.session.user })
      .populate({
        path: "items.productID",
        populate: {
          path: "productCategory",
        },
      });

    const coupons = await couponSchema.aggregate([
      { $match: { isActive: true, expiryDate: { $gt: new Date() } } },
      { $sort: { createdAt: -1 } },
    ]);

    let totalPrice = 0;
    let totalPriceWithoutDiscount = 0;
    let totalProductQuantity = 0;
    let deliveryCharge = 0;

    if (cart) {
      /* ------------------- find the total price of cart items ------------------- */
      cart.items.forEach((ele) => {
        totalProductQuantity += ele.productCount;

        /* - if product actual quantity is less than selected count then update product count - */
        if (ele.productID.productQuantity <= ele.productCount) {
          ele.productCount = ele.productID.productQuantity;
        }

        if (ele.productCount === 0 && ele.productID.productQuantity !== 0) {
          ele.productCount = 1;
        }

        ele.productPrice = ele.productID.productPrice;

        // finding total amount and payable amount
        totalPrice += ele.productID.productDiscountedPrice * ele.productCount;
        totalPriceWithoutDiscount +=
          ele.productID.productPrice * ele.productCount;
      });

      // if there is a coupon applied to cart then deduct that too from total price
      if (cart.coupon) {
        if (
          new Date() < new Date(cart.coupon.expiryDate) &&
          totalPrice >= cart.coupon.minPurchase
        ) {
          totalPrice -= cart.coupon.discount;
        } else {
          if (totalPrice < cart.coupon.minPurchase) {
            req.flash("alert", {
              message: "Coupon removed!",
              color: "bg-danger",
            });
          } else {
            req.flash("alert", {
              message: "Coupon expired!",
              color: "bg-danger",
            });
          }

          cart.coupon = undefined;
        }
      }

      if (totalPrice < 500) {
        deliveryCharge += 40 * totalProductQuantity;
        totalPrice += deliveryCharge;
      }

      /* - updating the fields in collection if those varies from the total price - */
      if (
        cart.payableAmount != totalPrice ||
        cart.totalPrice != totalPriceWithoutDiscount
      ) {
        cart.payableAmount = Math.round(totalPrice);
        cart.totalPrice = Math.round(totalPriceWithoutDiscount);

        await cart.save();
      }

      cart.items.sort((a, b) => b.createdAt - a.createdAt);
    }

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

    res.render("user/cart", {
      title: "Cart",
      alert: req.flash("alert"),
      user: req.session.user,
      activeCategoryNames,
      content: "",
      cart,
      deliveryCharge,
      coupons,
    });
  } catch (err) {
    console.log("Error while rendering cart page", err);
  }
};
/* -------------------------------------------------------------------------- */

/* ---------------------------- for adding product to the cart --------------------------- */
const addToCartPost = async (req, res) => {
  try {
    const productID = req.query.productId;
    const userID = req.session.user;
    const productPrice = parseInt(req.query.productPrice);

    /* ------------------ find the product from the collection ------------------ */
    const product = await productSchema.findById(productID);

    if (!product || product.productQuantity <= 0) {
      return res.status(404).json({ error: "Product is out of stock" });
    }

    /* ------------------ checks if the user already has a cart ----------------- */
    const cart = await cartSchema
      .findOne({ userID })
      .populate("items.productID");

    if (cart) {
      const productExists = cart.items.some(
        (item) => item.productID.id === productID
      );

      if (productExists) {
        return res
          .status(400)
          .json({ error: "Product already exists in the cart" });
      } else {
        cart.items.push({
          productID: product._id,
          productCount: 1,
          productPrice,
        });
        await cart.save();
      }
    } else {
      const newCart = new cartSchema({
        userID,
        items: [
          {
            productID: product._id,
            productCount: 1,
            productPrice,
          },
        ],
      });
      await newCart.save();
    }

    return res.status(200).json({ success: "Product added to cart" });
  } catch (err) {
    console.error("Error while adding product to cart", err);

    return res
      .status(500)
      .json({ error: `Cannot add product to cart: ${err}` });
  }
};
/* -------------------------------------------------------------------------- */

/* ------------------- will increase the product quantity ------------------- */
const increaseProductQuantity = async (req, res) => {
  try {
    const productID = req.params.productID;
    let productQuantity = req.body.quantity;

    if (!productQuantity) {
      return res.status(404).json({ error: "Product quantity not found" });
    }

    const cart = await cartSchema
      .findOne({ userID: req.session.user })
      .populate("items.productID");

    /* ----------------- filtering the current product from cart ---------------- */
    const currentProduct = cart.items.filter((ele) => {
      if (ele.productID.id === productID) {
        return ele;
      }
    });

    currentProduct[0].productCount += 1;

    let totalPrice = 0;
    let productTotal = 0;
    let productDiscount = 0;
    let totalPriceWithoutDiscount = 0;
    let deliveryCharge = 0;
    let totalProductQuantity = 0;

    /* - if product actual quantity is less than selected count then update product count - */
    if (
      currentProduct[0].productID.productQuantity <
      currentProduct[0].productCount
    ) {
      currentProduct[0].productCount =
        currentProduct[0].productID.productQuantity;
    }

    if (currentProduct[0].productCount > 5) {
      currentProduct[0].productCount = 5;
    }

    cart.items.forEach((ele) => {
      totalProductQuantity += ele.productCount;
      totalPriceWithoutDiscount +=
        ele.productID.productPrice * ele.productCount;
      totalPrice += ele.productID.productDiscountedPrice * ele.productCount;

      if (ele.productID.id === productID) {
        productTotal = ele.productID.productPrice * ele.productCount;
        productDiscount =
          ele.productID.productDiscountedPrice * ele.productCount;
      }
    });

    if (cart.coupon) {
      totalPrice -= cart.coupon.discount;
    }

    let discount = totalPriceWithoutDiscount - totalPrice;

    if (totalPrice < 500) {
      deliveryCharge += 40 * totalProductQuantity;
      totalPrice += deliveryCharge;
    }

    /* --------------- update the total payable amount of the cart -------------- */
    cart.payableAmount = Math.round(totalPrice);
    cart.totalPrice = Math.round(totalPriceWithoutDiscount);

    await cart.save();

    if (
      ++productQuantity > 5 &&
      currentProduct[0].productID.productQuantity >
        currentProduct[0].productCount
    ) {
      return res.status(404).json({
        title: "Limit Reached",
        error: "Maximum quantity allowed is 5",
        icon: "info",
        productCount: currentProduct[0].productCount,
        productTotal,
        productDiscount,
        payableAmount: cart.payableAmount,
        totalAmount: totalPriceWithoutDiscount,
        discount,
        deliveryCharge,
      });
    }

    if (++productQuantity > currentProduct[0].productID.productQuantity) {
      return res.status(404).json({
        title: "Out of stock",
        error: `Only ${currentProduct[0].productID.productQuantity} left`,
        icon: "warning",
        productCount: currentProduct[0].productCount,
        productTotal,
        productDiscount,
        payableAmount: cart.payableAmount,
        totalAmount: totalPriceWithoutDiscount,
        discount,
        deliveryCharge,
      });
    }

    return res.status(200).json({
      productCount: currentProduct[0].productCount,
      productTotal,
      productDiscount,
      payableAmount: cart.payableAmount,
      totalAmount: totalPriceWithoutDiscount,
      discount,
      deliveryCharge,
    });
  } catch (err) {
    console.log("Error while increasing the product quantity", err);

    return res.status(500).json({ error: err });
  }
};
/* -------------------------------------------------------------------------- */

/* ------------------- will decrease the product quantity ------------------- */
const decreaseProductQuantity = async (req, res) => {
  try {
    const productID = req.params.productID;
    const productQuantity = req.body.quantity;

    if (!productQuantity) {
      return res.status(404).json({ error: "Product quantity not found" });
    }

    /* ----------------- filtering the current product from cart ---------------- */
    const cart = await cartSchema
      .findOne({ userID: req.session.user })
      .populate("items.productID");

    const currentProduct = cart.items.find(
      (ele) => ele.productID.id === productID
    );

    if (!currentProduct) {
      return res.status(404).json({ error: "Product not found in cart" });
    }

    currentProduct.productCount -= 1;

    let totalPrice = 0;
    let productTotal = 0;
    let productDiscount = 0;
    let totalPriceWithoutDiscount = 0;
    let deliveryCharge = 0;
    let totalProductQuantity = 0;
    let productCount = 0;
    let couponRemoved = false;

    /* Handle the case when product count becomes 0 or less */
    if (currentProduct.productCount <= 0) {
      if (currentProduct.productID.productQuantity > 0) {
        currentProduct.productCount = 1;
        productCount = 1;
      } else {
        productCount = 0;
      }
    } else {
      productCount = currentProduct.productCount;
    }

    /* - if product actual quantity is less than selected count then update product count - */
    if (
      currentProduct.productID.productQuantity < currentProduct.productCount
    ) {
      currentProduct.productCount = currentProduct.productID.productQuantity;
      productCount = currentProduct.productCount;
    }

    cart.items.forEach((ele) => {
      totalProductQuantity += ele.productCount;
      totalPriceWithoutDiscount +=
        ele.productID.productPrice * ele.productCount;
      totalPrice += ele.productID.productDiscountedPrice * ele.productCount;

      if (ele.productID.id === productID) {
        productTotal = ele.productID.productPrice * ele.productCount;
        productDiscount =
          ele.productID.productDiscountedPrice * ele.productCount;
      }
    });

    /* ---------------- if payable amount is greater than minimum purchase then update totalPrice otherwise delete the coupon from cart --------------- */
    if (cart.coupon) {
      if (totalPrice >= cart.coupon.minPurchase) {
        totalPrice -= cart.coupon.discount;
      } else {
        cart.coupon = undefined;

        couponRemoved = true;

        req.flash("alert", { message: "Coupon removed!", color: "bg-danger" });
      }
    }

    let discount = totalPriceWithoutDiscount - totalPrice;

    if (totalPrice < 500) {
      deliveryCharge += 40 * totalProductQuantity;
      totalPrice += deliveryCharge;
    }

    /* --------------- update the total payable amount of the cart -------------- */
    cart.payableAmount = Math.round(totalPrice);
    cart.totalPrice = Math.round(totalPriceWithoutDiscount);

    await cart.save();

    return res.status(200).json({
      productCount,
      productTotal,
      productDiscount,
      payableAmount: cart.payableAmount,
      totalAmount: totalPriceWithoutDiscount,
      discount,
      deliveryCharge,
      couponRemoved,
    });
  } catch (err) {
    console.log("Error while decreasing the product quantity", err);

    return res.status(500).json({ error: err.message });
  }
};
/* -------------------------------------------------------------------------- */

/* -------------------- will delete product from the cart ------------------- */
const removeCartItem = async (req, res) => {
  try {
    const productID = req.params.productID;

    const cart = await cartSchema
      .findOne({ userID: req.session.user })
      .populate("items.productID");

    /* -------------- filtering out products except the removed one ------------- */
    const newCart = cart.items.filter((item) => {
      return item.productID.id !== productID;
    });

    cart.items = newCart;

    let totalPrice = 0;

    cart.items.forEach((ele) => {
      // finding payable amount
      totalPrice += ele.productID.productDiscountedPrice * ele.productCount;
    });

    /* ---------------- if payable amount is greater than minimum purchase then update totalPrice otherwise delete the coupon from cart --------------- */
    if (cart.coupon) {
      if (totalPrice < cart.coupon.minPurchase) {
        cart.coupon = undefined;

        req.flash("alert", { message: "Coupon removed!", color: "bg-danger" });
      }
    }

    await cart.save();

    if (newCart.length === 0) {
      await cartSchema.deleteOne({ userID: req.session.user });
    }

    return res.status(200).json({
      delete: true,
    });
  } catch (err) {
    console.log("Error while deleting the product", err);

    return res.status(500).json({ error: err.message });
  }
};
/* -------------------------------------------------------------------------- */

/* -------------------- will apply coupon discount to cart ------------------- */
const applyCoupon = async (req, res) => {
  try {
    const { couponID } = req.params;

    const coupon = await couponSchema.findById(couponID);
    const cart = await cartSchema.findOne({ userID: req.session.user });

    /* ----------------- if same coupon exist respond with error ---------------- */
    if (cart.coupon && cart.coupon.code === coupon.code) {
      return res.status(400).json({ error: "Coupon already applied" });
    }

    let isExpired = new Date() < new Date(coupon.expiryDate) ? false : true;

    if (isExpired || !coupon.isActive) {
      return res.status(400).json({ error: "Coupon not available" });
    }

    const payableWithoutCoupon = cart.coupon
      ? cart.payableAmount + cart.coupon.discount
      : cart.payableAmount;

    /* -------- checking if payable amount is less than minimum purchase -------- */
    if (payableWithoutCoupon < coupon.minPurchase) {
      return res
        .status(400)
        .json({ error: "Payable amount do not meet minimum purchase" });
    }

    cart.payableAmount = payableWithoutCoupon - coupon.discount;

    cart.coupon = {
      name: coupon.name,
      code: coupon.code,
      discount: coupon.discount,
      minPurchase: coupon.minPurchase,
      expiryDate: coupon.expiryDate,
    };

    await cart.save();

    req.flash("alert", {
      message: "Coupon applied successfully!",
      color: "bg-success",
    });
    return res.status(200).json({ success: true });
  } catch (err) {
    console.log("Error while applying coupon to cart", err);

    return res.status(500).json({ error: err.message });
  }
};
/* -------------------------------------------------------------------------- */

/* -------------------- will remove coupon discount from cart ------------------- */
const removeCoupon = async (req, res) => {
  try {
    const cart = await cartSchema.findOne({ userID: req.session.user });

    cart.payableAmount += cart.coupon.discount;
    cart.coupon = undefined;

    await cart.save();

    req.flash("alert", {
      message: "Coupon removed successfully!",
      color: "bg-success",
    });
    return res.status(200).json({ success: true });
  } catch (err) {
    console.log("Error while removing coupon from cart", err);

    return res.status(500).json({ error: err.message });
  }
};
/* -------------------------------------------------------------------------- */

module.exports = {
  cart,
  addToCartPost,
  removeCartItem,
  increaseProductQuantity,
  decreaseProductQuantity,
  applyCoupon,
  removeCoupon,
};
