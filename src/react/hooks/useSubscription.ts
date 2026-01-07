/**
 * useSubscription - Hook for subscription management
 */

import { useMemo } from 'react';
import { usePayments } from './usePayments';

export function useSubscription() {
  const {
    subscription,
    subscriptionLoading,
    hasSubscription,
    isOnTrial,
    refreshSubscription,
    cancelSubscription,
    upgradeSubscription,
    openPortal,
    plans,
  } = usePayments();
  
  // Computed properties for backward compatibility
  const computed = useMemo(() => {
    const currentPlan = subscription?.plan_name || subscription?.plan || 'free';
    const status = subscription?.status || subscription?.plan_status;
    
    // Status label
    const statusLabel = 
      status === 'active' ? 'Active' :
      status === 'trialing' ? 'Trial' :
      status === 'past_due' ? 'Past Due' :
      status === 'canceled' ? 'Canceled' :
      'Active';
    
    // Status color classes
    const statusColor = 
      status === 'active' ? 'bg-green-100 text-green-700' :
      status === 'trialing' ? 'bg-blue-100 text-blue-700' :
      status === 'past_due' ? 'bg-yellow-100 text-yellow-700' :
      status === 'canceled' ? 'bg-gray-100 text-gray-700' :
      'bg-green-100 text-green-700';
    
    // Format period end date
    const periodEndFormatted = subscription?.current_period_end
      ? new Date(subscription.current_period_end).toLocaleDateString()
      : 'N/A';
    
    // Days until renewal
    const daysUntilRenewal = subscription?.days_until_renewal || 0;
    
    // Will cancel at period end
    const willCancel = subscription?.cancel_at_period_end || false;
    
    return {
      isPro: currentPlan === 'pro',
      isFree: currentPlan === 'free' || !subscription,
      currentPlan,
      status,
      statusLabel,
      statusColor,
      periodEndFormatted,
      daysUntilRenewal,
      willCancel,
    };
  }, [subscription]);
  
  return {
    subscription,
    loading: subscriptionLoading,
    hasSubscription,
    isSubscribed: hasSubscription, // Alias for compatibility
    isOnTrial,
    ...computed, // Spread all computed properties
    refresh: refreshSubscription,
    cancel: cancelSubscription,
    upgrade: upgradeSubscription,
    openCustomerPortal: openPortal,
  };
}

export default useSubscription;
