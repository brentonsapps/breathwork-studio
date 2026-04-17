// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Client, Environment } = require('square');
const { google } = require('googleapis');

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // Essential for reading JSON from Square and your Frontend

// 1. Initialize Square Client
const squareClient = new Client({
  accessToken: process.env.SQUARE_ACCESS_TOKEN,
  environment: Environment.Sandbox, // Change to Production when you're ready for real money
});

// 2. Initialize Google OAuth2 for Gmail
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);
oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

// --- ENDPOINTS ---

/**
 * Endpoint to fetch classes from Square Catalog
 */
app.get('/api/classes', async (req, res) => {
  try {
    const response = await squareClient.catalogApi.listCatalog(undefined, 'ITEM');
    const classes = response.result.objects?.map(item => ({
      id: item.id,
      name: item.itemData.name,
      description: item.itemData.description,
      price: (item.itemData.variations[0].itemVariationData.priceMoney.amount / 100).toFixed(2),
      variationId: item.itemData.variations[0].id
    })) || [];
    res.json(classes);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch catalog" });
  }
});

/**
 * Endpoint to process Payment and Create Booking
 */
app.post('/api/book-session', async (req, res) => {
  const { sourceId, serviceId, startAt, customerEmail, customerName } = req.body;

  try {
    // A. Create the Payment in Square
    const { result: payment } = await squareClient.paymentsApi.createPayment({
      sourceId: sourceId,
      idempotencyKey: Buffer.from(Math.random().toString()).toString('base64'),
      amountMoney: { amount: 5000, currency: 'USD' } // Note: Pull price dynamically in production
    });

    // B. Create the Booking in Square Calendar
    const { result: booking } = await squareClient.bookingsApi.createBooking({
      booking: {
        locationId: process.env.LOCATION_ID,
        serviceVariationId: serviceId,
        startAt: startAt,
        customerNote: `Booked via website: ${customerName}`
      }
    });

    // C. Send Confirmation via Google Workspace (Gmail)
    const subject = "Your Breathwork Journey is Confirmed";
    const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
    const messageParts = [
      `To: ${customerEmail}`,
      'Content-Type: text/html; charset=utf-8',
      'MIME-Version: 1.0',
      `Subject: ${utf8Subject}`,
      '',
      `<h1>Hello ${customerName},</h1><p>Your session is confirmed for ${new Date(startAt).toLocaleString()}. We look forward to breathing with you.</p>`
    ];
    const rawMessage = Buffer.from(messageParts.join('\n'))
      .toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw: rawMessage }
    });

    res.json({ success: true, booking });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Port listener for Render
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Studio server breathing on port ${PORT}`));
