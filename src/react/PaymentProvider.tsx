/**
 * PaymentProvider - Main React component for payments
 * Extracted and refined from brakit-web and pdfwhiz_frontend
 */

import React, { useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { PaymentContext } from './PaymentContext';
import { PaymentClient } from '../core/PaymentClient';
import type { PaymentConfig, Plan, Subscription } from '../core/types';

export interface PaymentProviderProps {
  children: ReactNode;
  config?: Partial<PaymentConfig>;
  authTokenGetter?: () => string | null;
  autoFetchOnMount?: boolean;
  onCheckoutSuccess?: (checkoutUrl: string) => void;
  onCheckoutError?: (error: string) => void;
  onSubscriptionChange?: (subscription: Subscription | null) => void;
}

/**
 * Main PaymentProvider component
 */
export const PaymentProvider: React.FC<PaymentProviderProps> = ({
  children,
  config: userConfig,
  authTokenGetter,
  autoFetchOnMount = false,
  onCheckoutSuccess,
  onCheckoutError,
  onSubscriptionChange,
}) => {
  // Validate config
  if (!userConfig?.apiBaseUrl) {
    throw new Error('@headlesskit/react-payments: apiBaseUrl is required in config');
  }

  // Initialize client
  const client = useMemo(() => {
    const paymentClient = new PaymentClient(userConfig as PaymentConfig);
    
    if (authTokenGetter) {
      paymentClient.setAuthTokenGetter(authTokenGetter);
    }
    
    return paymentClient;
  }, [userConfig, authTokenGetter]);

  // State
  const [plans, setPlans] = useState<Plan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);

  /**
   * Fetch plans
   */
  const refreshPlans = useCallback(async () => {
    try {
      setPlansLoading(true);
      const fetchedPlans = await client.getPlans();
      setPlans(fetchedPlans);
    } catch (error) {
      console.error('[PaymentProvider] Failed to fetch plans:', error);
      setPlans([]);
    } finally {
      setPlansLoading(false);
    }
  }, [client]);

  /**
   * Fetch subscription
   */
  const refreshSubscription = useCallback(async () => {
    // Check if user has auth token before fetching subscription
    if (authTokenGetter) {
      const token = authTokenGetter();
      if (!token) {
        // User not authenticated, skip subscription fetch
        setSubscriptionLoading(false);
        setSubscription(null);
        return;
      }
    }

    try {
      setSubscriptionLoading(true);
      const sub = await client.getSubscription();
      setSubscription(sub);
      onSubscriptionChange?.(sub);
    } catch (error) {
      // Handle 401 gracefully - user not authenticated or token expired
      if (error instanceof Error && error.message.includes('401')) {
        console.log('[PaymentProvider] User not authenticated, skipping subscription fetch');
        setSubscription(null);
      } else {
        console.error('[PaymentProvider] Failed to fetch subscription:', error);
        setSubscription(null);
      }
    } finally {
      setSubscriptionLoading(false);
    }
  }, [client, onSubscriptionChange, authTokenGetter]);

  /**
   * Initial data fetch (if autoFetchOnMount is true)
   */
  useEffect(() => {
    if (autoFetchOnMount) {
      // Always fetch plans (public data)
      refreshPlans();
      
      // Only fetch subscription if auth token exists
      if (authTokenGetter) {
        const token = authTokenGetter();
        if (token) {
          refreshSubscription();
        } else {
          // No token, mark as not loading
          setSubscriptionLoading(false);
        }
      } else {
        // No auth token getter, mark as not loading
        setSubscriptionLoading(false);
      }
    } else {
      // Auto-fetch disabled, mark as not loading
      setPlansLoading(false);
      setSubscriptionLoading(false);
    }
  }, [autoFetchOnMount, refreshPlans, refreshSubscription, authTokenGetter]);

  /**
   * Create checkout session
   */
  const createCheckout = useCallback(
    async (plan: string, trialDays?: number) => {
      try {
        const response = await client.createCheckoutSession({
          plan,
          trial_days: trialDays,
          success_url: userConfig?.successUrl,
          cancel_url: userConfig?.cancelUrl,
        });

        if (response.url) {
          onCheckoutSuccess?.(response.url);
          
          // Redirect to Stripe Checkout
          if (typeof window !== 'undefined') {
            window.location.href = response.url;
          }
        }
      } catch (error: any) {
        console.error('[PaymentProvider] Checkout failed:', error);
        onCheckoutError?.(error.message);
        throw error;
      }
    },
    [client, onCheckoutSuccess, onCheckoutError, userConfig]
  );

  /**
   * Open customer portal
   */
  const openPortal = useCallback(async () => {
    try {
      const response = await client.createPortalSession();
      
      if (response.url && typeof window !== 'undefined') {
        window.location.href = response.url;
      }
    } catch (error) {
      console.error('[PaymentProvider] Failed to open portal:', error);
      throw error;
    }
  }, [client]);

  /**
   * Cancel subscription
   */
  const cancelSubscription = useCallback(async () => {
    try {
      await client.cancelSubscription();
      await refreshSubscription();
    } catch (error) {
      console.error('[PaymentProvider] Failed to cancel subscription:', error);
      throw error;
    }
  }, [client, refreshSubscription]);

  /**
   * Upgrade subscription
   */
  const upgradeSubscription = useCallback(
    async (newPlan: string) => {
      try {
        await client.upgradeSubscription(newPlan);
        await refreshSubscription();
      } catch (error) {
        console.error('[PaymentProvider] Failed to upgrade subscription:', error);
        throw error;
      }
    },
    [client, refreshSubscription]
  );

  /**
   * Format currency
   */
  const formatCurrency = useCallback(
    (amount: number, currency?: string) => {
      return client.formatCurrency(amount, currency);
    },
    [client]
  );

  // Computed values
  const hasSubscription = !!(subscription && subscription.is_subscribed);
  const isOnTrial = subscription?.is_on_trial ?? false;

  /**
   * Check if current plan has a specific feature
   */
  const hasFeature = useCallback((feature: string): boolean => {
    if (!subscription || !subscription.plan) return false;
    
    const currentPlan = plans.find(p => p.id === subscription.plan);
    if (!currentPlan || !currentPlan.features) return false;
    
    return currentPlan.features.includes(feature);
  }, [subscription, plans]);

  /**
   * Check if user is within a usage limit
   */
  const isWithinLimit = useCallback((limitKey: string, currentUsage: number): boolean => {
    if (!subscription || !subscription.plan) return false;
    
    const currentPlan = plans.find(p => p.id === subscription.plan);
    if (!currentPlan || !currentPlan.limits) return false;
    
    const limit = currentPlan.limits[limitKey];
    if (limit === undefined || limit === 'unlimited') return true;
    
    return currentUsage < (limit as number);
  }, [subscription, plans]);

  /**
   * Check if user can upgrade to a specific plan
   */
  const canUpgrade = useCallback((targetPlan: string): boolean => {
    if (!subscription) return true;
    
    const currentPlan = plans.find(p => p.id === subscription.plan);
    const target = plans.find(p => p.id === targetPlan);
    
    if (!currentPlan || !target) return false;
    
    return target.price > currentPlan.price;
  }, [subscription, plans]);

  const contextValue = {
    plans,
    plansLoading,
    subscription,
    subscriptionLoading,
    createCheckout,
    openPortal,
    cancelSubscription,
    upgradeSubscription,
    refreshSubscription,
    refreshPlans,
    formatCurrency,
    hasSubscription,
    isOnTrial,
    hasFeature,
    isWithinLimit,
    canUpgrade,
  };

  return (
    <PaymentContext.Provider value={contextValue}>
      {children}
    </PaymentContext.Provider>
  );
};

export default PaymentProvider;
