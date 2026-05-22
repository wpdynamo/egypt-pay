/** Kashier-specific configuration */
export interface KashierConfig {
  /** Merchant ID (e.g. "MID-31509-363") */
  merchantId: string;
  /** API Key from Integrations section */
  apiKey: string;
  /** Secret Key for Authorization header */
  secretKey: string;
  /** "test" or "live" */
  mode: "test" | "live";
}

/** Raw Kashier session response */
export interface KashierRawSession {
  _id: string;
  status: string;
  sessionUrl: string;
  paymentParams: Record<string, unknown>;
}

/** Kashier webhook payload structure */
export interface KashierWebhookPayload {
  event: "pay" | "refund" | "authorize" | "void" | "capture";
  data: {
    merchantOrderId: string;
    kashierOrderId: string;
    orderReference: string;
    transactionId: string;
    status: string;
    method: string;
    amount: number;
    currency: string;
    card?: {
      cardInfo?: {
        cardBrand?: string;
        maskedCard?: string;
        cardHolderName?: string;
      };
    };
    sourceOfFunds?: {
      cardInfo?: {
        maskedCard?: string;
        cardBrand?: string;
      };
    };
    signatureKeys: string[];
    metaData?: Record<string, unknown>;
    [key: string]: unknown;
  };
}
