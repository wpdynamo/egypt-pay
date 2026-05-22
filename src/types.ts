/**
 * Shared types for egypt-pay payment gateways.
 */

/** Supported gateway providers */
export type GatewayProvider = "kashier" | "paymob";

/** Customer billing information */
export interface Customer {
  name: string;
  email: string;
  phone?: string;
  reference?: string;
}

/** Line item for the payment */
export interface LineItem {
  name: string;
  amount: number;
  quantity: number;
  description?: string;
}

/** Parameters to create a payment session */
export interface CreateSessionParams {
  /** Your internal order ID */
  orderId: string;
  /** Amount in EGP (e.g. 150.00) */
  amount: number;
  /** Currency code (default: "EGP") */
  currency?: string;
  /** Customer information */
  customer: Customer;
  /** URL to redirect after payment */
  redirectUrl: string;
  /** Server-to-server webhook URL */
  webhookUrl?: string;
  /** Line items (optional) */
  items?: LineItem[];
  /** Description shown to customer */
  description?: string;
  /** Display language */
  locale?: "ar" | "en";
  /** Allowed payment methods (e.g. "card,wallet") */
  allowedMethods?: string;
  /** Extra metadata */
  metadata?: Record<string, string>;
}

/** Result of creating a payment session */
export interface PaymentSession {
  /** Gateway-specific session/intention ID */
  sessionId: string;
  /** URL to redirect the customer to for payment */
  paymentUrl: string;
  /** Raw response from the gateway */
  raw?: unknown;
}

/** Webhook event status */
export type PaymentStatus = "paid" | "failed" | "pending" | "refunded" | "voided";

/** Parsed webhook event */
export interface WebhookEvent {
  /** Your internal order ID */
  orderId: string;
  /** Payment status */
  status: PaymentStatus;
  /** Gateway transaction ID */
  transactionId: string;
  /** Amount paid (in EGP) */
  amount: number;
  /** Currency */
  currency: string;
  /** Payment method used */
  method?: string;
  /** Card info if available */
  card?: {
    brand?: string;
    maskedCard?: string;
  };
  /** Raw event payload */
  raw: unknown;
}

/** Gateway interface — all adapters implement this */
export interface PaymentGateway {
  readonly provider: GatewayProvider;

  /** Create a payment session and get a redirect URL */
  createSession(params: CreateSessionParams): Promise<PaymentSession>;

  /** Verify and parse a webhook payload */
  verifyWebhook(body: unknown, signature?: string): Promise<WebhookEvent | null>;
}
