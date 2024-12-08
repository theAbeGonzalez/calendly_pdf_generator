// pdf.js
const PDFDocument = require("pdfkit");
const fs = require("fs");
const moment = require("moment");
const path = require("path"); // Import path module

// Import the table headers and titles from constants.js
const {
  firstTableColumns,
  secondTableColumns,
  thirdTableColumns,
  tableTitles,
} = require("./constants");

function truncateText(doc, text, maxWidth, options) {
  let truncatedText = text;
  const ellipsis = "...";
  const ellipsisWidth = doc.widthOfString(ellipsis, options);

  while (
    doc.widthOfString(truncatedText, options) > maxWidth - ellipsisWidth &&
    truncatedText.length > 0
  ) {
    truncatedText = truncatedText.slice(0, -1);
  }

  return truncatedText + ellipsis;
}

// Updated function to draw tables
function drawTable(
  doc,
  y,
  columns,
  data,
  rowMapper,
  rowHeight = 20,
  headerHeight = 20
) {
  const cellPadding = 5;
  let rowHeights = [];

  // Draw header
  columns.forEach((col, i) => {
    const x =
      doc.page.margins.left +
      columns.slice(0, i).reduce((sum, c) => sum + c.width, 0);
    doc.rect(x, y, col.width, headerHeight).fill("#CCCCCC").stroke();

    // Center header text vertically
    const headerTextOptions = {
      width: col.width - 2 * cellPadding,
      align: "left",
    };
    const headerTextHeight = doc.heightOfString(col.header, headerTextOptions);
    const headerTextY = y + (headerHeight - headerTextHeight) / 2;

    doc
      .fillColor("#000000")
      .font("Helvetica-Bold")
      .fontSize(10)
      .text(col.header, x + cellPadding, headerTextY, headerTextOptions);
  });

  // Draw rows
  data.forEach((item, rowIndex) => {
    const cells = rowMapper(item, rowIndex);

    // First, calculate the height needed for each cell
    const cellHeights = columns.map((col, i) => {
      let cellText = cells[i] || "";
      const availableWidth = col.width - 2 * cellPadding;
      const cellTextOptions = {
        width: availableWidth,
        align: "left",
        font: "Helvetica",
        fontSize: 9,
      };
      const cellTextHeight =
        doc.heightOfString(cellText, cellTextOptions) + 2 * cellPadding;
      return cellTextHeight;
    });

    // Determine the maximum cell height for this row
    const maxRowHeight = Math.max(...cellHeights, rowHeight);

    // Calculate Y position for this row
    const rowY = y + headerHeight + rowHeights.reduce((a, b) => a + b, 0);

    // Store row height for positioning the next row
    rowHeights.push(maxRowHeight);

    // Determine the background color
    const fillColor = rowIndex % 2 === 0 ? "#FFFFFF" : "#F0F0F0";

    // Draw row background
    const rowWidth = columns.reduce((sum, col) => sum + col.width, 0);
    doc
      .rect(doc.page.margins.left, rowY, rowWidth, maxRowHeight)
      .fill(fillColor);

    // Draw cell borders and text
    columns.forEach((col, i) => {
      const x =
        doc.page.margins.left +
        columns.slice(0, i).reduce((sum, c) => sum + c.width, 0);
      doc.rect(x, rowY, col.width, maxRowHeight).stroke();

      // Draw cell text
      let cellText = cells[i] || "";
      const availableWidth = col.width - 2 * cellPadding;
      const cellTextOptions = {
        width: availableWidth,
        align: "left",
        font: "Helvetica",
        fontSize: 9,
      };

      doc
        .fillColor("#000000")
        .font("Helvetica")
        .fontSize(9)
        .text(cellText, x + cellPadding, rowY + cellPadding, cellTextOptions);
    });
  });

  // Calculate total rows height
  const totalRowsHeight = rowHeights.reduce((a, b) => a + b, 0);

  // Return the new Y position
  return y + headerHeight + totalRowsHeight + 10;
}

function generatePDF(attendees, date) {
  const formattedDate = moment(date, "YYYY-MM-DD").format("DD/MM/YYYY");

  const doc = new PDFDocument({
    margin: 10,
    size: "LETTER",
    layout: "landscape",
    autoFirstPage: false,
  });
  const fileName = `Calendly_Attendees_${date}.pdf`;
  const folderPath = path.join(__dirname, "documentos"); // Adjust folder path as needed
  const fullFilePath = path.join(folderPath, fileName);

  // Ensure folder exists (you might need to create it if it doesn't exist)
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }

  doc.pipe(fs.createWriteStream(fullFilePath));

  // First Table
  doc.addPage();

  doc.moveDown();

  let currentY = doc.y;
  currentY = drawTable(
    doc,
    currentY,
    firstTableColumns,
    attendees,
    (attendee, rowIndex) => [
      (rowIndex + 1).toString(),
      attendee.time,
      attendee.visitNumber,
      attendee.recipientName,
      attendee.donorName,
      attendee.phoneNumber,
      attendee.treatmentRequired,
      attendee.picked,
      attendee.paid,
      attendee.done,
      (rowIndex + 1).toString(),
    ],
    45
  );

  // Second Table
  doc.addPage();

  doc.moveDown();

  currentY = doc.y;
  currentY = drawTable(
    doc,
    currentY,
    secondTableColumns,
    attendees,
    (attendee, rowIndex) => [
      (rowIndex + 1).toString(),
      attendee.time,
      attendee.donorName,
      attendee.recipientName,
      attendee.numberOfTubes,
    ],
    45
  );

  // Third Table
  doc.addPage();

  doc.moveDown();

  currentY = doc.y;
  currentY = drawTable(
    doc,
    currentY,
    thirdTableColumns,
    attendees,
    (attendee, rowIndex) => [
      (rowIndex + 1).toString(),
      attendee.time,
      attendee.treatmentName,
      attendee.visitNumber,
      attendee.recipientName,
      attendee.donorName,
      attendee.ts,
      attendee.tsRPM,
      attendee.sn,
      attendee.snRPM,
      attendee.iy,
      attendee.done,
    ],
    45,
    30
  );

  // Generate index cards (as per your existing code)
  generateIndexCards(doc, attendees);

  doc.end();
  console.log(`PDF generated`);
  return fullFilePath;
}

