const categorySchema = require('../../model/categorySchema');
const productSchema = require('../../model/productSchema');
const cartSchema = require('../../model/cartSchema');

/* --------------------- will render the user cart page --------------------- */
const cart = async (req, res) => {
  try {
    /* -------------------- get the carts from the collection ------------------- */
    const cart = await cartSchema
      .findOne({ userID: req.session.user })
      .populate({
        path: 'items.productID',
        populate: {
          path: 'productCategory'
        }
      });

    var totalPrice = 0;
    var totalPriceWithoutDiscount = 0;

    if (cart) {
      /* ------------------- find the total price of cart items ------------------- */
      cart.items.forEach((ele) => {
        /* -------- finding the total price by deducting the discount if any -------- */
        if (ele.productID.productDiscount === 0) {
          totalPrice += ele.productID.productPrice * ele.productCount;
          totalPriceWithoutDiscount +=
            ele.productID.productPrice * ele.productCount;
        } else {
          const discountPrice =
            ele.productID.productPrice * ele.productCount -
            (ele.productID.productDiscount / 100) *
            (ele.productID.productPrice * ele.productCount);
          totalPrice += discountPrice;
          totalPriceWithoutDiscount +=
            ele.productID.productPrice * ele.productCount;
        }
      });

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

    const activeCategories = await productSchema.find({
      isActive: true,
      productCategory: { $in: await categorySchema.find({ isActive: true }).select('_id') }
    })
      .populate('productCategory');

    const activeCategoryNames = Array.from(new Set(activeCategories.map(product => product.productCategory.categoryName))).sort((a, b) => a.localeCompare(b));

    res.render('user/cart', {
      title: 'Cart',
      alert: req.flash('alert'),
      user: req.session.user,
      activeCategoryNames,
      content: '',
      cart
    });
  } catch (err) {
    console.log('Error while rendering cart page', err);
  }
};
/* -------------------------------------------------------------------------- */

/* ---------------------------- for adding product to the cart --------------------------- */
const addToCartPost = async (req, res) => {
  try {
    const productID = req.query.productId;
    const userID = req.session.user;
    const productPrice = parseInt(req.query.productPrice);

    // find the product from the collection
    const product = await productSchema.findById(productID);

    if (!product || product.productQuantity <= 0) {
      return res.status(404).json({ error: "Product is out of stock" });
    }

    // checks if the user already has a cart
    const userCart = await cartSchema
      .findOne({ userID })
      .populate("items.productID");

    if (userCart) {
      const productExists = userCart.items.some(
        (item) => item.productID.id === productID
      );

      if (productExists) {
        return res
          .status(400)
          .json({ error: "Product already exists in the cart" });
      } else {
        userCart.items.push({
          productID: product._id,
          productCount: 1,
          productPrice,
        });
        await userCart.save();
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
    console.error(`Error adding product to cart: ${err}`);

    return res
      .status(500)
      .json({ error: `Cannot add product to cart: ${err}` });
  }
};
/* -------------------------------------------------------------------------- */

module.exports = {
  cart,
  addToCartPost,
};