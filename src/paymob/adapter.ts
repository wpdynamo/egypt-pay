import type {
  PaymentGateway,
  CreateSessionParams,
  PaymentSession,
  WebhookEvent,
  PaymentStatus,
} from "../types.js";
import type { PaymobConfig, PaymobRawIntention, PaymobWebhookPayload } from "./types.js";
import { hmacSha512 } from "../utils/hmac.js";
import { PaymentError, WebhookVerificationError } from "../utils/errors.js";

const DEFAULT_BASE_URL = "https://accept.paymob.com";

/** Fields used for HMAC verification (in this exact order) */
const HMAC_FIELDS = [
  "amount_cents",
  "created_at",
  "currency",
  "error_occured",
  "has_parent_transaction",
  "id",
  "integration_id",
  "is_3d_secure",
  "is_auth",
  "is_capture",
  "is_refunded",
  "is_standalone_payment",
  "is_voided",
  "order",
  "owner",
  "pending",
  "source_data.pan",
  "source_data.sub_type",
  "source_data.type",
  "success",
] as const;

export class PaymobGateway implements PaymentGateway {
  readonly provider = "paymob" as const;
  private config: PaymobConfig;

  constructor(config: PaymobConfig) {
    this.config = config;
  }

  private get baseUrl(): string {
    return (this.config.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, "");
  }

  async createSession(params: CreateSessionParams): Promise<PaymentSession> {
    const { secretKey, publicKey, integrationId } = this.config;

    if (!secretKey || !publicKey || !integrationId) {
      throw new PaymentError("paymob", "secretKey, publicKey, or integrationId not configured");
    }

    // Amount in cents (piasters)
    const amountCents = Math.round(params.amount * 100);

    // Split customer name
    const nameParts = params.customer.name.trim().split(" ");
    const firstName = nameParts[0] ?? "Customer";
    const lastName = nameParts.slice(1).join(" ") || "N/A";

    const body = {
      amount: amountCents,
      currency: params.currency ?? "EGP",
      payment_methods: [parseInt(integrationId)],
      items: params.items?.map((item) => ({
        name: item.name,
        amount: Math.round(item.amount * 100),
        description: item.description ?? item.name,
        quantity: item.quantity,
      })) ?? [
        {
          name: params.description ?? `Order ${params.orderId}`,
          amount: amountCents,
          description: params.description ?? `Order ${params.orderId}`,
          quantity: 1,
        },
      ],
      billing_data: {
        first_name: firstName,
        last_name: lastName,
        email: params.customer.email,
        phone_number: params.customer.phone ?? "N/A",
        apartment: "N/A",
        floor: "N/A",
        street: "N/A",
        building: "N/A",
        city: "Cairo",
        country: "EG",
        state: "N/A",
      },
      special_reference: params.orderId,
      expiration: 3600,
      notification_url: params.webhookUrl,
      redirection_url: params.redirectUrl,
    };

    const res = await fetch(`${this.baseUrl}/v1/intention/`, {
      method: "POST",
      headers: {
        Authorization: `Token ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new PaymentError("paymob", `API error ${res.status}`, res.status, text);
    }

    const data = (await res.json()) as PaymobRawIntention;

    const checkoutUrl = `${this.baseUrl}/unifiedcheckout/?publicKey=${publicKey}&clientSecret=${data.client_secret}`;

    return {
      sessionId: data.id,
      paymentUrl: checkoutUrl,
      raw: data,
    };
  }

  async verifyWebhook(
    body: unknown,
    receivedHmac?: string
  ): Promise<WebhookEvent | null> {
    if (!receivedHmac) {
      throw new WebhookVerificationError("paymob", "Missing HMAC");
    }

    const payload = body as PaymobWebhookPayload;
    const obj = payload?.obj;

    if (!obj) {
      throw new WebhookVerificationError("paymob", "Missing transaction object");
    }

    // Build concatenated string from HMAC fields
    const str = HMAC_FIELDS.map((field) => {
      if (field.includes(".")) {
        const [parent, child] = field.split(".");
        const parentObj = obj[parent!] as Record<string, unknown> | undefined;
        return String(parentObj?.[child!] ?? "");
      }
      return String(obj[field] ?? "");
    }).join("");

    const computed = await hmacSha512(this.config.hmacSecret, str);

    if (computed !== receivedHmac.toLowerCase()) {
      throw new WebhookVerificationError("paymob", "HMAC mismatch");
    }

    // Determine status
    let status: PaymentStatus = "pending";
    if (obj.success) status = "paid";
    else if (obj.is_voided) status = "voided";
    else if (obj.is_refunded) status = "refunded";
    else if (obj.error_occured) status = "failed";

    // Extract order ID from special_reference or order
    const orderId =
      (obj as Record<string, unknown>).special_reference as string ??
      String(obj.order);

    return {
      orderId,
      status,
      transactionId: String(obj.id),
      amount: obj.amount_cents / 100,
      currency: obj.currency,
      method: obj.source_data?.type,
      card: obj.source_data?.pan
        ? {
            brand: obj.source_data.sub_type,
            maskedCard: obj.source_data.pan,
          }
        : undefined,
      raw: payload,
    };
  }
}
