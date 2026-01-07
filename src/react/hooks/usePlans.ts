/**
 * usePlans - Hook for accessing pricing plans
 */

import { usePayments } from './usePayments';

export function usePlans() {
  const { plans, plansLoading, refreshPlans, formatCurrency } = usePayments();
  
  return {
    plans,
    loading: plansLoading,
    refreshPlans,
    formatCurrency,
  };
}

export default usePlans;
