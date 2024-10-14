const userSchema = require('../../model/userSchema');
const categorySchema = require('../../model/categorySchema');
const productSchema = require('../../model/productSchema');
const cartSchema = require('../../model/cartSchema');
const orderSchema = require('../../model/orderSchema');

/* ------------------- will render the order confirm page ------------------- */
const orderConfirmation = async (req, res) => {
  try {
    /* ---------- querying active categories for including in the navbar --------- */
    const activeCategories = await productSchema.find({
      isActive: true,
      productCategory: { $in: await categorySchema.find({ isActive: true }).select('_id') }
    })
      .populate('productCategory');

    const activeCategoryNames = Array.from(new Set(activeCategories.map(product => product.productCategory.categoryName))).sort((a, b) => a.localeCompare(b));

    res.render('user/orderConfirmation', {
      title: 'Order Confirmation',
      alert: req.flash('alert'),
      user: req.session.user,
      activeCategoryNames,
      content: ''
    });
  } catch (err) {
    console.log('Error while rendering order confirmation page', err);
  }
}
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
        path: 'items.productID',
        populate: {
          path: 'productCategory'
        }
      });

    let totalProductQuantity = 0;

    /* ---- checking whether any of the product is available or not ---- */
    if (cart) {
      cart.totalPrice = 0;

      for (const product of cart.items) {
        totalProductQuantity += product.productCount;
        product.productPrice = product.productID.productPrice;
        cart.totalPrice += product.productID.productPrice * product.productCount;

        if (product.productID.productQuantity === 0 || product.productID.productQuantity < product.productCount || product.productCount === 0) {
          req.flash('alert', { message: 'One or more products is not available. Try again!', color: 'bg-danger' });

          return res.redirect('/cart');
        }
      }
    } else {
      req.flash('alert', { message: 'Your cart is empty. Try again!', color: 'bg-danger' });

      return res.redirect('/home');
    }

    /* ----------------- will add delivery charge if applicable ----------------- */
    if (cart.payableAmount < 500) {
      cart.payableAmount += (40 * totalProductQuantity);
    }

    await cart.save();

    cart.items.sort((a, b) => b.createdAt - a.createdAt);

    /* ---------- querying active categories for including in the navbar --------- */
    const activeCategories = await productSchema.find({
      isActive: true,
      productCategory: { $in: await categorySchema.find({ isActive: true }).select('_id') }
    })
      .populate('productCategory');

    const activeCategoryNames = Array.from(new Set(activeCategories.map(product => product.productCategory.categoryName))).sort((a, b) => a.localeCompare(b));

    res.render('user/checkout', {
      title: 'Checkout',
      alert: req.flash('alert'),
      cart,
      products: cart.items,
      userAddress,
      addresses,
      user: req.session.user,
      activeCategoryNames,
      content: ''
    });
  } catch (err) {
    console.log('Error while rendering the checkout page', err);
  }
}
/* -------------------------------------------------------------------------- */

/* --------- will be used to place order based on the payment method -------- */
const orderPlacement = async (req, res) => {
  try {
    const addressIndex = req.query.addressIndex;
    const paymentMode = parseInt(req.query.paymentMode);

    const cart = await cartSchema.findOne({ userID: req.session.user }).populate('items.productID');
    const paymentMethod = ['Cash on delivery'];
    const products = [];
    let totalQuantity = 0;

    for (const ele of cart.items) {
      /* ------ if any of the products quantity is zero then redirect to cart ----- */
      if (ele.productID.productQuantity === 0) {
        req.flash('alert', { message: 'One or more products is not available. Try again!', color: 'bg-danger' });

        return res.status(404).json({ failed: true });
      }

      products.push({
        productID: ele.productID._id,
        productName: ele.productID.productName,
        quantity: ele.productCount,
        price: ele.productID.productPrice,
        discount: ele.productID.productDiscount,
        productImage: ele.productID.productImage[0]
      });

      totalQuantity += ele.productCount;
    };

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
        area: userDetails.address[addressIndex].area
      },
      paymentMethod: paymentMethod[paymentMode],
      orderStatus: "Confirmed"
    });

    await newOrder.save();

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
    console.log('Error while placing order', err);

    return res.status(500).json({ error: `Error while placing order: ${err.message}` });
  }
};
/* -------------------------------------------------------------------------- */

module.exports = {
  orderConfirmation,
  checkout,
  orderPlacement
};