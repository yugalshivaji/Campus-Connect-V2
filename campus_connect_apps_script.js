/**
 * Campus Connect - Google Apps Script
 * 
 * This script handles:
 * 1. Initializing the spreadsheet with formatted sheets and sample data.
 * 2. Handling POST requests from the Campus Connect app to sync registrations and events.
 * 3. Sending automated confirmation emails.
 */

const SHEET_NAME_REGISTRATIONS = 'Participants Data';
const SHEET_NAME_ATTENDANCE = 'Attendance Logs';
const SHEET_NAME_COUPONS = 'Coupon Redemption Logs';
const SHEET_NAME_SUMMARY = 'Event Summary';

/**
 * Run this function once to set up the spreadsheet.
 */
function initializeSpreadsheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Participants Data
  let partSheet = ss.getSheetByName(SHEET_NAME_REGISTRATIONS);
  if (!partSheet) partSheet = ss.insertSheet(SHEET_NAME_REGISTRATIONS);
  partSheet.clear();
  const partHeaders = ['Name', 'Email', 'Phone', 'Event', 'Payment Status', 'Registration Time'];
  partSheet.appendRow(partHeaders);
  formatHeader(partSheet, partHeaders.length);

  // 2. Attendance Logs
  let attSheet = ss.getSheetByName(SHEET_NAME_ATTENDANCE);
  if (!attSheet) attSheet = ss.insertSheet(SHEET_NAME_ATTENDANCE);
  attSheet.clear();
  const attHeaders = ['Name', 'Event', 'Status', 'Scan Time'];
  attSheet.appendRow(attHeaders);
  formatHeader(attSheet, attHeaders.length);

  // 3. Coupon Redemption Logs
  let coupSheet = ss.getSheetByName(SHEET_NAME_COUPONS);
  if (!coupSheet) coupSheet = ss.insertSheet(SHEET_NAME_COUPONS);
  coupSheet.clear();
  const coupHeaders = ['Name', 'Event', 'Coupon Status', 'Redemption Time'];
  coupSheet.appendRow(coupHeaders);
  formatHeader(coupSheet, coupHeaders.length);

  // 4. Event Summary
  let sumSheet = ss.getSheetByName(SHEET_NAME_SUMMARY);
  if (!sumSheet) sumSheet = ss.insertSheet(SHEET_NAME_SUMMARY);
  sumSheet.clear();
  const sumHeaders = ['Event Title', 'Total Participants', 'Attendance Count', 'Coupons Redeemed', 'Total Earnings'];
  sumSheet.appendRow(sumHeaders);
  formatHeader(sumSheet, sumHeaders.length);

  // Add Dummy Data
  partSheet.appendRow(['John Doe', 'john@example.com', '9876543210', 'Tech Summit 2026', 'Paid', new Date()]);
  attSheet.appendRow(['John Doe', 'Tech Summit 2026', 'Present', new Date()]);
  coupSheet.appendRow(['John Doe', 'Tech Summit 2026', 'Redeemed', new Date()]);
  sumSheet.appendRow(['Tech Summit 2026', 150, 120, 100, 15000]);

  SpreadsheetApp.getUi().alert('Spreadsheet initialized with production structure!');
}

function formatHeader(sheet, colCount) {
  sheet.getRange(1, 1, 1, colCount).setFontWeight('bold').setBackground('#f3f3f3').setHorizontalAlignment('center');
  sheet.setFrozenRows(1);
}

/**
 * Handles POST requests from the web app.
 */
function doPost(e) {
  try {
    const request = JSON.parse(e.postData.contents);
    const { action, data } = request;
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    if (action === 'register') {
      const sheet = ss.getSheetByName(SHEET_NAME_REGISTRATIONS);
      sheet.appendRow([
        data.id,
        data.userName,
        data.userEmail,
        data.eventTitle,
        data.ticketId || 'Pending',
        data.status,
        data.attended ? 'Yes' : 'No',
        data.couponRedeemed ? 'Yes' : 'No',
        new Date()
      ]);
      
      sendConfirmationEmail(data);
      return createResponse({ success: true, message: 'Registration synced' });
    }
    
    if (action === 'createEvent') {
      const sheet = ss.getSheetByName(SHEET_NAME_EVENTS);
      sheet.appendRow([
        data.id,
        data.title,
        data.organizerName,
        data.date,
        data.venue,
        data.type,
        data.fee || 0,
        data.category
      ]);
      return createResponse({ success: true, message: 'Event synced' });
    }

    return createResponse({ success: false, error: 'Invalid action' });
  } catch (err) {
    return createResponse({ success: false, error: err.toString() });
  }
}

function sendConfirmationEmail(data) {
  const subject = `Registration Confirmed: ${data.eventTitle}`;
  const htmlBody = `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
      <h2 style="color: #3b82f6;">Campus Connect</h2>
      <p>Hello <strong>${data.userName}</strong>,</p>
      <p>Your registration for <strong>${data.eventTitle}</strong> has been received.</p>
      <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Status:</strong> ${data.status}</p>
        <p style="margin: 5px 0;"><strong>Ticket ID:</strong> ${data.ticketId || 'Awaiting Verification'}</p>
      </div>
      <p>You can view your digital ticket and QR code in the Campus Connect app dashboard.</p>
      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="font-size: 12px; color: #6b7280;">This is an automated message from Campus Connect.</p>
    </div>
  `;
  
  MailApp.sendEmail({
    to: data.userEmail,
    subject: subject,
    htmlBody: htmlBody
  });
}

function createResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Add a menu to the spreadsheet.
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Campus Connect')
    .addItem('Initialize Spreadsheet', 'initializeSpreadsheet')
    .addToUi();
}
