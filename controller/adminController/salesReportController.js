const orderSchema = require("../../model/orderSchema");
const generateExcelReport = require("../../services/generateExcelSalesReport");
const generatePDFReport = require("../../services/generatePDFSalesReport");

/* ---------------------- aggregate overall sales data ---------------------- */
const getOrderAnalytics = async (startDate = null, endDate = null) => {
  // If no dates provided, use default date ranges
  const currentDate = new Date();

  // Set up date ranges for default periods
  const startOfDay = new Date(currentDate);
  const endOfDay = new Date(currentDate);
  startOfDay.setHours(0, 0, 0, 0);
  endOfDay.setHours(23, 59, 59, 999);

  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(currentDate.getDate() - 7);
  startOfWeek.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(currentDate);
  startOfMonth.setDate(currentDate.getDate() - 30);
  startOfMonth.setHours(0, 0, 0, 0);

  const startOfYear = new Date(currentDate);
  startOfYear.setDate(currentDate.getDate() - 365);
  startOfYear.setHours(0, 0, 0, 0);

  const processingPipeline = [
    // First create full order context with discounted prices and actual discount amounts
    {
      $addFields: {
        products: {
          $map: {
            input: "$products",
            as: "product",
            in: {
              $mergeObjects: [
                "$$product",
                {
                  discountedPrice: {
                    $subtract: [
                      "$$product.price",
                      {
                        $multiply: [
                          "$$product.price",
                          { $divide: ["$$product.discount", 100] },
                        ],
                      },
                    ],
                  },
                  actualDiscount: {
                    $multiply: [
                      "$$product.price",
                      { $divide: ["$$product.discount", 100] },
                    ],
                  },
                },
              ],
            },
          },
        },
      },
    },

    // Calculate order total before any refunds
    {
      $addFields: {
        orderTotalPrice: {
          $reduce: {
            input: "$products",
            initialValue: 0,
            in: {
              $add: [
                "$$value",
                {
                  $multiply: ["$$this.discountedPrice", "$$this.quantity"],
                },
              ],
            },
          },
        },
      },
    },

    // Calculate order total after coupon discount
    {
      $addFields: {
        orderTotalAfterCoupon: {
          $subtract: ["$orderTotalPrice", { $ifNull: ["$couponDiscount", 0] }],
        },
      },
    },

    // Determine if delivery charge is applicable
    {
      $addFields: {
        isDeliveryChargeApplicable: {
          $cond: {
            if: { $lt: ["$orderTotalAfterCoupon", 500] },
            then: true,
            else: false,
          },
        },
      },
    },

    // Unwind products to process each individually
    { $unwind: "$products" },

    // Calculate product share of order total for coupon distribution
    {
      $addFields: {
        productShare: {
          $divide: [
            {
              $multiply: ["$products.discountedPrice", "$products.quantity"],
            },
            "$orderTotalPrice",
          ],
        },
      },
    },

    // Group and calculate metrics
    {
      $match: {
        "products.status": {
          $nin: ["Pending", "Cancelled", "Pending-Return", "Returned"],
        },
      },
    },

    // Facet to get both individual orders and aggregated metrics
    {
      $facet: {
        individualOrders: [
          {
            $group: {
              _id: "$_id",
              createdAt: { $first: "$createdAt" },
              paymentMethod: { $first: "$paymentMethod" },
              totalDiscount: {
                $sum: {
                  $multiply: ["$products.actualDiscount", "$products.quantity"],
                },
              },
              totalCouponDiscount: {
                $sum: {
                  $multiply: [
                    { $ifNull: ["$couponDiscount", 0] },
                    "$productShare",
                  ],
                },
              },
              deliveryCharges: {
                $first: {
                  $cond: {
                    if: "$isDeliveryChargeApplicable",
                    then: 40,
                    else: 0,
                  },
                },
              },
              totalSalesAmount: {
                $sum: {
                  $add: [
                    {
                      $subtract: [
                        {
                          $multiply: [
                            "$products.discountedPrice",
                            "$products.quantity",
                          ],
                        },
                        {
                          $multiply: [
                            { $ifNull: ["$couponDiscount", 0] },
                            "$productShare",
                          ],
                        },
                      ],
                    },
                    {
                      $cond: {
                        if: "$isDeliveryChargeApplicable",
                        then: { $multiply: ["$products.quantity", 40] },
                        else: 0,
                      },
                    },
                  ],
                },
              },
            },
          },
          {
            $project: {
              _id: 0,
              orderId: "$_id",
              createdAt: 1,
              paymentMethod: 1,
              totalDiscount: { $round: ["$totalDiscount", 2] },
              totalCouponDiscount: { $round: ["$totalCouponDiscount", 2] },
              deliveryCharges: { $round: ["$deliveryCharges", 2] },
              totalSalesAmount: { $round: ["$totalSalesAmount", 2] },
            },
          },
          {
            $sort: { createdAt: -1 },
          },
        ],
        aggregatedMetrics: [
          {
            $group: {
              _id: "$_id",
              totalDiscount: {
                $sum: {
                  $multiply: ["$products.actualDiscount", "$products.quantity"],
                },
              },
              totalCouponDiscount: {
                $sum: {
                  $multiply: [
                    { $ifNull: ["$couponDiscount", 0] },
                    "$productShare",
                  ],
                },
              },
              deliveryCharges: {
                $sum: {
                  $cond: {
                    if: "$isDeliveryChargeApplicable",
                    then: 40,
                    else: 0,
                  },
                },
              },
              totalSalesAmount: {
                $sum: {
                  $add: [
                    {
                      $subtract: [
                        {
                          $multiply: [
                            "$products.discountedPrice",
                            "$products.quantity",
                          ],
                        },
                        {
                          $multiply: [
                            { $ifNull: ["$couponDiscount", 0] },
                            "$productShare",
                          ],
                        },
                      ],
                    },
                    {
                      $cond: {
                        if: "$isDeliveryChargeApplicable",
                        then: 40,
                        else: 0,
                      },
                    },
                  ],
                },
              },
            },
          },
          {
            $group: {
              _id: null,
              totalSalesCount: { $sum: 1 },
              totalDiscount: { $sum: "$totalDiscount" },
              totalCouponDiscount: { $sum: "$totalCouponDiscount" },
              totalDeliveryCharges: { $sum: "$deliveryCharges" },
              totalSalesAmount: { $sum: "$totalSalesAmount" },
            },
          },
          {
            $project: {
              _id: 0,
              totalSalesCount: 1,
              totalDiscount: { $round: ["$totalDiscount", 2] },
              totalCouponDiscount: { $round: ["$totalCouponDiscount", 2] },
              totalDeliveryCharges: {
                $round: ["$totalDeliveryCharges", 2],
              },
              totalSalesAmount: { $round: ["$totalSalesAmount", 2] },
            },
          },
        ],
      },
    },
  ];

  const defaultMetrics = {
    totalSalesCount: 0,
    totalDiscount: 0,
    totalCouponDiscount: 0,
    totalDeliveryCharges: 0,
    totalSalesAmount: 0,
  };

  // If custom date range is provided, only get those results
  if (startDate && endDate) {
    const customRangeResults = await orderSchema.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(startDate),
            // $lte: new Date(endDate),
          },
        },
      },
      ...processingPipeline,
    ]);

    return {
      customRange: {
        metrics: customRangeResults[0]?.aggregatedMetrics[0] || defaultMetrics,
        orders: customRangeResults[0]?.individualOrders || [],
        dateRange: {
          start: startDate,
          end: endDate,
        },
      },
    };
  }

  // Get metrics for different time periods
  const dailyResults = await orderSchema.aggregate([
    { $match: { createdAt: { $gte: startOfDay, $lte: endOfDay } } },
    ...processingPipeline,
  ]);

  const weeklyResults = await orderSchema.aggregate([
    { $match: { createdAt: { $gte: startOfWeek, $lte: endOfDay } } },
    ...processingPipeline,
  ]);

  const monthlyResults = await orderSchema.aggregate([
    { $match: { createdAt: { $gte: startOfMonth, $lte: endOfDay } } },
    ...processingPipeline,
  ]);

  const yearlyResults = await orderSchema.aggregate([
    { $match: { createdAt: { $gte: startOfYear, $lte: endOfDay } } },
    ...processingPipeline,
  ]);

  // Get overall metrics (without date filter)
  const overallResults = await orderSchema.aggregate(processingPipeline);

  return {
    overall: overallResults[0]?.aggregatedMetrics[0] || defaultMetrics,
    daily: {
      metrics: dailyResults[0]?.aggregatedMetrics[0] || defaultMetrics,
      orders: dailyResults[0]?.individualOrders || [],
    },
    weekly: {
      metrics: weeklyResults[0]?.aggregatedMetrics[0] || defaultMetrics,
      orders: weeklyResults[0]?.individualOrders || [],
    },
    monthly: {
      metrics: monthlyResults[0]?.aggregatedMetrics[0] || defaultMetrics,
      orders: monthlyResults[0]?.individualOrders || [],
    },
    yearly: {
      metrics: yearlyResults[0]?.aggregatedMetrics[0] || defaultMetrics,
      orders: yearlyResults[0]?.individualOrders || [],
    },
  };
};
/* -------------------------------------------------------------------------- */

