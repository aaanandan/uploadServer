import { google } from "googleapis";
import fs from "fs";

// Load service account credentials
const credentials = JSON.parse(fs.readFileSync("service-account.json", "utf8"));

// Authenticate using service account
const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

// Google Sheets API instance
export async function updateGoogleSheet(spreadsheetId, range, values) {
  try {
    const sheets = google.sheets({ version: "v4", auth });

    const response = await sheets.spreadsheets.values.update({
      spreadsheetId,
      range, // Example: 'Sheet1!A2:C10'
      valueInputOption: "RAW",
      requestBody: { values },
    });

    console.log("Updated Successfully:", response.data);
  } catch (error) {
    console.error("Error updating sheet:", error);
  }
}

// Google Sheets API instance
export async function appendToGoogleSheet(spreadsheetId, sheetName, values) {
  try {
    const sheets = google.sheets({ version: "v4", auth });

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A1`, // Appends to the first available row
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS", // Ensures rows are inserted at the bottom
      requestBody: { values },
    });

    console.log("Rows appended successfully:", response.data);
  } catch (error) {
    console.error("Error appending rows:", error);
  }
}
