const PDFDocument = require("pdfkit-table");

async function generatePDFInvoice(data) {
  // Create PDF document
  const doc = new PDFDocument({ margin: 20, size: "A3" });

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
      .text("INVOICE", { align: "center", underline: true })
      .moveDown();

    // Generate invoice details table
    const invoiceTable = {
      headers: [
        { label: "Invoice ID", width: 160 },
        { label: "Product Name", width: 150 },
        { label: "Quantity", width: 100 },
        { label: "Price", width: 100 },
        { label: "Discount", width: 100 },
        { label: "Coupon Discount", width: 120 },
        { label: "Total", width: 120 },
      ],
      rows: [
        [
          data.invoiceId,
          data.productName,
          data.quantity.toString(),
          data.price.toFixed(2),
          data.discount.toFixed(2),
          data.couponDiscount.toFixed(2),
          data.total.toFixed(2),
        ],
      ],
      options: {
        width: 700,
        rowBackground: (rowIndex) =>
          rowIndex % 2 === 0 ? "#E8F5E9" : "#FFFFFF",
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
      },
    };

    doc.table(invoiceTable);

    // Finalize PDF
    doc.end();
  });
}

module.exports = generatePDFInvoice;
