# egypt-pay

Unified payment gateway library for Egyptian payment providers.

**Supports:** Kashier, Paymob  
**Runtime:** Node 18+, Cloudflare Workers, Deno, Bun  
**Dependencies:** None (uses Web Crypto API)


![egypt-pay](https://raw.githubusercontent.com/wpdynamo/egypt-pay/main/assets/banner.png)


## Installation

```bash
npm install egypt-pay
```

## Quick Start

```typescript
import { createGateway } from "egypt-pay";

// ── Kashier ──────────────────────────────────────────────
const kashier = createGateway("kashier", {
  merchantId: "MID-123-456",
  apiKey: "your-api-key",
  secretKey: "your-secret-key",
  mode: "test", // "test" | "live"
});

// ── Paymob ───────────────────────────────────────────────
const paymob = createGateway("paymob", {
  secretKey: "egy_sk_test_...",
  publicKey: "egy_pk_test_...",
  integrationId: "5357002",
  hmacSecret: "YOUR_HMAC_SECRET",
});

// ── Create Session (same interface for both) ─────────────
const session = await kashier.createSession({
  orderId: "ORD-001",
  amount: 150.0,
  customer: {
    name: "Ahmed Mohamed",
    email: "ahmed@example.com",
    phone: "01012345678",
  },
  redirectUrl: "https://yoursite.com/payment/callback",
  webhookUrl: "https://yoursite.com/api/webhooks/payment",
  description: "Order #001",
  locale: "ar",
});

// Redirect customer to:
console.log(session.paymentUrl);
```

## Webhook Verification

```typescript
// Kashier webhook
app.post("/api/webhooks/kashier", async (req, res) => {
  const signature = req.headers["x-kashier-signature"];
  const event = await kashier.verifyWebhook(req.body, signature);

  if (event && event.status === "paid") {
    // Update order status
    await markOrderPaid(event.orderId, event.transactionId);
  }

  res.status(200).send("OK");
});

// Paymob webhook
app.post("/api/webhooks/paymob", async (req, res) => {
  const hmac = req.query.hmac || req.body.hmac;
  const event = await paymob.verifyWebhook(req.body, hmac);

  if (event && event.status === "paid") {
    await markOrderPaid(event.orderId, event.transactionId);
  }

  res.status(200).send("OK");
});
```

## API Reference

### `createGateway(provider, config)`

Creates a gateway instance.

| Provider | Config |
|----------|--------|
| `"kashier"` | `{ merchantId, apiKey, secretKey, mode }` |
| `"paymob"` | `{ secretKey, publicKey, integrationId, hmacSecret }` |

### `gateway.createSession(params)`

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `orderId` | string | Yes | Your internal order ID |
| `amount` | number | Yes | Amount in EGP (e.g. 150.00) |
| `customer` | object | Yes | `{ name, email, phone?, reference? }` |
| `redirectUrl` | string | Yes | URL after payment |
| `webhookUrl` | string | No | Server-to-server notification URL |
| `description` | string | No | Payment description |
| `locale` | "ar" \| "en" | No | Display language |
| `allowedMethods` | string | No | e.g. "card,wallet" |
| `items` | array | No | Line items |
| `metadata` | object | No | Extra key-value pairs |

**Returns:** `{ sessionId, paymentUrl, raw }`

### `gateway.verifyWebhook(body, signature)`

Verifies and parses a webhook payload.

**Returns:** `{ orderId, status, transactionId, amount, currency, method, card, raw }` or throws `WebhookVerificationError`.

### Payment Status

| Status | Description |
|--------|-------------|
| `"paid"` | Payment successful |
| `"failed"` | Payment failed |
| `"pending"` | Awaiting confirmation |
| `"refunded"` | Payment refunded |
| `"voided"` | Payment voided |

## Direct Import

You can also import adapters directly:

```typescript
import { KashierGateway } from "egypt-pay/kashier";
import { PaymobGateway } from "egypt-pay/paymob";
```

## Error Handling

```typescript
import { PaymentError, WebhookVerificationError } from "egypt-pay";

try {
  const session = await gateway.createSession(params);
} catch (err) {
  if (err instanceof PaymentError) {
    console.error(err.provider, err.statusCode, err.responseBody);
  }
}
```

## License

MIT
