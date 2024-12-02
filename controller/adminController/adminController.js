const orderSchema = require("../../model/orderSchema");

// will redirect to admin login page
const admin = (req, res) => {
  res.redirect("/admin/login");
};

// will render admin login page if admin session is not present
const login = (req, res) => {
  try {
    if (req.session.admin) {
      res.redirect("/admin/dashboard");
    } else {
      if (req.query.logout) {
        req.flash("alert", {
          message: "Logout successful!",
          color: "bg-danger",
        });
      }

      res.render("admin/login", {
        title: "Admin Login",
        alert: req.flash("alert"),
      });
    }
  } catch (err) {
    console.error(`Error while rendering admin login page ${err}`);
  }
};

// will send admin login form data to the server for verification
const loginPost = (req, res) => {
  try {
    if (
      req.body.email === process.env.ADMIN_EMAIL &&
      req.body.password === process.env.ADMIN_PASSWORD
    ) {
      req.session.admin = req.body.email;

      res.json({ url: "/admin/dashboard?login=true" });
    } else {
      if (req.body.email !== process.env.ADMIN_EMAIL) {
        res.json({ wrongEmail: true });
      } else {
        res.json({ wrongPassword: true });
      }
    }
  } catch (err) {
    res.json({ error: true });

    console.error(`Error on admin login post ${err}`);
  }
};

// will render admin dashboard page if admin session is present
const dashboard = async (req, res) => {
  try {
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
              $subtract: [
                "$orderTotalPrice",
                { $ifNull: ["$couponDiscount", 0] },
              ],
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
                  $multiply: [
                    "$products.discountedPrice",
                    "$products.quantity",
                  ],
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
                      $multiply: [
                        "$products.actualDiscount",
                        "$products.quantity",
                      ],
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
                      $multiply: [
                        "$products.actualDiscount",
                        "$products.quantity",
                      ],
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
            metrics:
              customRangeResults[0]?.aggregatedMetrics[0] || defaultMetrics,
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

    if (req.query.login) {
      req.flash("alert", { message: "Login successful!", color: "bg-success" });
    }

    let { startDate, endDate } = req.query;

    startDate = startDate ? new Date(startDate) : new Date();
    endDate = endDate ? new Date(endDate) : new Date();

    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    const salesData = await getOrderAnalytics(startDate, endDate);

    const chartData = salesData.customRange.metrics;
    const dateRange = salesData.customRange.dateRange;

    res.render("admin/dashboard", {
      title: "Dashboard",
      alert: req.flash("alert"),
      chartData,
      dateRange,
    });
  } catch (err) {
    console.error(`Error while rendering admin dashboard page ${err}`);
  }
};

// will logout admin
const logout = (req, res) => {
  try {
    delete req.session.admin;
    
    res.json({ url: "/admin/login?logout=true" });
  } catch (err) {
    console.log("Error on admin logout post");
  }
};

module.exports = {
  admin,
  login,
  loginPost,
  dashboard,
  logout,
};
