/**
 * usePayments - Main hook for accessing payment functionality
 */

import { useContext } from 'react';
import { PaymentContext } from '../PaymentContext';

export function usePayments() {
  const context = useContext(PaymentContext);
  
  if (context === undefined) {
    throw new Error('usePayments must be used within a PaymentProvider');
  }
  
  return context;
}

export default usePayments;
