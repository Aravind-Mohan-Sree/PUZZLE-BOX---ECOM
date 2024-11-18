const ExcelJS = require("exceljs");
const fs = require("fs");

async function generateExcelSalesReport(data, startDate, endDate, response) {
  // Create a new workbook and worksheet
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Sales Report");

  // Add metadata with increased row height for title
  worksheet.properties.outlineLevelCol = 2;
  worksheet.mergeCells("A1", "F1");
  worksheet.getRow(1).height = 30;
  worksheet.getCell("A1").value = `Sales Report (${startDate} to ${endDate})`;
  worksheet.getCell("A1").font = { bold: true, size: 16 };
  worksheet.getCell("A1").alignment = {
    horizontal: "center",
    vertical: "middle",
  };

  // Add spacing row after title
  worksheet.addRow([]);
  worksheet.getRow(2).height = 10;

  // First, define the headers
  const headers = [
    "Order ID",
    "Ordered Date",
    "Payment Method",
    "Discount",
    "Coupon Discount",
    "Order Amount",
  ];

  // Add header row
  worksheet.getRow(3).values = headers;

  // Then define column properties
  worksheet.columns = [
    { key: "orderId", width: 25 },
    { key: "createdAt", width: 30 },
    { key: "paymentMethod", width: 25 },
    { key: "totalDiscount", width: 20 },
    { key: "totalCouponDiscount", width: 25 },
    { key: "totalSalesAmount", width: 25 },
  ];

  // Style the headers (row 3)
  const headerRow = worksheet.getRow(3);
  headerRow.height = 25;
  headerRow.font = { bold: true, size: 12 };
  headerRow.alignment = {
    horizontal: "center",
    vertical: "middle",
    wrapText: true,
  };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE0E0E0" },
  };

  // Add data rows starting from row 4
  let rowNumber = 4;
  data.forEach((order) => {
    function scrambleString(str) {
      const shufflePattern = [
        12, 5, 19, 2, 17, 0, 22, 9, 14, 8, 3, 15, 1, 18, 6, 11, 4, 13, 7, 10,
        16, 21, 20, 23,
      ];
      const scrambledArray = [];

      shufflePattern.forEach((newIndex, i) => {
        scrambledArray[i] = str[newIndex];
      });

      // Remove elements beyond index 20
      scrambledArray.splice(20);

      return scrambledArray.join("");
    }

    const orderId = scrambleString(order.orderId.toString());

    // Create row with all values explicitly
    const rowValues = [
      orderId,
      new Date(order.createdAt).toLocaleString(),
      order.paymentMethod,
      order.totalDiscount || 0,
      order.totalCouponDiscount || 0,
      order.totalSalesAmount || 0,
    ];

    const row = worksheet.addRow(rowValues);

    // Format number columns with 2 decimal places
    row.getCell(4).numFmt = "#,##0.00"; // Total Discount
    row.getCell(5).numFmt = "#,##0.00"; // Total Coupon Discount
    row.getCell(6).numFmt = "#,##0.00"; // Net Sales Amount

    // Ensure numeric values are set as numbers, not strings
    row.getCell(4).value = Number(order.totalDiscount || 0);
    row.getCell(5).value = Number(order.totalCouponDiscount || 0);
    row.getCell(6).value = Number(order.totalSalesAmount || 0);

    // Center align all cells in the row
    row.alignment = { horizontal: "center", vertical: "middle" };
    row.height = 20;
    rowNumber++;
  });

  // Add total row
  const totalRow = worksheet.addRow({
    orderId: "Total",
    createdAt: "",
    paymentMethod: "",
    totalDiscount: { formula: `SUM(D4:D${rowNumber - 1})` },
    totalCouponDiscount: { formula: `SUM(E4:E${rowNumber - 1})` },
    totalSalesAmount: { formula: `SUM(F4:F${rowNumber - 1})` },
  });

  // Style total row
  totalRow.font = { bold: true, size: 12 };
  totalRow.alignment = { horizontal: "center", vertical: "middle" };
  totalRow.height = 25;
  totalRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF0F0F0" },
  };

  // Format total row numbers
  totalRow.getCell(4).numFmt = "#,##0.00";
  totalRow.getCell(5).numFmt = "#,##0.00";
  totalRow.getCell(6).numFmt = "#,##0.00";

  // Add border to total row
  totalRow.eachCell((cell) => {
    cell.border = {
      top: { style: "thin", color: { argb: "FFB0B0B0" } },
      left: { style: "thin", color: { argb: "FFB0B0B0" } },
      bottom: { style: "double", color: { argb: "FFB0B0B0" } },
      right: { style: "thin", color: { argb: "FFB0B0B0" } },
    };
  });

  // Add table styling with improved borders
  worksheet.eachRow((row, rowNumber) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: "thin", color: { argb: "FFB0B0B0" } },
        left: { style: "thin", color: { argb: "FFB0B0B0" } },
        bottom: { style: "thin", color: { argb: "FFB0B0B0" } },
        right: { style: "thin", color: { argb: "FFB0B0B0" } },
      };
    });
  });

  // Auto-filter for all columns
  worksheet.autoFilter = {
    from: { row: 3, column: 1 },
    to: { row: rowNumber - 1, column: 6 },
  };

  // Freeze panes
  worksheet.views = [
    {
      state: "frozen",
      xSplit: 0,
      ySplit: 3,
      topLeftCell: "A4",
      activeCell: "A4",
    },
  ];

  // Save the Excel file and send it as a response
  const buffer = await workbook.xlsx.writeBuffer();
  response.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  response.setHeader(
    "Content-Disposition",
    `attachment; filename="Puzzle_Box_Sales_Report_${new Date().toDateString()}.xlsx"`
  );
  response.send(buffer);
}

module.exports = generateExcelSalesReport;
