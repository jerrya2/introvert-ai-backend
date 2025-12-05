// introvert-ai-backend/api/chat.js

import OpenAI from "openai";
import { Resend } from "resend";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message, userId } = req.body;

  // ------------------------------------
  // 1. FRAUD DETECTION (Email Alert)
  // ------------------------------------
  const fraudTriggers = [
    "change address",
    "wrong address",
    "ship somewhere else",
    "refund",
    "chargeback",
    "dispute",
    "lost package",
    "resend",
    "send without tracking",
    "pickup",
    "large order",
    "bulk order",
    "cancel my order",
    "never received",
    "money back"
  ];

  const isFraudRisk = fraudTriggers.some(trigger =>
    message.toLowerCase().includes(trigger)
  );

  if (isFraudRisk) {
    await sendEmailAlert(
      `⚠️ Fraud Risk Detected\n\nMessage: "${message}"\nUser: ${
        userId || "Unknown"
      }"`
    );
  }

  // ------------------------------------
  // 2. AI SALES ASSISTANT LOGIC
  // ------------------------------------
  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const prompt = `
You are "The Introvert Stylist" — the AI sales assistant for the streetwear brand INTROVERT.

TONE:
- Calm, confident, exclusive.
- "We Are Not The Same" energy.
- Short responses (1–3 sentences max).
- Persuasive and hype when needed.
- Educate customers and guide them to buy.

GOALS:
- Sell products by recommending based on what they say.
- Push urgency: limited stock, selling fast.
- Offer bundles / pairs.
- Ask height + weight if they ask about sizing.
- Promote the VIP SMS list for early access.
- Always guide toward checkout.

PRODUCTS YOU KNOW:
- Introvert V2 Zip Ups
- Introvert V2 Sets
- Shirts
- Track Star Sets
- Storm Script Windbreaker Sets
- Skull Caps, Thermal Gloves
- Necklaces, Bags

SIZING:
- True to size.
- Boxy + slightly cropped.
- You may reference size charts.

Customer message:
"${message}"

Reply as The Introvert Stylist:
  `;

  try {
    const completion = await client.responses.create({
      model: "gpt-4.1-mini",
      input: prompt,
    });

    const replyText = completion.output_text;
    return res.status(200).json({ reply: replyText });

  } catch (err) {
    console.error("AI ERROR:", err);
    return res.status(500).json({
      reply: "My bad — I glitched for a sec. Ask me again.",
    });
  }
}

// ------------------------------------
// 3. RESEND EMAIL ALERT FUNCTION
// ------------------------------------

async function sendEmailAlert(text) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: "Introvert Alerts <alerts@introvertai.net>",
      to: process.env.ALERT_EMAIL, // your real email in Vercel
      subject: "⚠️ Fraud Risk Detected",
      text: text,
    });

  } catch (error) {
    console.error("Email alert failed:", error);
  }
}