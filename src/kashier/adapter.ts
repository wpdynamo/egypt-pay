import type {
  PaymentGateway,
  CreateSessionParams,
  PaymentSession,
  WebhookEvent,
  PaymentStatus,
} from "../types.js";
import type { KashierConfig, KashierRawSession, KashierWebhookPayload } from "./types.js";
import { hmacSha256 } from "../utils/hmac.js";
import { PaymentError, WebhookVerificationError } from "../utils/errors.js";

const TEST_URL = "https://test-api.kashier.io/v3/payment/sessions";
const LIVE_URL = "https://api.kashier.io/v3/payment/sessions";

export class KashierGateway implements PaymentGateway {
  readonly provider = "kashier" as const;
  private config: KashierConfig;

  constructor(config: KashierConfig) {
    this.config = config;
  }

  private get apiUrl(): string {
    return this.config.mode === "live" ? LIVE_URL : TEST_URL;
  }

  async createSession(params: CreateSessionParams): Promise<PaymentSession> {
    const { merchantId, apiKey, secretKey } = this.config;

    if (!merchantId || !secretKey) {
      throw new PaymentError("kashier", "merchantId or secretKey not configured");
    }

    // Session expires in 30 minutes
    const expireAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    const body: Record<string, unknown> = {
      merchantId,
      order: params.orderId,
      amount: params.amount.toFixed(2),
      currency: params.currency ?? "EGP",
      expireAt,
      maxFailureAttempts: 3,
      merchantRedirect: params.redirectUrl,
      allowedMethods: params.allowedMethods ?? "card,wallet",
      display: params.locale ?? "ar",
      type: "one-time",
      failureRedirect: false,
      brandColor: "#2563eb",
      description: params.description ?? `Order ${params.orderId}`,
      interactionSource: "ECOMMERCE",
    };

    if (params.webhookUrl) {
      body.serverWebhook = params.webhookUrl;
    }

    if (params.customer.email) {
      body.customer = {
        email: params.customer.email,
        reference: params.customer.reference ?? params.customer.email,
      };
    }

    if (params.metadata) {
      body.metaData = params.metadata;
    }

    const res = await fetch(this.apiUrl, {
      method: "POST",
      headers: {
        Authorization: secretKey,
        "api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new PaymentError("kashier", `API error ${res.status}`, res.status, text);
    }

    const data = (await res.json()) as KashierRawSession;

    return {
      sessionId: data._id,
      paymentUrl: data.sessionUrl,
      raw: data,
    };
  }

  async verifyWebhook(
    body: unknown,
    signature?: string
  ): Promise<WebhookEvent | null> {
    const payload = body as KashierWebhookPayload;

    if (!payload?.data?.signatureKeys || !signature) {
      throw new WebhookVerificationError("kashier", "Missing signatureKeys or signature");
    }

    // Build signature payload: sort keys alphabetically, then querystring format
    const keys = [...payload.data.signatureKeys].sort();
    const signaturePayload = keys
      .map((key) => `${key}=${encodeURIComponent(String(payload.data[key] ?? ""))}`)
      .join("&");

    const computed = await hmacSha256(this.config.apiKey, signaturePayload);

    if (computed !== signature.toLowerCase()) {
      throw new WebhookVerificationError("kashier", "Signature mismatch");
    }

    // Map status
    const statusMap: Record<string, PaymentStatus> = {
      SUCCESS: "paid",
      FAILURE: "failed",
      PENDING: "pending",
    };

    const cardInfo =
      payload.data.card?.cardInfo ?? payload.data.sourceOfFunds?.cardInfo;

    return {
      orderId: payload.data.merchantOrderId,
      status: statusMap[payload.data.status] ?? "pending",
      transactionId: payload.data.transactionId,
      amount: payload.data.amount / 100, // Kashier sends in piasters
      currency: payload.data.currency,
      method: payload.data.method,
      card: cardInfo
        ? { brand: cardInfo.cardBrand, maskedCard: cardInfo.maskedCard }
        : undefined,
      raw: payload,
    };
  }
}
