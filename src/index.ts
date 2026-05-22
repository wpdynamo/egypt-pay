/**
 * egypt-pay — Unified payment gateway library for Egyptian providers.
 *
 * Supports: Kashier, Paymob
 * Runtime: Node 18+, Cloudflare Workers, Deno, Bun
 * Dependencies: None (uses Web Crypto API)
 */

import { KashierGateway } from "./kashier/adapter.js";
import { PaymobGateway } from "./paymob/adapter.js";
import type { KashierConfig } from "./kashier/types.js";
import type { PaymobConfig } from "./paymob/types.js";
import type { PaymentGateway, GatewayProvider } from "./types.js";

/** Configuration map for each provider */
export interface GatewayConfigMap {
  kashier: KashierConfig;
  paymob: PaymobConfig;
}

/**
 * Create a payment gateway instance.
 *
 * @example
 * ```ts
 * import { createGateway } from "egypt-pay";
 *
 * const kashier = createGateway("kashier", {
 *   merchantId: "MID-123-456",
 *   apiKey: "your-api-key",
 *   secretKey: "your-secret-key",
 *   mode: "test",
 * });
 *
 * const session = await kashier.createSession({
 *   orderId: "ORD-001",
 *   amount: 150.00,
 *   customer: { name: "Ahmed", email: "ahmed@example.com" },
 *   redirectUrl: "https://yoursite.com/callback",
 * });
 *
 * // Redirect customer to session.paymentUrl
 * ```
 */
export function createGateway<T extends GatewayProvider>(
  provider: T,
  config: GatewayConfigMap[T]
): PaymentGateway {
  switch (provider) {
    case "kashier":
      return new KashierGateway(config as KashierConfig);
    case "paymob":
      return new PaymobGateway(config as PaymobConfig);
    default:
      throw new Error(`Unsupported gateway provider: ${provider}`);
  }
}

// Re-export everything
export type {
  PaymentGateway,
  GatewayProvider,
  CreateSessionParams,
  PaymentSession,
  WebhookEvent,
  PaymentStatus,
  Customer,
  LineItem,
} from "./types.js";

export { KashierGateway } from "./kashier/index.js";
export type { KashierConfig } from "./kashier/index.js";

export { PaymobGateway } from "./paymob/index.js";
export type { PaymobConfig } from "./paymob/index.js";

export { PaymentError, WebhookVerificationError } from "./utils/index.js";
