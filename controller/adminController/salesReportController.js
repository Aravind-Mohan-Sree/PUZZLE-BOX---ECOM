const categorySchema = require("../../model/categorySchema");
const productSchema = require("../../model/productSchema");
const orderSchema = require("../../model/orderSchema");

/* ---------------------- will render sales report page --------------------- */
const getSalesReport = async (req, res) => {
  try {
    res.render("admin/salesReport", {
      title: "Sales Report",
      alert: req.flash("alert"),
      allTimeAnalytics,
      rangeAnalytics,
    });
  } catch (err) {
    console.log("Error while rendering sales report", err);
  }
};
/* -------------------------------------------------------------------------- */

module.exports = {
  getSalesReport,
};

const getOrderAnalytics = async (startDate = null, endDate = null) => {
  // If no dates provided, use default date ranges
  const currentDate = new Date("2024-11-17");

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
                { $multiply: ["$$this.discountedPrice", "$$this.quantity"] },
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
          $nin: ["Pending", "Returned", "Cancelled"],
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
              netSalesAmount: {
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
              netSalesAmount: { $round: ["$netSalesAmount", 2] },
            },
          },
          {
            $sort: { createdAt: -1 },
          },
        ],
        aggregatedMetrics: [
          {
            $group: {
              _id: null,
              totalSalesCount: { $sum: "$products.quantity" },
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
              totalDeliveryCharges: {
                $sum: {
                  $cond: {
                    if: "$isDeliveryChargeApplicable",
                    then: { $multiply: ["$products.quantity", 40] },
                    else: 0,
                  },
                },
              },
              netSalesAmount: {
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
              totalSalesCount: 1,
              totalDiscount: { $round: ["$totalDiscount", 2] },
              totalCouponDiscount: { $round: ["$totalCouponDiscount", 2] },
              totalDeliveryCharges: { $round: ["$totalDeliveryCharges", 2] },
              netSalesAmount: { $round: ["$netSalesAmount", 2] },
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
    netSalesAmount: 0,
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
  };
};

// Example usage:
const getAnalytics = async () => {
  const analytics = await getOrderAnalytics();

  // Access daily orders
  analytics.daily.orders.forEach((order) => {
    console.log(`Order ${order.orderId}:`, {
      netSalesAmount: order.netSalesAmount,
      totalDiscount: order.totalDiscount,
      totalCouponDiscount: order.totalCouponDiscount,
    });
  });

  // Get default date ranges (daily, weekly, monthly, overall)
  const defaultStats = await getOrderAnalytics();

  // Get stats for a specific date range
  const customStats = await getOrderAnalytics("2024-11-17", "2024-11-17");
  console.log(analytics.daily.metrics);
  console.log(customStats.customRange.orders);
};

getAnalytics() 