// Include your existing generateIndexCards function here (unchanged)

function generateIndexCards(doc, attendees) {
  // Define the size of the index card in points (1 inch = 72 points)
  const cardWidth = 5 * 72; // 5 inches (original width)
  const cardHeight = 3 * 72; // 3 inches (original height)
  const cardMargin = 0; // No margin between cards
  const cardsPerPage = 3;

  // Dimensions after rotation
  const rotatedCardWidth = cardHeight; // 216 points
  const rotatedCardHeight = cardWidth; // 360 points

  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;

  // Calculate total width of all cards
  const totalCardsWidth = cardsPerPage * rotatedCardWidth;
  const horizontalMargin = (pageWidth - totalCardsWidth) / 2;

  // Calculate vertical margin to center cards vertically
  const verticalMargin = (pageHeight - rotatedCardHeight) / 2;

  let cardCount = 0;
  for (let i = 0; i < attendees.length; i++) {
    if (cardCount % cardsPerPage === 0) {
      doc.addPage({
        size: "LETTER",
        layout: "landscape",
        margins: {
          top: verticalMargin,
          bottom: verticalMargin,
          left: horizontalMargin,
          right: horizontalMargin,
        },
      });
    }

    const attendee = attendees[i];

    // Calculate the position for each card
    const cardX =
      doc.page.margins.left +
      (rotatedCardWidth + cardMargin) * (cardCount % cardsPerPage);
    const cardY = doc.page.margins.top;

    // Save the current graphics state
    doc.save();

    // Move to the center of the card
    doc.translate(cardX + cardHeight / 2, cardY + cardWidth / 2);

    // Rotate the coordinate system by 90 degrees
    doc.rotate(90);

    // Move back to the top-left corner of the rotated card
    doc.translate(-cardWidth / 2, -cardHeight / 2);

    // Draw the card rectangle
    doc.rect(0, 0, cardWidth, cardHeight).stroke();

    // Now, draw the text inside the card
    // The coordinate system is rotated, but we can use standard positions

    doc.rotate(-90);

    doc.translate(-(cardWidth / 2) - 20, 0);

    let textX = 20;
    let textY = 30;

    doc.fontSize(18);

    // Draw the number (order) in a box in the top left corner
    const boxWidth = i + 1 > 9 ? 40 : 30;
    doc.rect(10, 10, boxWidth, 30).stroke();
    doc.text(i + 1, 20, 20);

    doc.fontSize(12);

    doc.text("Visit: _______", 80, 20);

    textY += 30;

    doc.text(attendee.recipientName, textX, textY);

    textY += 20;

    doc.text(attendee.donorName, textX, textY);

    textY += 30;

    doc.fontSize(10);

    doc.font("Helvetica-Bold");
    doc.text(attendee.treatmentName, textX, textY);

    doc.font("Helvetica");

    doc.fontSize(12);

    textY += 20;

    doc.text("______________________", textX, textY);

    textY += 30;

    // Draw checkbox
    doc.rect(textX, textY - 3, 20, 20).stroke();
    // Next line: Rogham with a checkbox
    doc.text("Rogham", textX + 30, textY);

    textY += 30;

    doc.rect(textX, textY - 3, 20, 20).stroke();

    // Next line: STD Recipient Donor with a checkbox
    doc.text("STD - Donante Pareja", textX + 30, textY);

    textY += 30;

    doc.rect(textX, textY - 3, 20, 20).stroke();

    // Next line: STD Recipient with a checkbox
    doc.text("STD - Paciente", textX + 30, textY);

    textY += 35;

    // Next line: STD Donor with a box
    doc.text("______ STD Donantes", textX, textY);
    // Draw box to write the number

    textY += 30;

    // Next line: The word "Tubes"
    doc.text("Tubos", textX, textY);

    textY += 20;

    // Next line: Three boxes to write numbers
    const boxSize = 40;
    const boxSpacing = 10;
    let boxStartX = textX;

    for (let j = 0; j < 3; j++) {
      doc.rect(boxStartX, textY, boxSize, boxSize).stroke();
      boxStartX += boxSize + boxSpacing;
    }

    // Restore the graphics state to undo the rotation and translation
    doc.restore();

    cardCount++;
  }
}

module.exports = generatePDF;
