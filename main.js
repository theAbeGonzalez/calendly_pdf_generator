// index.js
require("dotenv").config(); // Load .env file

const axios = require("axios");
let inquirer = require("inquirer");
if (inquirer.default) {
  inquirer = inquirer.default;
}
const path = require("path");
const { pathToFileURL } = require("url");
const moment = require("moment-timezone"); // For date handling and time zones

// Import the generatePDF function
const generatePDF = require("./pdf");
const generateCSV = require("./csv");

// Import the Personal Access Token from constants.js

const calendlyApi = axios.create({
  baseURL: "https://api.calendly.com",
  headers: {
    Authorization: `Bearer ${process.env.PERSONAL_ACCESS_TOKEN}`,
    "Content-Type": "application/json",
  },
});

// Function to fetch the current user's URI
async function getCurrentUserUri() {
  try {
    const response = await calendlyApi.get("/users/me");
    return response.data.resource.uri;
  } catch (error) {
    console.error("Error fetching current user:", error.response.data);
    process.exit(1);
  }
}

// Function to fetch scheduled events
async function fetchScheduledEvents(userUri, date) {
  try {
    const startTime = moment(date).startOf("day").toISOString();
    const endTime = moment(date).endOf("day").toISOString();

    const response = await calendlyApi.get("/scheduled_events", {
      params: {
        user: userUri,
        min_start_time: startTime,
        max_start_time: endTime,
        status: "active", // Only fetch active events
      },
    });

    return response.data.collection;
  } catch (error) {
    console.error("Error fetching scheduled events:", error.response.data);
    return [];
  }
}

// Function to fetch invitee details
async function fetchInviteeDetails(eventUuid) {
  try {
    const response = await calendlyApi.get(
      `/scheduled_events/${eventUuid}/invitees`
    );
    return response.data.collection;
  } catch (error) {
    console.error("Error fetching invitee details:", error.response.data);
    return [];
  }
}

// Main function to process events and extract attendee information
async function processEvents(date) {
  const userUri = await getCurrentUserUri();
  const events = await fetchScheduledEvents(userUri, date);
  const attendees = [];

  //console.log(JSON.stringify(events, undefined, 2));
  //console.log("=========================");

  for (const event of events) {
    // Extract the event UUID from the event's URI
    const eventUuid = event.uri.split("/").pop();

    const invitees = await fetchInviteeDetails(eventUuid);

    for (const invitee of invitees) {
      // Skip cancelled
      if (invitee.status !== "active") {
        continue;
      }

      //console.log(JSON.stringify(invitee, undefined, 2));
      const questionsAndAnswers = invitee.questions_and_answers;

      // Helper function to find answer by question text
      function findAnswer(questionText) {
        const qa = questionsAndAnswers.find((q) =>
          q.question.toLowerCase().includes(questionText.toLowerCase())
        );
        return qa ? qa.answer : "";
      }

      // Extract the desired answers
      const treatmentRequired = findAnswer("What treatment do you require?");

      let visit = findAnswer("Which visit to the clinic is this for you?");

      let visitNumber = "";
      if (visit) {
        visitNumber = visit.replace("Visit", "");
      }

      // Extract the treatment name without the price
      let treatmentName = "";
      if (treatmentRequired) {
        treatmentName = treatmentRequired.split(" -")[0].trim();
      }

      const recipientFirstName = findAnswer("Name of Recipient");
      const recipientLastName = findAnswer("Last Name of Recipient");
      const recipientBloodType = findAnswer("Blood Type of Recipient");
      const donorName = findAnswer("First and Last name of Donor");
      const donorBloodType = findAnswer("Blood Type of Donor");
      const doctorName = findAnswer("Name of Doctor who referred us");
      const phoneNumber = findAnswer(
        "For phone calls, please provide your phone number"
      );

      // Combine recipient first and last name
      const recipientName = `${recipientFirstName} ${recipientLastName}`.trim();

      attendees.push({
        time: moment
          .utc(event.start_time)
          .tz("America/Tijuana")
          .format("h:mm A"),
        eventStartTime: moment
          .utc(event.start_time)
          .tz("America/Tijuana")
          .valueOf(),
        recipientName: recipientName || "",
        donorName: donorName || "",
        phoneNumber: phoneNumber || "",
        treatmentRequired: treatmentRequired.replace("USD", "") || "",
        treatmentName: treatmentName || "",
        recipientBloodType: recipientBloodType || "",
        donorBloodType: donorBloodType || "",
        doctorName: doctorName || "",
        visitNumber: visitNumber || "",
        // Fields to leave empty but include in tables
        picked: "",
        paid: "",
        numberOfTubes: "",
        ts: "",
        tsRPM: "",
        sn: "",
        snRPM: "",
        iy: "",
        done: "",
      });
    }
  }

  attendees.sort((a, b) => a.eventStartTime - b.eventStartTime);

  return attendees;
}

// Function to prompt the user for the date
async function promptForDate() {
  const days = Array.from({ length: 31 }, (_, i) => `${i + 1}`);
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => `${currentYear - i}`);

  const { day } = await inquirer.prompt([
    {
      type: "list",
      name: "day",
      message: "Select Day:",
      choices: days,
    },
  ]);

  const { month } = await inquirer.prompt([
    {
      type: "list",
      name: "month",
      message: "Select Month:",
      choices: moment.months(),
    },
  ]);

  const { year } = await inquirer.prompt([
    {
      type: "list",
      name: "year",
      message: "Select Year:",
      choices: years,
    },
  ]);

  const date = moment(`${day} ${month} ${year}`, "D MMMM YYYY");

  if (!date.isValid()) {
    console.error("Invalid date selected.");
    process.exit(1);
  }

  return date.format("YYYY-MM-DD");
}

// Execute the script
(async () => {
  const date = await promptForDate();

  const attendees = await processEvents(date);

  if (attendees.length === 0) {
    console.log(`No events found for ${date}.`);
    return;
  }

  // Generate the PDF
  const pdfFileName = await generatePDF(attendees, date);

  // Generate the CSV
  const csvFileName = generateCSV(attendees, date);

  // Print file URLs
  const pdfFilePath = path.resolve(pdfFileName);
  const csvFilePath = path.resolve(csvFileName);
  const pdfFileUrl = pathToFileURL(pdfFilePath).href;
  const csvFileUrl = pathToFileURL(csvFilePath).href;

  console.log(
    `\nYou can open the PDF by clicking the link below:\n${pdfFileUrl}\n`
  );
  console.log(
    `\nYou can open the CSV by clicking the link below:\n${csvFileUrl}\n`
  );
})();
