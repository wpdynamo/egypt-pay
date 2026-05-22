/** Paymob-specific configuration */
export interface PaymobConfig {
  /** Secret key (starts with egy_sk_) */
  secretKey: string;
  /** Public key (starts with egy_pk_) */
  publicKey: string;
  /** Integration ID (numeric string) */
  integrationId: string;
  /** HMAC secret for webhook verification */
  hmacSecret: string;
  /** Base URL (default: https://accept.paymob.com) */
  baseUrl?: string;
}

/** Raw Paymob intention response */
export interface PaymobRawIntention {
  id: string;
  client_secret: string;
  [key: string]: unknown;
}

/** Paymob webhook transaction object */
export interface PaymobWebhookTransaction {
  id: number;
  order: number;
  amount_cents: number;
  currency: string;
  success: boolean;
  is_voided: boolean;
  is_refunded: boolean;
  is_3d_secure: boolean;
  is_auth: boolean;
  is_capture: boolean;
  is_standalone_payment: boolean;
  has_parent_transaction: boolean;
  error_occured: boolean;
  pending: boolean;
  integration_id: number;
  owner: number;
  created_at: string;
  source_data: {
    type: string;
    sub_type: string;
    pan: string;
  };
  [key: string]: unknown;
}

/** Paymob webhook payload */
export interface PaymobWebhookPayload {
  type: string;
  obj: PaymobWebhookTransaction;
  [key: string]: unknown;
}
