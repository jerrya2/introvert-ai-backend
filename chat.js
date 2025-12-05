import OpenAI from "openai";
import nodemailer from "nodemailer";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message, userId } = req.body;

  // ------------------------------
  // 1. QUIET FRAUD DETECTION LOGIC
  // ------------------------------

  const fraudTriggers = [
    "change address",
    "wrong address",
    "can you ship somewhere else",
    "refund",
    "chargeback",
    "dispute",
    "lost package",
    "resend item",
    "send without tracking",
    "someone else pick it up",
    "bulk order",
    "large quantity",
    "cancel my order",
    "my package didn't arrive",
    "wrong item but keep it",
    "i never received it",
    "i want my money back"
  ];

  const isFraudRisk = fraudTriggers.some(trigger =>
    message.toLowerCase().includes(trigger)
  );

  if (isFraudRisk) {
    // Email alert to your business email
    await sendEmail(
      "usintrvrt@gmail.com",
      "⚠️ POSSIBLE FRAUD ALERT DETECTED",
      `A suspicious message was detected:\n\n"${message}"\n\nUser ID: ${userId || "N/A"}`
    );

    // SMS alert via carrier gateway (Verizon)
    await sendEmail(
      "8635144597@vtext.com",
      "Fraud Alert",
      `Suspicious message:\n"${message}"`
    );
  }

  // ------------------------------
  // 2. AI RESPONSE: Introvert Stylist
  // ------------------------------

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const prompt = `
You are "The Introvert Stylist," an AI sales assistant for the streetwear brand INTROVERT.

TONE:
- Calm, confident, exclusive.
- Hype when needed. Persuasive.
- Always carries the "We Are Not The Same" energy.
- Short replies (1–3 sentences max).

GOALS:
- Recommend products confidently.
- Use urgency (items sell fast, limited drops).
- Suggest bundles + add-ons.
- Push customers toward VIP SMS for early drop passwords.
- Ask for height + weight for sizing questions.
- Always try to move the customer one step closer to purchasing.

PRODUCT KNOWLEDGE:
- Introvert V2 Zip Ups
- Introvert V2 Sets
- Shirts
- Track Star Sets
- Storm Script Windbreaker Sets
- Skull Caps
- Thermal Gloves
- Necklaces
- Bags

SIZING:
True to size with a boxy, cropped silhouette.
Redirect to the size chart on product pages if needed.

If customer shows buying intent:
- Recommend complementary items.
- Mention what usually sells out first.
- Push urgency cleanly.

Customer message:
"${message}"

Your reply:
  `;

  try {
    const completion = await client.responses.create({
      model: "gpt-4.1-mini",
      input: prompt
    });

    const reply = completion.output_text;

    return res.status(200).json({ reply });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      reply: "I glitched for a sec — ask me again."
    });
  }
}


// ------------------------------
// 3. Email Sending Helper
// ------------------------------
async function sendEmail(to, subject, text) {
  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.ALERT_EMAIL,
      pass: process.env.ALERT_EMAIL_PASSWORD
    }
  });

  await transporter.sendMail({
    from: process.env.ALERT_EMAIL,
    to,
    subject,
    text
  });
}