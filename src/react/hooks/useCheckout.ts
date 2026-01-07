/**
 * useCheckout - Hook for checkout operations
 */

import { useState, useCallback } from 'react';
import { usePayments } from './usePayments';

export interface UseCheckoutOptions {
  onSuccess?: (checkoutUrl: string) => void;
  onError?: (error: string) => void;
}

export function useCheckout(options: UseCheckoutOptions = {}) {
  const { createCheckout: createCheckoutAction } = usePayments();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createCheckout = useCallback(
    async (plan: string, trialDays?: number) => {
      setLoading(true);
      setError(null);

      try {
        await createCheckoutAction(plan, trialDays);
        options.onSuccess?.(plan);
      } catch (err: any) {
        const errorMessage = err.message || 'Checkout failed';
        setError(errorMessage);
        options.onError?.(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [createCheckoutAction, options]
  );

  return {
    createCheckout,
    loading,
    error,
  };
}

export default useCheckout;