/* ---------------------- will render sales report page --------------------- */
const getSalesReport = async (req, res) => {
  try {
    let { startDate, endDate } = req.query;

    startDate = startDate ? new Date(startDate) : new Date();
    endDate = endDate ? new Date(endDate) : new Date();

    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    const overallStats = await getOrderAnalytics();
    const customStats = await getOrderAnalytics(startDate, endDate);

    res.render("admin/salesReport", {
      title: "Sales Report",
      alert: req.flash("alert"),
      overallStats,
      customStats,
    });
  } catch (err) {
    console.log("Error while rendering sales report", err);
  }
};
/* -------------------------------------------------------------------------- */

/* -------------------- will generate excel sales report -------------------- */
const generateExcelSalesReport = async (req, res) => {
  try {
    let { startDate, endDate } = req.body;

    startDate = startDate ? new Date(startDate) : new Date();
    endDate = endDate ? new Date(endDate) : new Date();

    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    // const overallStats = await getOrderAnalytics();
    const salesData = await getOrderAnalytics(startDate, endDate);

    if (salesData?.customRange?.orders?.length > 0) {
      const reportData = salesData.customRange.orders;
      await generateExcelReport(reportData, startDate, endDate, res);
    } else {
      res.status(404).send("No data found for the selected date range");
    }
  } catch (err) {
    console.log("Error while generating excel sales report", err);
  }
};
/* -------------------------------------------------------------------------- */

/* -------------------- will generate PDF sales report -------------------- */
const generatePDFSalesReport = async (req, res) => {
  try {
    let { startDate, endDate } = req.body;

    startDate = startDate ? new Date(startDate) : new Date();
    endDate = endDate ? new Date(endDate) : new Date();

    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    // const overallStats = await getOrderAnalytics();
    const salesData = await getOrderAnalytics(startDate, endDate);

    if (salesData?.customRange?.orders?.length === 0) {
      return res.status(404).send("No data found for the selected date range");
    }

    // Generate PDF buffer
    const reportData = salesData.customRange.orders;
    const pdfBuffer = await generatePDFReport(reportData, startDate, endDate);

    // Set response headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment;");

    // Send the PDF buffer
    res.send(pdfBuffer);
  } catch (error) {
    console.error("Error generating PDF sales report:", error);

    res.status(500).json({ error: "Failed to generate sales report" });
  }
};
/* -------------------------------------------------------------------------- */

module.exports = {
  getSalesReport,
  generateExcelSalesReport,
  generatePDFSalesReport,
};
