
# 🏫 Campus Connect - Ultimate Campus Ecosystem

## Immersive Event Management & Student Participation Platform

<p align="center">

![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-12.11-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Three.js](https://img.shields.io/badge/Three.js-0.183-000000?style=for-the-badge&logo=three.js&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)

</p>

---

# 🌍 Overview

**Campus Connect** is a professional, immersive event management and participation platform designed for college campuses. Built with a mobile-first approach, the platform enables students to discover events, register with QR-based ticketing, track attendance, and redeem food coupons—all within a stunning 3D-powered interface.

The platform supports multiple user roles: **Students**, **Society Organizers**, **Canteen Vendors**, and **Administrators**. Each role has tailored dashboards, permissions, and workflows. From event creation and payment verification to real-time analytics and AI-powered recommendations, Campus Connect streamlines the entire campus event lifecycle.

Whether you're organizing a hackathon, managing a cultural fest, or running a canteen, Campus Connect provides the tools to engage participants, track metrics, and ensure seamless coordination.

---

# 🎯 Vision

Campus events are the heartbeat of student life, yet managing them is often chaotic, fragmented, and manual.

Students struggle to discover events, organizers battle with spreadsheets, and canteens face redemption chaos.

Campus Connect addresses these challenges by providing:

* 📱 Mobile-First Immersive Experience
* 🎫 QR-Based Digital Ticketing
* 📊 Real-Time Attendance Tracking
* 🍽️ Integrated Food Coupon System
* 🤖 AI-Powered Event Recommendations
* 📈 Role-Based Analytics Dashboards
* 🔐 Secure Payment Verification
* 🏛️ Society Ecosystem Management

The goal is to transform campus event management from chaos to clarity, creating a seamless experience for every stakeholder.

---

# ✨ Features

## 🎫 QR-Based Digital Ticketing

Generate unique QR codes for every registration.

Features include:

* Dynamic QR Code Generation
* Attendance Verification
* Food Coupon Redemption
* Security Token Validation
* Real-Time Status Updates

---

## 🍽️ Integrated Food Coupon System

Seamless food coupon management for events.

Includes:

* Per-Event Coupon Configuration
* Student-Specific QR Generation
* Canteen Redemption Portal
* Redemption Analytics
* Payment Request Workflow

---

## 📊 Role-Based Dashboards

Tailored experiences for every user role:

### Student Dashboard
* Event Discovery & Recommendations
* Personal Calendar View
* Registration Management
* QR Ticket Access
* Points & Achievements

### Organizer Dashboard
* Event Creation & Management
* Attendance Verification
* Payment Approval Workflow
* Real-Time Analytics
* Canteen Payout Management

### Canteen Portal
* Coupon Scanning Interface
* Redemption Logging
* Earnings Dashboard
* Payment Request Submission
* QR Code Validation

### Admin Control Panel
* User Management & Approval
* System-Wide Analytics
* Event Moderation
* Payment Oversight
* Google Sheets Integration

---

## 🏛️ Society Ecosystem

Create and manage campus societies.

Features:

* Society Profiles with Branding
* Follower System
* Event Publishing
* Member Management
* Analytics & Growth Metrics

---

## 🤖 AI-Powered Recommendations

Gemini-powered event suggestions.

Includes:

* Interest-Based Recommendations
* Category Matching
* Personalized Feed
* Dynamic Scoring
* Continuous Learning

---

## 🗺️ 3D Immersive Interface

Visually stunning experience with Three.js.

Features:

* Interactive 3D Background
* Smooth Animations
* Glassmorphism Design
* Light/Dark/Neon Themes
* Mobile-Optimized Performance

---

## 🔐 Secure Payment Integration

Flexible payment processing.

Includes:

* Razorpay Integration (Paid Events)
* Manual UPI/QR Verification
* Payment Screenshot Upload
* Transaction ID Tracking
* Admin Verification Workflow

---

## 📤 Google Sheets & Drive Sync

Real-time data synchronization.

Features:

* Automatic Registration Logging
* Payment Proof Storage
* Email Automation
* Spreadsheet Initialization
* Admin Dashboard Control

---

## 📧 Automated Email Notifications

Transactional email automation.

Includes:

* Welcome Emails (Brevo)
* Registration Confirmations
* Payment Status Updates
* Event Reminders
* System Notifications

---

# 🏗 System Architecture

```text
┌─────────────────────────────────────────────────────┐
│                   Client Browser                    │
│              React + TypeScript + Vite              │
└────────────────────┬────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────┐
│                  Firebase Backend                   │
│           Auth • Firestore • Security Rules         │
└────────┬──────────────────────┬────────────────────┘
         │                      │
┌────────▼────────┐   ┌────────▼────────────────────┐
│  Express Server │   │   Google Apps Script        │
│   (Node.js)     │   │   Sheets • Drive • Email    │
│  API Gateway    │   │   (Spreadsheet Sync)        │
└────────┬────────┘   └─────────────────────────────┘
         │
┌────────▼────────────────────────────────────────────┐
│              External Services                      │
│   Razorpay • Brevo Email • Gemini AI • Google Maps │
└─────────────────────────────────────────────────────┘
```

---

# 📂 Project Structure

```text
yugalshivaji-campus-connect-v2/
│
├── index.html
├── manifest.json
├── netlify.toml
├── package.json
├── vite.config.ts
├── tsconfig.json
├── firebase-applet-config.json
├── firebase-blueprint.json
├── firestore.rules
├── .env.example
├── server.ts                          # Express Backend
├── campus_connect_apps_script.js      # Google Apps Script V1
├── campus_connect_apps_script_v2.js   # Google Apps Script V2
├── README_APPS_SCRIPT.md              # Apps Script Setup Guide
├── SETUP_GUIDE.md                     # Full Production Setup
└── src/
    ├── App.tsx
    ├── main.tsx
    ├── firebase.ts
    ├── types.ts
    ├── index.css
    ├── components/
    │   ├── BottomNav.tsx
    │   ├── EventCard.tsx
    │   ├── ProtectedRoute.tsx
    │   ├── QRScanner.tsx
    │   ├── RoleHeader.tsx
    │   ├── Scene.tsx
    │   ├── ThemeToggle.tsx
    │   └── Ticket.tsx
    ├── context/
    │   ├── AuthContext.tsx
    │   └── ThemeContext.tsx
    ├── lib/
    │   └── utils.ts
    ├── pages/
    │   ├── AdminDashboard.tsx
    │   ├── Calendar.tsx
    │   ├── CanteenPortal.tsx
    │   ├── CreateEvent.tsx
    │   ├── CreateSociety.tsx
    │   ├── Dashboard.tsx
    │   ├── EventDetails.tsx
    │   ├── Explore.tsx
    │   ├── Home.tsx
    │   ├── HowToUse.tsx
    │   ├── Landing.tsx
    │   ├── Login.tsx
    │   ├── ManageEvent.tsx
    │   ├── Notifications.tsx
    │   ├── Profile.tsx
    │   └── SocietyProfile.tsx
    └── services/
        └── aiService.ts
```

---

# 🛠 Technology Stack

## Frontend

* React 19
* TypeScript 5.8
* Vite 6.2
* Tailwind CSS 4.1
* Motion (Framer Motion)
* React Three Fiber (3D)
* React Router DOM 7
* Lucide React (Icons)
* Recharts (Analytics)
* QRCode.react
* html5-qrcode
* jsPDF

---

## Backend

* Node.js + Express
* Razorpay SDK
* Axios
* dotenv
* TypeScript (tsx)

---

## Database & Auth

* Firebase Firestore
* Firebase Authentication
* Firebase Security Rules
* Google OAuth

---

## Integrations

* Google Apps Script (Sheets/Drive)
* Brevo (Email API)
* Google Gemini AI
* Razorpay (Payments)

---

# 📊 Firestore Data Schema

## Users (`users/{userId}`)

```typescript
{
  uid: string;
  name: string;
  email: string;
  role: 'student' | 'organizer' | 'admin' | 'canteen';
  phone?: string;
  college?: string;
  course?: string;
  interests: string[];
  points: number;
  badges: string[];
  societyId?: string;
  followedSocieties: string[];
  photoURL?: string;
  vendorName?: string;      // For canteen
  organisation?: string;     // For organizers
  upiId?: string;           // For canteen
  razorpayId?: string;      // For canteen
  status?: 'pending' | 'approved' | 'rejected';
}
```

## Events (`events/{eventId}`)

```typescript
{
  id: string;
  title: string;
  description: string;
  date: string;
  venue: string;
  organizerId: string;
  category: string;
  type: 'free' | 'paid';
  fee?: number;
  couponCost?: number;
  maxCoupons?: number;
  registrationLimit: number;
  registeredCount: number;
  posterUrl?: string;
  slug: string;
  status: 'upcoming' | 'ongoing' | 'completed';
  hasFoodCoupon: boolean;
  isCanteenPaymentDone?: boolean;
  qrVisible: boolean;
  qrExpiry?: string;
  qrScanLimit?: number;
  couponsDistributed?: boolean;
}
```

## Registrations (`registrations/{regId}`)

```typescript
{
  id: string;
  userId: string;
  eventId: string;
  status: 'pending' | 'confirmed' | 'rejected';
  paymentId?: string;
  transactionId?: string;
  paymentScreenshot?: string;
  ticketId?: string;
  attended: boolean;
  couponRedeemed: boolean;
  couponActive?: boolean;
  qrCode?: string;
  scannedAt?: any;
  validationToken?: string;
}
```

---

# 🔄 Application Workflow

## 1. User Authentication Flow

```text
User Opens App
        │
        ▼
Landing Page
        │
        ▼
Login/Register (Google OAuth / Email)
        │
        ▼
Role-Based Redirect
        │
        ├── Student → Home
        ├── Organizer → Dashboard
        ├── Canteen → Canteen Portal
        └── Admin → Admin Dashboard
```

---

## 2. Event Registration Flow

```text
Student Browses Events
        │
        ▼
Event Details Page
        │
        ▼
Register (Free/Paid)
        │
        ├── Free → Instant QR Ticket
        └── Paid → Payment Flow
                   │
                   ├── Razorpay → Auto-Verification
                   └── UPI/QR → Manual Verification
        │
        ▼
QR Ticket Generated
        │
        ▼
Event Day: QR Scan for Attendance
```

---

## 3. Food Coupon Flow

```text
Event Created with Food Coupon
        │
        ▼
Student Registers & Attends Event
        │
        ▼
Food Coupon QR Unlocked
        │
        ▼
Student Presents QR to Canteen
        │
        ▼
Canteen Scans & Validates QR
        │
        ▼
Coupon Redeemed (One-Time)
        │
        ▼
Organizer Approves Payment Request
        │
        ▼
Canteen Receives Payout
```

---

# ⚙ Installation

## Prerequisites

* Node.js 18+
* npm or yarn
* Firebase Account
* Groq API Key (for recommendations)
* Razorpay Account (for payments)
* Brevo Account (for emails)

---

## Clone Repository

```bash
git clone https://github.com/YugalOfficial/yugalshivaji-campus-connect-v2.git

cd yugalshivaji-campus-connect-v2
```

---

## Install Dependencies

```bash
npm install
```

---

## Firebase Configuration

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable **Authentication** with Google Sign-In
3. Enable **Firestore Database**
4. Copy your Firebase configuration
5. Update `firebase-applet-config.json` with your credentials:

```json
{
  "apiKey": "YOUR_API_KEY",
  "authDomain": "YOUR_PROJECT.firebaseapp.com",
  "projectId": "YOUR_PROJECT_ID",
  "storageBucket": "YOUR_PROJECT.firebasestorage.app",
  "messagingSenderId": "YOUR_SENDER_ID",
  "appId": "YOUR_APP_ID"
}
```

---

## Environment Variables

Create a `.env` file in the project root:

```env
# Firebase Configuration (Optional - auto-loaded from JSON)
GEMINI_API_KEY=your_gemini_api_key
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret
APPS_SCRIPT_URL=https://script.google.com/macros/s/xxxxx/exec
BREVO_API_KEY=your_brevo_api_key
APP_URL=http://localhost:3000
```

---

## Deploy Firestore Security Rules

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Deploy rules
firebase deploy --only firestore:rules
```

---

## Run Backend Server

```bash
npm run dev
```

Server runs on: `http://localhost:3000`

---

## Run Frontend (Development)

```bash
npm run build   # Build production
npm run preview # Preview build
```

Or run Vite directly for development:

```bash
npx vite
```

---

# 🚀 Deployment

## Frontend Deployment (Netlify)

```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

Deploy with:

```bash
netlify deploy --prod
```

---

## Backend Deployment (Render / Vercel)

```bash
# Deploy Node.js server
# Example: Render.com - Create a Web Service
# Build Command: npm install
# Start Command: npm run start
```

---

## Google Apps Script Deployment

1. Create a Google Sheet
2. Open **Extensions > Apps Script**
3. Paste `campus_connect_apps_script_v2.js`
4. Click **Deploy > New Deployment**
5. Select **Web App**
6. Set "Execute as" to **Me**
7. Set "Who has access" to **Anyone**
8. Copy the Web App URL
9. Set `APPS_SCRIPT_URL` in your environment variables

---

# 🔒 Firestore Security Rules

The platform implements comprehensive Firestore security rules with role-based access control:

```javascript
// Helper Functions
function isAuthenticated() { return request.auth != null; }
function isOwner(userId) { return isAuthenticated() && request.auth.uid == userId; }
function isAdmin() { return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'; }
function isOrganizer() { return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'organizer' || isAdmin(); }
function isCanteen() { return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'canteen' || isAdmin(); }
```

### Access Rules Summary

| Collection | Read Access | Write Access |
|------------|-------------|--------------|
| `users` | Authenticated | Owner Only |
| `events` | Public | Organizers/Admins |
| `registrations` | Role-Based | Student/Owner/Organizer/Canteen |
| `societies` | Public | Organizers |
| `payments` | Organizers/Canteen/Admin | Organizers/Admin |
| `notifications` | Owner Only | Organizers/Admin |

---

# 📚 API Endpoints

## Health Check
```
GET /api/health
```

## Payment Order
```
POST /api/payment/order
Body: { amount, currency, receipt }
```

## Payment Verification
```
POST /api/payments/verify
Body: { paymentId, orderId, signature }
```

## Sheets Sync
```
POST /api/sheets/sync
Body: { data, action, eventId, paymentId, fileName, fileData, mimeType }
```

## Email Send (Brevo)
```
POST /api/email/send
Body: { to, subject, templateName, params }
```

## QR Validation
```
POST /api/qr/validate
Body: { qrData, type, userId }
```

## AI Recommendations
```
POST /api/recommendations
Body: { userInterests, pastEvents, allEvents }
```

---

# 🌟 Future Enhancements

* 📱 Progressive Web App (PWA) Full Implementation
* 🔔 Push Notifications (FCM)
* 💳 Full Razorpay Integration with Webhooks
* 📊 Advanced Analytics Dashboard
* 🗺️ Interactive Campus Maps
* 🎥 Live Event Streaming
* 📝 Feedback & Rating System
* 🏆 Gamification Engine (More Badges)
* 🌐 Multi-Campus Support
* 🤖 Enhanced AI Personalization
* 📅 Recurring Event Scheduling
* 📱 Native Mobile Apps (React Native)
* 🔗 Social Media Integration
* 📈 Exportable Analytics Reports
* 🎨 Customizable Event Themes

---

# 💡 Project Highlights

* 🎫 QR-Based Digital Ticketing System
* 🍽️ Integrated Food Coupon Redemption
* 📊 Role-Based Dashboards (Student/Organizer/Canteen/Admin)
* 🤖 AI-Powered Event Recommendations
* 🏛️ Society Ecosystem Management
* 💳 Secure Payment Verification (Razorpay/Manual)
* 📤 Google Sheets & Drive Sync
* 📧 Automated Email Notifications
* 🗺️ 3D Immersive Interface
* 📱 Mobile-First Design
* 🔐 Comprehensive Security Rules
* 🎨 Light/Dark/Neon Themes

---

# 🤝 Contributing

Contributions are welcome and greatly appreciated.

1. Fork the repository.

2. Create a feature branch.

```bash
git checkout -b feature/NewFeature
```

3. Commit your changes.

```bash
git commit -m "Add New Feature"
```

4. Push your branch.

```bash
git push origin feature/NewFeature
```

5. Submit a Pull Request.

---

# 📜 License

This project is licensed under the **MIT License**.

You are free to use, modify, and distribute this project with appropriate attribution.

---

# 👨‍💻 Author

## **Yugal**

**AI Developer • Full Stack Developer • Software Engineer**

Passionate about building AI-powered applications, immersive platforms, and scalable web solutions that create meaningful real-world impact through technology.

---

# 🙏 Acknowledgements

Special thanks to the technologies and services that power this project:

* Firebase (Auth, Firestore)
* Google Apps Script
* Razorpay
* Brevo (Email API)
* Google Gemini AI
* React Three Fiber
* Tailwind CSS
* Netlify

---

# ⭐ Support the Project

If you found this project useful, please consider giving it a **⭐ Star** on GitHub.

Your support motivates the development of more innovative open-source applications focused on education, student engagement, and digital public services.

---

<p align="center">

## ❤️ Empowering Campus Communities Through Technology

### Built with dedication and innovation by **Yugal**

**"Seamless campus experiences start with intelligent platforms."**

</p>
