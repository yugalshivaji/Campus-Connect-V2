# Campus Connect - Production Setup Guide 🚀

Follow these steps to fully configure your Campus Connect platform.

## 1. Firebase Configuration 🔐
1. Go to [Firebase Console](https://console.firebase.google.com/).
2. Create a new project named **Campus Connect**.
3. Enable **Authentication** (Google Login).
4. Enable **Firestore Database**.
5. Copy your Web App configuration and update `firebase-applet-config.json`.

## 2. Google Sheets & Drive Integration (Apps Script) 📊
This enables real-time participant syncing and payment proof storage.

1. Create a new [Google Sheet](https://sheets.new).
2. Go to **Extensions > Apps Script**.
3. Replace the code with the following:

```javascript
// Campus Connect - Master Apps Script
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID'; // Optional: Script will use active if empty
const MASTER_FOLDER_NAME = 'CampusConnect_Payments';

function doPost(e) {
  const request = JSON.parse(e.postData.contents);
  const action = request.action;
  
  try {
    if (action === 'syncParticipants') {
      return syncParticipants(request.data);
    } else if (action === 'uploadPaymentProof') {
      return uploadPaymentProof(request);
    } else if (action === 'setup') {
      return setupSystem();
    }
    
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: 'Invalid action' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function setupSystem() {
  // Create Master Folder
  let folders = DriveApp.getFoldersByName(MASTER_FOLDER_NAME);
  let masterFolder = folders.hasNext() ? folders.next() : DriveApp.createFolder(MASTER_FOLDER_NAME);
  
  return ContentService.createTextOutput(JSON.stringify({ 
    success: true, 
    message: 'System setup complete',
    masterFolderId: masterFolder.getId()
  })).setMimeType(ContentService.MimeType.JSON);
}

function syncParticipants(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Participants');
  if (!sheet) {
    sheet = ss.insertSheet('Participants');
    sheet.appendRow(['Name', 'Email', 'Phone', 'Event', 'Status', 'Timestamp']);
  }
  
  data.forEach(row => {
    sheet.appendRow([row.name, row.email, row.phone, row.event, row.paymentStatus, row.registrationTime]);
  });
  
  return ContentService.createTextOutput(JSON.stringify({ success: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function uploadPaymentProof(request) {
  const { eventId, paymentId, fileName, fileData, mimeType } = request;
  
  // Get or Create Master Folder
  let folders = DriveApp.getFoldersByName(MASTER_FOLDER_NAME);
  let masterFolder = folders.hasNext() ? folders.next() : DriveApp.createFolder(MASTER_FOLDER_NAME);
  
  // Get or Create Event Folder
  let eventFolders = masterFolder.getFoldersByName(eventId);
  let eventFolder = eventFolders.hasNext() ? eventFolders.next() : masterFolder.createFolder(eventId);
  
  // Create File
  const blob = Utilities.newBlob(Utilities.base64Decode(fileData), mimeType, fileName);
  const file = eventFolder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  
  return ContentService.createTextOutput(JSON.stringify({ 
    success: true, 
    fileUrl: file.getUrl(),
    fileId: file.getId()
  })).setMimeType(ContentService.MimeType.JSON);
}
```

4. Click **Deploy > New Deployment**.
5. Select **Web App**.
6. Set **Execute as: Me** and **Who has access: Anyone**.
7. Copy the **Web App URL** and set it as `APPS_SCRIPT_URL` in the App Settings.

## 3. Brevo Email Setup 📧
1. Create a free account at [Brevo](https://www.brevo.com/).
2. Go to **SMTP & API** section.
3. Generate a new **API Key**.
4. Set this key as `BREVO_API_KEY` in the App Settings.

## 4. PWA Installation 📱
1. Open the app in your mobile browser.
2. Select **Add to Home Screen**.
3. The app will now work as a native-like application with offline capabilities.

## 5. Admin Access 👑
To make yourself an admin:
1. Register on the platform.
2. Go to Firebase Console > Firestore.
3. Find your user document in the `users` collection.
4. Change the `role` field to `admin`.

---
**Techvora09 - Campus Connect v2.0**
