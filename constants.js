// First Table Headers
const firstTableColumns = [
  { header: "No", width: 28 }, // New column for order number
  { header: "Time", width: 50 },
  { header: "Visit", width: 45 },
  { header: "Recipient Name", width: 110 },
  { header: "Donor Name", width: 110 },
  { header: "Phone Number", width: 90 },
  { header: "Treatment", width: 190 },
  { header: "Picked", width: 45 },
  { header: "Paid", width: 40 },
  { header: "Done", width: 40 }, // New column
  { header: "No", width: 25 }, // New column for order number
];

// Second Table Headers
const secondTableColumns = [
  { header: "No", width: 25 }, // New column for order number
  { header: "Horario", width: 60 },
  { header: "Hombre - Donante", width: 150 },
  { header: "Mujer - Recipient", width: 150 },
  { header: "Numero de Tubos", width: 100 },
];

const labColumnWidth = 55;

// Third Table Headers
const thirdTableColumns = [
  { header: "No", width: 25 }, // New column for order number
  { header: "Time", width: 50 },
  { header: "LIT", width: 160 },
  { header: "Visita", width: 40 },
  { header: "Nombre Mujer", width: 100 },
  { header: "Nombre Hombre", width: 100 },
  { header: "TS", width: labColumnWidth - 10 },
  { header: "1500rpm\n19min", width: labColumnWidth },
  { header: "SN", width: labColumnWidth - 10 },
  { header: "2200rpm\n10min", width: labColumnWidth },
  { header: "IY", width: labColumnWidth - 10 },
  { header: "Done", width: 40 },
];

// Table Titles
const tableTitles = {
  firstTable: `Pacientes`,
  secondTable: `Tubos de Sangre`,
  thirdTable: `Laboratorio`,
};

// Export the constants
module.exports = {
  firstTableColumns,
  secondTableColumns,
  thirdTableColumns,
  tableTitles,
};
