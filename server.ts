import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { fileURLToPath } from "url";
import Razorpay from "razorpay";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_placeholder",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "placeholder_secret",
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Campus Connect API is running" });
  });

  // Razorpay Order Creation
  app.post("/api/payment/order", async (req, res) => {
    const { amount, currency = "INR", receipt } = req.body;
    try {
      const order = await razorpay.orders.create({
        amount: amount * 100, // in paise
        currency,
        receipt,
      });
      res.json(order);
    } catch (error) {
      console.error("Razorpay error:", error);
      res.status(500).json({ error: "Failed to create order" });
    }
  });

  // Payment Verification Mock (Logic placeholder)
  app.post("/api/payments/verify", (req, res) => {
    const { paymentId, orderId, signature } = req.body;
    // Real logic would involve crypto.createHmac with Razorpay secret
    console.log("Verifying payment:", { paymentId, orderId });
    res.json({ success: true });
  });

  // Google Sheets & Drive Proxy (Apps Script)
  app.post("/api/sheets/sync", async (req, res) => {
    const { data, action, eventId, paymentId, fileName, fileData, mimeType } = req.body;
    const scriptUrl = process.env.APPS_SCRIPT_URL;

    if (!scriptUrl) {
      return res.status(500).json({ error: "Apps Script URL not configured" });
    }

    try {
      // Validate URL before making the request
      new URL(scriptUrl);

      const response = await axios.post(scriptUrl, { 
        data, 
        action,
        eventId,
        paymentId,
        fileName,
        fileData,
        mimeType
      }, { 
        timeout: 30000 // 30 seconds for file uploads
      });
      res.json(response.data);
    } catch (error: any) {
      if (error instanceof TypeError && error.message.includes("Invalid URL")) {
        console.error("Sheets sync error: Invalid URL:", scriptUrl);
        return res.status(400).json({ error: "Invalid Apps Script URL configuration." });
      }

      if (error.code === 'ECONNABORTED') {
        console.error("Sheets sync error: Request timed out");
        return res.status(504).json({ error: "Sheets sync timed out" });
      }

      console.error("Sheets sync error:", error.response?.data || error.message || error);
      res.status(500).json({ error: "Failed to sync with sheets/drive" });
    }
  });

  // Brevo Email Integration
  app.post("/api/email/send", async (req, res) => {
    const { to, subject, templateName, params } = req.body;
    const apiKey = process.env.BREVO_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: "Brevo API Key not configured" });
    }

    const templates: Record<string, string> = {
      welcome: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 40px; border-radius: 20px; text-align: center;">
          <h1 style="color: #3b82f6; font-size: 32px; margin-bottom: 20px;">Campus Connect</h1>
          <p style="font-size: 18px; color: #333;">Welcome, <strong>{{name}}</strong>!</p>
          <p style="color: #666; line-height: 1.6;">You're now part of the ultimate campus ecosystem. Explore events, join societies, and elevate your campus experience.</p>
          <a href="{{appUrl}}" style="display: inline-block; background: #3b82f6; color: white; padding: 15px 30px; border-radius: 12px; text-decoration: none; font-weight: bold; margin-top: 30px;">Explore Platform</a>
          <hr style="margin: 40px 0; border: 0; border-top: 1px solid #eee;">
          <p style="font-size: 12px; color: #999;">© 2026 Campus Connect</p>
        </div>
      `,
      otp: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 40px; border-radius: 20px; text-align: center;">
          <h1 style="color: #3b82f6; font-size: 32px; margin-bottom: 20px;">Security Alert</h1>
          <p style="color: #666;">Use the following OTP to complete your action. This code expires in 15 minutes.</p>
          <div style="background: #f3f4f6; padding: 20px; border-radius: 16px; margin: 30px 0;">
            <span style="font-size: 42px; font-weight: 900; letter-spacing: 10px; color: #3b82f6;">{{otp}}</span>
          </div>
          <p style="font-size: 12px; color: #ef4444;">If you didn't request this, please ignore this email.</p>
        </div>
      `,
      notification: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 40px; border-radius: 20px;">
          <h2 style="color: #3b82f6;">{{title}}</h2>
          <p style="color: #333; font-size: 16px; line-height: 1.6;">{{message}}</p>
          <hr style="margin: 30px 0; border: 0; border-top: 1px solid #eee;">
          <p style="font-size: 12px; color: #999;">Campus Connect Notifications</p>
        </div>
      `
    };

    let htmlContent = templates[templateName] || templates.notification;
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        htmlContent = htmlContent.replace(new RegExp(`{{${key}}}`, 'g'), String(val));
      });
    }

    try {
      await axios.post("https://api.brevo.com/v3/smtp/email", {
        sender: { name: "Campus Connect", email: "noreply@campusconnect.com" },
        to: [{ email: to }],
        subject: subject,
        htmlContent: htmlContent
      }, {
        headers: { "api-key": apiKey, "content-type": "application/json" }
      });
      res.json({ success: true });
    } catch (error: any) {
      console.error("Brevo error:", error.response?.data || error.message);
      res.status(500).json({ error: "Failed to send email" });
    }
  });

  // QR Validation
  app.post("/api/qr/validate", (req, res) => {
    const { qrData, type, userId } = req.body;
    // Logic to check if QR is valid, not expired, and not used
    // For demo, we just return valid
    res.json({ valid: true, message: "QR Validated successfully" });
  });

  // AI Recommendation
  app.post("/api/recommendations", async (req, res) => {
    const { userInterests, pastEvents, allEvents } = req.body;
    // Simple scoring: 2 points for category match, 1 point for society follow
    const recommendations = allEvents
      .map((event: any) => {
        let score = 0;
        if (userInterests && userInterests.includes(event.category)) score += 2;
        return { ...event, score };
      })
      .sort((a: any, b: any) => (b.score || 0) - (a.score || 0))
      .slice(0, 5);

    res.json({ recommendations });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
