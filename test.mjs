/**
 * Quick test — run with: node test.mjs
 * Uses your Kashier test keys from the deebtools project.
 */

import { createGateway } from "./dist/index.js";

// ── Test Kashier ─────────────────────────────────────────
console.log("━━━ Testing Kashier ━━━\n");

const kashier = createGateway("kashier", {
  merchantId: process.env.KASHIER_MID || "YOUR_MID",
  apiKey: process.env.KASHIER_API_KEY || "YOUR_API_KEY",
  secretKey: process.env.KASHIER_SECRET_KEY || "YOUR_SECRET_KEY",
  mode: "test",
});

try {
  const session = await kashier.createSession({
    orderId: "TEST-LIB-" + Date.now().toString(36),
    amount: 50.00,
    customer: {
      name: "Test User",
      email: "test@example.com",
      phone: "01012345678",
    },
    redirectUrl: "https://store.wpdynamo.com/payment/callback",
    webhookUrl: "https://store.wpdynamo.com/api/webhooks/kashier",
    description: "egypt-pay library test",
    locale: "ar",
  });

  console.log("Session ID:", session.sessionId);
  console.log("Payment URL:", session.paymentUrl);
  console.log("\n✓ Kashier createSession works!\n");
} catch (err) {
  console.error("✗ Kashier error:", err.message);
  if (err.responseBody) console.error("  Response:", err.responseBody);
}

// ── Test Paymob ──────────────────────────────────────────
console.log("━━━ Testing Paymob ━━━\n");

const paymob = createGateway("paymob", {
  secretKey: process.env.PAYMOB_SECRET_KEY || "YOUR_SECRET_KEY",
  publicKey: process.env.PAYMOB_PUBLIC_KEY || "YOUR_PUBLIC_KEY",
  integrationId: process.env.PAYMOB_INTEGRATION_ID || "YOUR_INTEGRATION_ID",
  hmacSecret: process.env.PAYMOB_HMAC_SECRET || "YOUR_HMAC_SECRET",
});

try {
  const session = await paymob.createSession({
    orderId: "TEST-LIB-" + Date.now(),
    amount: 75.00,
    customer: {
      name: "Ahmed Test",
      email: "ahmed@test.com",
      phone: "01098765432",
    },
    redirectUrl: "https://store.wpdynamo.com/payment/callback",
    webhookUrl: "https://store.wpdynamo.com/api/webhooks/paymob",
    description: "egypt-pay library test",
  });

  console.log("Session ID:", session.sessionId);
  console.log("Payment URL:", session.paymentUrl.slice(0, 80) + "...");
  console.log("Raw:", JSON.stringify(session.raw, null, 2));
  console.log("\n✓ Paymob createSession works!\n");
} catch (err) {
  console.error("✗ Paymob error:", err.message);
  if (err.responseBody) console.error("  Response:", err.responseBody);
}

console.log("━━━ Done ━━━");
