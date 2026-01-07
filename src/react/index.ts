'use client';

/**
 * React layer exports for @headlesskit/react-payments
 */

// Provider and Context
export { PaymentProvider } from './PaymentProvider';
export { PaymentContext } from './PaymentContext';

// Hooks
export { 
  usePayments,
  usePlans,
  useSubscription,
  useCheckout,
  useBilling
} from './hooks';

// Types
export type { PaymentContextValue } from './PaymentContext';
export type { PaymentProviderProps } from './PaymentProvider';

// Core exports (for advanced usage)
export { PaymentClient } from '../core/PaymentClient';
export type {
  Plan,
  Subscription,
  CheckoutRequest,
  CheckoutResponse,
  PaymentConfig,
  ApiResponse
} from '../core/types';
