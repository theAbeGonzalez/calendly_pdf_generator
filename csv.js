const path = require("path"); // Import path module
const fs = require("fs");

const generateCSV = (attendees, date) => {
  const csvFileName = `Calendly_Attendees_${date}.csv`;
  const folderPath = path.join(__dirname, "documentos"); // Adjust folder path as needed
  const csvFilePath = path.join(folderPath, csvFileName);

  // Prepare CSV content
  const csvHeaders = "Recipient Name,Donor Name\n";
  const csvRows = attendees
    .map(
      (attendee) =>
        `"${attendee.recipientName.replace(/"/g, '""') || ""}","${
          attendee.donorName.replace(/"/g, '""') || ""
        }"`
    )
    .join("\n");

  const csvContent = csvHeaders + csvRows;

  // Write CSV file
  fs.writeFileSync(csvFilePath, csvContent, "utf8");

  console.log(`CSV generated: ${csvFilePath}`);
  return csvFilePath;
};

module.exports = generateCSV;
