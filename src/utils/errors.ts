/**
 * Custom error classes for egypt-pay.
 */

export class PaymentError extends Error {
  public readonly provider: string;
  public readonly statusCode?: number;
  public readonly responseBody?: string;

  constructor(
    provider: string,
    message: string,
    statusCode?: number,
    responseBody?: string
  ) {
    super(`[${provider}] ${message}`);
    this.name = "PaymentError";
    this.provider = provider;
    this.statusCode = statusCode;
    this.responseBody = responseBody;
  }
}

export class WebhookVerificationError extends Error {
  public readonly provider: string;

  constructor(provider: string, message: string) {
    super(`[${provider}] Webhook verification failed: ${message}`);
    this.name = "WebhookVerificationError";
    this.provider = provider;
  }
}
