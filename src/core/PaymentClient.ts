/**
 * PaymentClient - Core payment API client
 * Framework-agnostic, extracted from brakit-web and pdfwhiz_frontend
 */

import type {
  PaymentConfig,
  PaymentEndpoints,
  Plan,
  PlansResponse,
  Subscription,
  SubscriptionResponse,
  CheckoutRequest,
  CheckoutResponse,
  ApiResponse,
} from './types';
import { PaymentError, getErrorCodeFromStatus } from './errors';

/**
 * Default API endpoints
 */
const DEFAULT_ENDPOINTS: PaymentEndpoints = {
  plans: '/plans',
  subscription: '/subscription',
  checkout: '/checkout',
  portal: '/portal',
  cancel: '/cancel',
  upgrade: '/upgrade',
  webhook: '/webhook',
};

/**
 * Main payment client
 */
export class PaymentClient {
  private config: Required<PaymentConfig>;
  private endpoints: PaymentEndpoints;
  private authTokenGetter: (() => string | null) | null = null;

  constructor(config: PaymentConfig) {
    // Apply defaults
    this.config = {
      apiBaseUrl: config.apiBaseUrl,
      apiPrefix: config.apiPrefix ?? '/api/payments',
      successUrl: config.successUrl ?? '/payment/success',
      cancelUrl: config.cancelUrl ?? '/payment/cancel',
      portalUrl: config.portalUrl ?? '/dashboard/billing',
      currency: config.currency ?? 'usd',
      locale: config.locale ?? 'en-US',
      customHeaders: config.customHeaders ?? {},
      debug: config.debug ?? false,
    };

    this.endpoints = DEFAULT_ENDPOINTS;

    if (this.config.debug) {
      console.log('[PaymentClient] Initialized with config:', this.config);
    }
  }

  /**
   * Set auth token getter function
   */
  setAuthTokenGetter(getter: () => string | null): void {
    this.authTokenGetter = getter;
  }

  /**
   * Get auth token
   */
  private getAuthToken(): string | null {
    if (this.authTokenGetter) {
      return this.authTokenGetter();
    }

    // Fallback: try localStorage
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_access_token');
    }

    return null;
  }

  /**
   * Build full API URL
   */
  private getUrl(endpoint: string): string {
    return `${this.config.apiBaseUrl}${this.config.apiPrefix}${endpoint}`;
  }

  /**
   * Create request headers
   */
  private createHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...this.config.customHeaders,
    };

    const token = this.getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  /**
   * Make authenticated request with timeout support
   * 
   * NOTE: 401 handling is NOT done here because:
   * - PaymentClient is isolated from AuthProvider (correct architecture)
   * - AuthProvider already handles 401 via checkAuth() on navigation
   * - App-level retry can be implemented via error hooks if needed
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = this.getUrl(endpoint);
    const headers = this.createHeaders();

    if (this.config.debug) {
      console.log('[PaymentClient] Request:', url, options);
    }

    // Add timeout support (30 seconds)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
        credentials: 'include',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorCode = getErrorCodeFromStatus(response.status);
        const error = new PaymentError(
          errorCode,
          errorData.error || errorData.message || `Request failed: ${response.status}`,
          response.status,
          errorData
        );

        throw error;
      }

      return response.json();
    } catch (error: any) {
      clearTimeout(timeoutId);

      // Handle timeout
      if (error.name === 'AbortError') {
        throw new PaymentError('TIMEOUT', 'Request timeout after 30 seconds');
      }

      // Handle network errors
      if (error instanceof PaymentError) {
        throw error;
      }

      throw new PaymentError('NETWORK_ERROR', error.message || 'Network request failed');
    }
  }

  /**
   * Get all available plans
   */
  async getPlans(): Promise<Plan[]> {
    const response = await this.request<PlansResponse>(this.endpoints.plans);
    return response.plans || [];
  }

  /**
   * Get current user's subscription
   */
  async getSubscription(): Promise<Subscription | null> {
    const response = await this.request<SubscriptionResponse>(this.endpoints.subscription);
    return response.subscription;
  }

  /**
   * Resolve URL to absolute format
   * Handles both relative paths and absolute URLs
   */
  private resolveUrl(url?: string): string | undefined {
    if (!url) return undefined;
    
    // If already absolute URL, return as-is
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    // If relative path, convert to absolute using window.location.origin
    // Ensure path starts with /
    const path = url.startsWith('/') ? url : `/${url}`;
    return `${window.location.origin}${path}`;
  }

  /**
   * Create checkout session
   */
  async createCheckoutSession(data: CheckoutRequest): Promise<CheckoutResponse> {
    // Resolve URLs: prioritize data URLs, fallback to config, then resolve to absolute
    const successUrl = this.resolveUrl(data.success_url || this.config.successUrl);
    const cancelUrl = this.resolveUrl(data.cancel_url || this.config.cancelUrl);

    if (!successUrl || !cancelUrl) {
      throw new PaymentError(
        'INVALID_CONFIG',
        'success_url and cancel_url are required for checkout'
      );
    }

    const requestData = {
      ...data,
      success_url: successUrl,
      cancel_url: cancelUrl,
    };

    if (this.config.debug) {
      console.log('[PaymentClient] Checkout URLs:', {
        success_url: successUrl,
        cancel_url: cancelUrl,
      });
    }

    return this.request<CheckoutResponse>(this.endpoints.checkout, {
      method: 'POST',
      body: JSON.stringify(requestData),
    });
  }

  /**
   * Create portal session (for managing subscription)
   */
  async createPortalSession(): Promise<{ url: string }> {
    return this.request<{ url: string }>(this.endpoints.portal, {
      method: 'POST',
      body: JSON.stringify({
        return_url: `${window.location.origin}${this.config.portalUrl}`,
      }),
    });
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(): Promise<ApiResponse> {
    return this.request<ApiResponse>(this.endpoints.cancel, {
      method: 'POST',
    });
  }

  /**
   * Upgrade/change subscription
   */
  async upgradeSubscription(newPlan: string): Promise<ApiResponse> {
    return this.request<ApiResponse>(this.endpoints.upgrade, {
      method: 'POST',
      body: JSON.stringify({ plan: newPlan }),
    });
  }

  /**
   * Format currency
   */
  formatCurrency(amount: number, currency?: string): string {
    return new Intl.NumberFormat(this.config.locale, {
      style: 'currency',
      currency: (currency || this.config.currency).toUpperCase(),
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  /**
   * Get configuration
   */
  getConfig(): Required<PaymentConfig> {
    return { ...this.config };
  }
}

export default PaymentClient;
