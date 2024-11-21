const PDFDocument = require("pdfkit-table");

async function generatePDFInvoice(data) {
  // Create PDF document
  const doc = new PDFDocument({
    margins: { top: 90, left: 45, bottom: 50, right: 50 },
    size: "A3",
  });

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

    doc
      .font("Helvetica-Bold")
      .fontSize(12)
      .fillColor("#000000")
      .text(`Invoice #${data.invoiceId}`, { align: "left" })
      .moveDown()
      .text(`Ordered On ${data.orderedDate}`, { align: "left" })
      .moveDown()
      .text(`Payment Method: ${data.paymentMethod}`, { align: "left" })
      .moveDown()
      .text(`Shipping Address`, { align: "left", underline: true })
      .moveDown()
      .text(
        `${data.address.contactName}, ${data.address.house}, ${data.address.area}, ${data.address.city}, ${data.address.state}, Pincode: ${data.address.pincode}, Contact: ${data.address.phone}`,
        {
          align: "left",
        }
      )
      .moveDown(4);

    // Generate invoice details table
    const invoiceTable = {
      headers: [
        { label: "Product Name", width: 150 },
        { label: "Quantity", width: 90 },
        { label: "Price", width: 90 },
        { label: "Discount", width: 90 },
        { label: "Coupon Discount", width: 120 },
        { label: "Delivery Charge", width: 120 },
        { label: "Total", width: 90 },
      ],
      rows: [
        [
          data.productName,
          data.quantity.toString(),
          "Rs " + data.price.toFixed(2),
          "Rs " + data.discount.toFixed(2),
          "Rs " + data.couponDiscount.toFixed(2),
          "Rs " + data.deliveryCharge.toFixed(2),
          "Rs " + data.total.toFixed(2),
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

    doc.moveDown(4);

    // Add footer
    doc
      .fontSize(15)
      .fillColor("#000000")
      .text("Thank You!", { align: "center" })
      .moveDown();

    // Finalize PDF
    doc.end();
  });
}

module.exports = generatePDFInvoice;
