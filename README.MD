# Project Title: Calendly Appointment Exporter

## Description

This tool generates PDF and CSV files containing information about Calendly appointments for a specified date. It extracts and formats attendee details such as recipient and donor names, creating organized outputs for easy reference and sharing.

## Install dependencies:

```bash
npm install
```

## Usage

Run the script:

```bash
node ./main.js
```

Follow the prompts:

Select the date for which you want to retrieve Calendly appointments.

The tool will generate:

- A PDF file summarizing the appointment details.
- A CSV file listing attendee information (Recipient Name and Donor Name).

Locate the files:

Generated files are saved in the same directory as the script.
Open the terminal output links to view the files directly.

## Requirements

Node.js (version 14 or higher)

npm package manager

## Features

- Fetches Calendly appointment data using the API.
- Generates a PDF with detailed information.
- Produces a CSV file with key attendee details.
