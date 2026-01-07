/**
 * useBilling - Hook for billing portal access
 */

import { useState, useCallback } from 'react';
import { usePayments } from './usePayments';

export function useBilling() {
  const { openPortal } = usePayments();
  const [loading, setLoading] = useState(false);

  const openBillingPortal = useCallback(async () => {
    setLoading(true);
    try {
      await openPortal();
    } catch (error) {
      console.error('Failed to open billing portal:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [openPortal]);

  return {
    openBillingPortal,
    loading,
  };
}

export default useBilling;
