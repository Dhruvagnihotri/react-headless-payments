/**
 * @headlesskit/react-payments
 * Production-ready, headless payment integration for React
 * 
 * @packageDocumentation
 */

// Main React exports
export { PaymentProvider } from './react/PaymentProvider';
export type { PaymentProviderProps } from './react/PaymentProvider';
export {
  usePayments,
  usePlans,
  useSubscription,
  useCheckout,
  useBilling,
} from './react/hooks';
export type { PaymentContextValue } from './react/PaymentContext';
export type { UseCheckoutOptions } from './react/hooks';

// Core exports (for advanced users)
export { PaymentClient } from './core/PaymentClient';

// Types
export type {
  Plan,
  Subscription,
  CheckoutRequest,
  CheckoutResponse,
  ApiResponse,
  PlansResponse,
  SubscriptionResponse,
  PaymentConfig,
  PaymentEndpoints,
} from './core/types';
