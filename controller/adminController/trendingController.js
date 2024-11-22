const orderSchema = require("../../model/orderSchema");

/* ---------------------------------- will render the trending page ---------------------------------- */
const getTrending = async (req, res) => {
  try {
    res.render("admin/trending", {
      title: "Trending",
      alert: req.flash("alert"),
    });
  } catch (err) {
    console.log("Error while rendering the trending page", err);
  }
};
/* -------------------------------------------------------------------------- */

module.exports = {
  getTrending,
};
