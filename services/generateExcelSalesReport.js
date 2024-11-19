const ExcelJS = require("exceljs");
const fs = require("fs");

async function generateExcelSalesReport(data, startDate, endDate, response) {
  function convertDateFormat(dateString) {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Sales Report");

  // Main title styling
  worksheet.properties.outlineLevelCol = 2;
  worksheet.mergeCells("A1", "F1");
  worksheet.getRow(1).height = 30;
  worksheet.getCell("A1").value = `Puzzle Box Sales Report (${convertDateFormat(
    startDate
  )} to ${convertDateFormat(endDate)})`;
  worksheet.getCell("A1").font = {
    bold: true,
    size: 16,
    color: { argb: "FFFFFF00" },
  }; // Yellow font
  worksheet.getCell("A1").fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF404040" }, // Dark gray background
  };
  worksheet.getCell("A1").alignment = {
    horizontal: "center",
    vertical: "middle",
  };

  worksheet.addRow([]);
  worksheet.getRow(2).height = 10;

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

  // Summary section styling
  worksheet.mergeCells("A3", "C3");
  worksheet.getCell("A3").value = "Summary";
  worksheet.getCell("A3").font = {
    bold: true,
    size: 12,
    color: { argb: "FFFFFF00" },
  }; // Yellow font
  worksheet.getCell("A3").fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF404040" }, // Dark gray background
  };
  worksheet.getCell("A3").alignment = {
    horizontal: "center",
    vertical: "middle",
  };

  const summaryData = [
    ["Overall Sales Count:", summaryMetrics.totalOrders],
    ["Overall Sales Discount:", summaryMetrics.totalDiscount],
    ["Overall Sales Coupon Discount:", summaryMetrics.totalCouponDiscount],
    ["Overall Sales Amount:", summaryMetrics.totalSalesAmount],
  ];

  let currentRow = 4;
  summaryData.forEach(([label, value]) => {
    worksheet.getCell(`A${currentRow}`).value = label;
    worksheet.getCell(`B${currentRow}`).value = value;
    worksheet.getCell(`A${currentRow}`).font = { bold: true };
    worksheet.getCell(`A${currentRow}`).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFC9ECBA" }, // Light green background
    };
    worksheet.getCell(`B${currentRow}`).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFC9ECBA" }, // Light green background
    };
    if (typeof value === "number" && label !== "Overall Sales Count:") {
      worksheet.getCell(`B${currentRow}`).numFmt = "#,##0.00";
    }
    currentRow++;
  });

  // Border styling for summary section
  ["A", "B", "C"].forEach((col) => {
    for (let i = 3; i < currentRow; i++) {
      worksheet.getCell(`${col}${i}`).border = {
        top: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
        bottom: { style: "thin" },
      };
    }
  });

  worksheet.addRow([]);
  currentRow++;

  // Main table headers
  const headers = [
    "Order ID",
    "Ordered Date",
    "Payment Method",
    "Discount",
    "Coupon Discount",
    "Order Amount",
  ];

  // Header styling
  worksheet.getRow(currentRow).values = headers;
  const headerRow = worksheet.getRow(currentRow);
  headerRow.height = 25;
  headerRow.font = { bold: true, size: 12, color: { argb: "FFFFFF00" } }; // Yellow font
  headerRow.alignment = {
    horizontal: "center",
    vertical: "middle",
    wrapText: true,
  };
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF404040" }, // Dark gray background
    };
  });

  // Column widths
  worksheet.columns = [
    { key: "orderId", width: 25 },
    { key: "createdAt", width: 30 },
    { key: "paymentMethod", width: 25 },
    { key: "totalDiscount", width: 20 },
    { key: "totalCouponDiscount", width: 25 },
    { key: "totalSalesAmount", width: 25 },
  ];

  // Data rows
  let rowNumber = currentRow + 1;
  data.forEach((order) => {
    function scrambleString(str) {
      const shufflePattern = [
        12, 5, 19, 2, 17, 0, 22, 9, 14, 8, 3, 15, 1, 18, 6, 11, 4, 13, 7, 10,
        16, 21, 20, 23,
      ];
      const scrambledArray = shufflePattern.map((i) => str[i]).slice(0, 20);
      return scrambledArray.join("");
    }

    const orderId = scrambleString(order.orderId.toString());
    const row = worksheet.addRow([
      orderId,
      new Date(order.createdAt).toLocaleString(),
      order.paymentMethod,
      order.totalDiscount || 0,
      order.totalCouponDiscount || 0,
      order.totalSalesAmount || 0,
    ]);

    // Data row styling
    row.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFC9ECBA" }, // Light green background
      };
      cell.alignment = { horizontal: "center", vertical: "middle" };
    });

    row.height = 20;
    row.getCell(4).numFmt = "#,##0.00";
    row.getCell(5).numFmt = "#,##0.00";
    row.getCell(6).numFmt = "#,##0.00";
    rowNumber++;
  });

  // Total row
  const totalRow = worksheet.addRow({
    orderId: "Total",
    createdAt: "",
    paymentMethod: "",
    totalDiscount: { formula: `SUM(D${currentRow + 1}:D${rowNumber - 1})` },
    totalCouponDiscount: {
      formula: `SUM(E${currentRow + 1}:E${rowNumber - 1})`,
    },
    totalSalesAmount: { formula: `SUM(F${currentRow + 1}:F${rowNumber - 1})` },
  });

  // Total row styling
  totalRow.font = { bold: true, size: 12, color: { argb: "FFFFFF00" } }; // Yellow font
  totalRow.height = 25;
  totalRow.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF404040" }, // Dark gray background
    };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "double" },
      right: { style: "thin" },
    };
  });

  totalRow.getCell(4).numFmt = "#,##0.00";
  totalRow.getCell(5).numFmt = "#,##0.00";
  totalRow.getCell(6).numFmt = "#,##0.00";

  // Table borders
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber >= currentRow) {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
    }
  });

  // Auto-filter
  worksheet.autoFilter = {
    from: { row: currentRow, column: 1 },
    to: { row: rowNumber - 1, column: 6 },
  };

  // Freeze panes
  worksheet.views = [
    {
      state: "frozen",
      xSplit: 0,
      ySplit: currentRow,
      topLeftCell: `A${currentRow + 1}`,
      activeCell: `A${currentRow + 1}`,
    },
  ];

  const buffer = await workbook.xlsx.writeBuffer();
  response.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  response.setHeader("Content-Disposition", `attachment;`);
  response.send(buffer);
}

module.exports = generateExcelSalesReport;
