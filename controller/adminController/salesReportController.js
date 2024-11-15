const categorySchema = require("../../model/categorySchema");
const productSchema = require("../../model/productSchema");
const orderSchema = require("../../model/orderSchema");

/* ---------------------- will render sales report page --------------------- */
const getSalesReport = async (req, res) => {
  try {
    const orders = await orderSchema.find();

    res.render("admin/salesReport", {
      title: "Sales Report",
      alert: req.flash("alert"),
      orders,
    });
  } catch (err) {
    console.log("Error while rendering sales report", err);
  }
};
/* -------------------------------------------------------------------------- */

module.exports = {
  getSalesReport,
};

const moment = require('moment');

// Get today's date
const today = moment();

// Calculate the start and end of the last week
const lastWeekStart = moment(today).subtract(1, 'week').startOf('week');
const lastWeekEnd = moment(today).subtract(1, 'week').endOf('week');

// Format the date range
const dateRange = `${lastWeekStart.format('MMM D')} - ${lastWeekEnd.format('MMM D')}`;

console.log(dateRange); // Output: Nov 8 - Nov 14