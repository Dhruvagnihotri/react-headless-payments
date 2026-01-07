/**
 * Core type definitions for @headlesskit/react-payments
 * Framework-agnostic types
 */

export interface Plan {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  stripe_price_id?: string;
  priceId?: string;
  features?: string[];
  limits?: Record<string, number | string>;
  metadata?: Record<string, any>;
  popular?: boolean;
}

export interface Subscription {
  id?: string;
  user_id?: string;
  plan: string;
  plan_name?: string;
  status?: 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid';
  plan_status?: 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid';
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  current_period_start?: string;
  current_period_end?: string;
  cancel_at_period_end?: boolean;
  trial_start?: string | null;
  trial_end?: string | null;
  is_subscribed?: boolean;
  is_on_trial?: boolean;
  days_until_renewal?: number | null;
}

export interface CheckoutRequest {
  plan: string;
  trial_days?: number;
  success_url?: string;
  cancel_url?: string;
  promo_code?: string;
  metadata?: Record<string, any>;
}

export interface CheckoutResponse {
  url: string;
  session_id?: string;
}

export interface ApiResponse<T = any> {
  success?: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PlansResponse {
  plans: Plan[];
}

export interface SubscriptionResponse {
  subscription: Subscription | null;
  has_subscription: boolean;
}

export interface PaymentConfig {
  apiBaseUrl: string;
  apiPrefix?: string;
  successUrl?: string;
  cancelUrl?: string;
  portalUrl?: string;
  currency?: string;
  locale?: string;
  customHeaders?: Record<string, string>;
  debug?: boolean;
}

export interface PaymentEndpoints {
  plans: string;
  subscription: string;
  checkout: string;
  portal: string;
  cancel: string;
  upgrade: string;
  webhook: string;
}
