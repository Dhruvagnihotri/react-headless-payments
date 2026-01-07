/**
 * React Context for Payments
 */

import { createContext } from 'react';
import type { Plan, Subscription } from '../core/types';

export interface PaymentContextValue {
  // State
  plans: Plan[];
  plansLoading: boolean;
  subscription: Subscription | null;
  subscriptionLoading: boolean;
  
  // Actions
  createCheckout: (plan: string, trialDays?: number) => Promise<void>;
  openPortal: () => Promise<void>;
  cancelSubscription: () => Promise<void>;
  upgradeSubscription: (newPlan: string) => Promise<void>;
  refreshSubscription: () => Promise<void>;
  refreshPlans: () => Promise<void>;
  
  // Utilities
  formatCurrency: (amount: number, currency?: string) => string;
  hasSubscription: boolean;
  isOnTrial: boolean;
  
  // Helper methods for feature gating
  hasFeature: (feature: string) => boolean;
  isWithinLimit: (limitKey: string, currentUsage: number) => boolean;
  canUpgrade: (targetPlan: string) => boolean;
}

export const PaymentContext = createContext<PaymentContextValue | undefined>(undefined);

export default PaymentContext;
