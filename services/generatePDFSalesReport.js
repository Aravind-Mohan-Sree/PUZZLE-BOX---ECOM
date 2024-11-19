const PDFDocument = require("pdfkit-table");

async function generatePDFSalesReport(data, startDate, endDate) {
  function convertDateFormat(dateString) {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  // Create PDF document
  const doc = new PDFDocument({ margin: 30, size: "A3" });

  // Create buffer to store PDF
  const chunks = [];
  doc.on("data", (chunk) => chunks.push(chunk));

  return new Promise((resolve, reject) => {
    doc.on("end", () => {
      const pdfBuffer = Buffer.concat(chunks);
      resolve(pdfBuffer);
    });

    doc.on("error", reject);

    // Add header
    doc
      .fontSize(20)
      .fillColor("#000000")
      .text(
        `Puzzle Box Sales Report (${convertDateFormat(
          startDate
        )} to ${convertDateFormat(endDate)})`,
        { align: "center" }
      )
      .moveDown();

    // Calculate overall stats
    const summaryMetrics = data.reduce(
      (acc, order) => ({
        totalOrders: acc.totalOrders + 1,
        totalSalesAmount: acc.totalSalesAmount + (order.totalSalesAmount || 0),
        totalDiscount: acc.totalDiscount + (order.totalDiscount || 0),
        totalCouponDiscount:
          acc.totalCouponDiscount + (order.totalCouponDiscount || 0),
      }),
      {
        totalOrders: 0,
        totalSalesAmount: 0,
        totalDiscount: 0,
        totalCouponDiscount: 0,
      }
    );

    // Generate summary table
    const summaryTable = {
      headers: [
        { label: "Metric", width: 150 },
        { label: "Value", width: 150 },
      ],
      rows: [
        ["Overall Sales Count", summaryMetrics.totalOrders],
        ["Overall Discount", summaryMetrics.totalDiscount.toFixed(2)],
        [
          "Overall Coupon Discount",
          summaryMetrics.totalCouponDiscount.toFixed(2),
        ],
        ["Overall Sales Amount", summaryMetrics.totalSalesAmount.toFixed(2)],
      ],
    };

    doc.table(summaryTable, {
      width: 300,
      rowBackground: (rowIndex) => (rowIndex % 2 === 0 ? "#F3F3F3" : "#FFFFFF"),
      prepareHeader: () => {
        doc.font("Helvetica-Bold").fontSize(12).fillColor("#333333");
      },
      prepareRow: () => {
        doc.font("Helvetica").fontSize(10).fillColor("#333333");
      },
    });

    doc.moveDown();

    function scrambleString(str) {
      const shufflePattern = [
        12, 5, 19, 2, 17, 0, 22, 9, 14, 8, 3, 15, 1, 18, 6, 11, 4, 13, 7, 10,
        16, 21, 20, 23,
      ];
      const scrambledArray = shufflePattern.map((i) => str[i]).slice(0, 20);
      return scrambledArray.join("");
    }

    // Generate detailed sales table
    const detailsTable = {
      headers: [
        { label: "Order ID", width: 160 },
        { label: "Ordered Date", width: 150 },
        { label: "Payment Method", width: 150 },
        { label: "Discount", width: 100 },
        { label: "Coupon Discount", width: 120 },
        { label: "Order Amount", width: 120 },
      ],
      rows: data.map((order) => [
        scrambleString(order.orderId.toString()),
        new Date(order.createdAt).toLocaleString(),
        order.paymentMethod,
        order.totalDiscount.toFixed(2),
        order.totalCouponDiscount.toFixed(2),
        order.totalSalesAmount.toFixed(2),
      ]),
    };

    doc.table(detailsTable, {
      width: 700,
      rowBackground: (rowIndex) => (rowIndex % 2 === 0 ? "#E8F5E9" : "#FFFFFF"),
      footerBackground: "#C9ECBA",
      headerBackground: "#404040",
      headerColor: "#FFFFFF",
      prepareHeader: () => {
        doc.font("Helvetica-Bold").fontSize(12).fillColor("#000000");
      },
      prepareRow: () => {
        doc.font("Helvetica").fontSize(10).fillColor("#333333");
      },
      prepareFooter: () => {
        doc.font("Helvetica-Bold").fontSize(10).fillColor("#333333");
      },
    });

    // Finalize PDF
    doc.end();
  });
}

module.exports = generatePDFSalesReport;
