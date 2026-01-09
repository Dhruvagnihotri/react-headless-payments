/**
 * Error Classes for Better Error Handling
 * Provides typed errors with error codes for precise error handling
 */

export class PaymentError extends Error {
  constructor(
    public code: PaymentErrorCode,
    message: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'PaymentError';
    Object.setPrototypeOf(this, PaymentError.prototype);
  }
}

export type PaymentErrorCode =
  | 'NETWORK_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'PAYMENT_FAILED'
  | 'SUBSCRIPTION_ERROR'
  | 'CHECKOUT_ERROR'
  | 'RATE_LIMIT'
  | 'SERVER_ERROR'
  | 'TIMEOUT'
  | 'INVALID_CONFIG'
  | 'UNKNOWN';

/**
 * Convert HTTP status to error code
 */
export function getErrorCodeFromStatus(status: number): PaymentErrorCode {
  if (status === 401) return 'UNAUTHORIZED';
  if (status === 403) return 'FORBIDDEN';
  if (status === 404) return 'NOT_FOUND';
  if (status === 422 || status === 400) return 'VALIDATION_ERROR';
  if (status === 429) return 'RATE_LIMIT';
  if (status >= 500) return 'SERVER_ERROR';
  return 'UNKNOWN';
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: PaymentError): boolean {
  return [
    'NETWORK_ERROR',
    'TIMEOUT',
    'SERVER_ERROR',
    'RATE_LIMIT',
  ].includes(error.code);
}

/**
 * Check if error requires auth refresh
 */
export function requiresAuthRefresh(error: PaymentError): boolean {
  return error.code === 'UNAUTHORIZED';
}
