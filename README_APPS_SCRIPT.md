# Campus Connect - Google Apps Script Integration

To enable Google Sheets synchronization and automated email notifications, follow these steps:

1. Create a new Google Sheet.
2. Go to **Extensions > Apps Script**.
3. Replace the default code with the following script:

```javascript
const SHEET_NAME = 'Registrations';
const EVENT_SHEET_NAME = 'Events';

function doPost(e) {
  const request = JSON.parse(e.postData.contents);
  const { action, data } = request;
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  if (action === 'register') {
    let sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      sheet.appendRow(['Registration ID', 'User Name', 'User Email', 'Event Title', 'Ticket ID', 'Status', 'Timestamp']);
    }
    
    sheet.appendRow([
      data.id,
      data.userName,
      data.userEmail,
      data.eventTitle,
      data.ticketId || 'Pending',
      data.status,
      new Date()
    ]);
    
    // Send Confirmation Email
    sendConfirmationEmail(data);
    
    return ContentService.createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  if (action === 'createEvent') {
    let sheet = ss.getSheetByName(EVENT_SHEET_NAME);
    if (!sheet) {
      sheet = ss.insertSheet(EVENT_SHEET_NAME);
      sheet.appendRow(['Event ID', 'Title', 'Organizer', 'Date', 'Venue', 'Type', 'Fee']);
    }
    
    sheet.appendRow([
      data.id,
      data.title,
      data.organizerName,
      data.date,
      data.venue,
      data.type,
      data.fee || 0
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function sendConfirmationEmail(data) {
  const subject = `Registration Confirmed: ${data.eventTitle}`;
  const body = `
    Hello ${data.userName},
    
    Your registration for ${data.eventTitle} has been received.
    
    Status: ${data.status}
    Ticket ID: ${data.ticketId || 'Awaiting Verification'}
    
    You can view your ticket in the Campus Connect app.
    
    Best regards,
    Campus Connect Team
  `;
  
  MailApp.sendEmail(data.userEmail, subject, body);
}
```

4. Click **Deploy > New Deployment**.
5. Select type **Web App**.
6. Set "Execute as" to **Me**.
7. Set "Who has access" to **Anyone**.
8. Copy the **Web App URL**.
9. Add this URL to your environment variables as `APPS_SCRIPT_URL`.

## Environment Variables
Make sure to set these in your project settings:
- `APPS_SCRIPT_URL`: The URL from step 8.
- `RAZORPAY_KEY_ID`: Your Razorpay Key ID.
- `RAZORPAY_KEY_SECRET`: Your Razorpay Key Secret.
- `GEMINI_API_KEY`: Your Google Gemini API Key.
