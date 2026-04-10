/**
 * Campus Connect - Google Apps Script (V2)
 * 
 * This script handles:
 * 1. Automated setup of all required sheets.
 * 2. CRUD operations for Users, Events, Coupons, and Transactions.
 * 3. Real-time sync with Firebase.
 * 4. Notification and Email logging.
 */

const SHEETS = {
  USERS: 'Users',
  EVENTS: 'Events',
  COUPONS: 'Coupons',
  TRANSACTIONS: 'Transactions',
  REQUESTS: 'Requests',
  EMAIL_LOGS: 'Email Logs',
  NOTIFICATIONS: 'Notifications'
};

/**
 * Run this function to initialize the entire system.
 */
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Create Sheets if they don't exist
  Object.values(SHEETS).forEach(name => {
    let sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
    }
    sheet.clear();
  });

  // Define Headers
  const headers = {
    [SHEETS.USERS]: ['UID', 'Name', 'Email', 'Role', 'Status', 'Joined At'],
    [SHEETS.EVENTS]: ['ID', 'Title', 'Organizer', 'Date', 'Venue', 'Category', 'Fee', 'Coupon Cost'],
    [SHEETS.COUPONS]: ['ID', 'Event ID', 'User ID', 'Status', 'Redeemed At'],
    [SHEETS.TRANSACTIONS]: ['ID', 'Type', 'Amount', 'User ID', 'Timestamp'],
    [SHEETS.REQUESTS]: ['ID', 'Type', 'Requester', 'Amount', 'Status', 'Timestamp'],
    [SHEETS.EMAIL_LOGS]: ['Timestamp', 'Recipient', 'Subject', 'Status'],
    [SHEETS.NOTIFICATIONS]: ['ID', 'User ID', 'Title', 'Message', 'Read', 'Timestamp']
  };

  // Apply Headers and Formatting
  Object.entries(headers).forEach(([name, headerRow]) => {
    const sheet = ss.getSheetByName(name);
    sheet.appendRow(headerRow);
    sheet.getRange(1, 1, 1, headerRow.length)
      .setFontWeight('bold')
      .setBackground('#f3f3f3')
      .setHorizontalAlignment('center');
    sheet.setFrozenRows(1);
  });

  // Insert Sample Data
  const sampleUsers = [
    ['admin_1', 'Admin User', 'yugalofficial63@gmail.com', 'admin', 'approved', new Date()],
    ['org_1', 'Tech Society', 'tech@campus.com', 'organizer', 'approved', new Date()],
    ['student_1', 'John Doe', 'john@example.com', 'student', 'approved', new Date()]
  ];
  const userSheet = ss.getSheetByName(SHEETS.USERS);
  sampleUsers.forEach(row => userSheet.appendRow(row));

  const sampleEvents = [
    ['event_1', 'Annual Hackathon', 'org_1', '2026-05-15', 'Main Hall', 'Tech', 100, 50]
  ];
  const eventSheet = ss.getSheetByName(SHEETS.EVENTS);
  sampleEvents.forEach(row => eventSheet.appendRow(row));

  Logger.log('System setup complete!');
}

/**
 * Handles POST requests from the web app.
 */
function doPost(e) {
  try {
    const request = JSON.parse(e.postData.contents);
    const { action, data } = request;
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    switch(action) {
      case 'setup':
        setup();
        return createResponse({ success: true, message: 'System initialized' });
        
      case 'createUser':
        const userSheet = ss.getSheetByName(SHEETS.USERS);
        userSheet.appendRow([data.uid, data.name, data.email, data.role, data.status || 'pending', new Date()]);
        return createResponse({ success: true });

      case 'createEvent':
        const eventSheet = ss.getSheetByName(SHEETS.EVENTS);
        eventSheet.appendRow([data.id, data.title, data.organizerId, data.date, data.venue, data.category, data.fee, data.couponCost]);
        return createResponse({ success: true });

      case 'storeTransaction':
        const transSheet = ss.getSheetByName(SHEETS.TRANSACTIONS);
        transSheet.appendRow([data.id, data.type, data.amount, data.userId, new Date()]);
        return createResponse({ success: true });

      case 'requestApproval':
        const reqSheet = ss.getSheetByName(SHEETS.REQUESTS);
        reqSheet.appendRow([data.id, data.type, data.requester, data.amount, 'pending', new Date()]);
        return createResponse({ success: true });

      case 'pushNotification':
        const notifSheet = ss.getSheetByName(SHEETS.NOTIFICATIONS);
        notifSheet.appendRow([data.id, data.userId, data.title, data.message, false, new Date()]);
        return createResponse({ success: true });

      default:
        return createResponse({ success: false, error: 'Invalid action: ' + action });
    }
  } catch (err) {
    return createResponse({ success: false, error: err.toString() });
  }
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
  ui.createMenu('Campus Connect Admin')
    .addItem('Initialize System', 'setup')
    .addToUi();
}
