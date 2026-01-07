# @headlesskit/react-payments

[![npm version](https://badge.fury.io/js/%40headlesskit%2Freact-payments.svg)](https://www.npmjs.com/package/@headlesskit/react-payments)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **Production-ready, headless payment integration for React.** Stripe subscriptions made simple. Pairs perfectly with [flask-headless-payments](https://pypi.org/project/flask-headless-payments/) backend.

## ✨ Features

- 💳 **Stripe Integration** - Checkout, subscriptions, billing portal
- 📊 **Plan Management** - List plans, show pricing, feature comparison
- 🔄 **Subscription Lifecycle** - Subscribe, upgrade, downgrade, cancel
- 🎨 **Headless** - Bring your own UI components
- 🎣 **Composable Hooks** - `useCheckout`, `usePlans`, `useSubscription`, `useBilling`
- 📦 **Tree-Shakeable** - Only import what you need
- 🔒 **TypeScript** - Full type safety
- ⚡ **Zero Dependencies** - Except React peer deps

## 📦 Installation

```bash
npm install @headlesskit/react-payments
# or
yarn add @headlesskit/react-payments
# or
pnpm add @headlesskit/react-payments
```

## 🚀 Quick Start

### 1. Wrap your app with PaymentProvider

```tsx
// app/layout.tsx (Next.js)
import { AuthProvider } from '@headlesskit/react-auth';
import { PaymentProvider } from '@headlesskit/react-payments';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AuthProvider config={{ apiBaseUrl: process.env.NEXT_PUBLIC_API_URL! }}>
          <PaymentProvider
            config={{
              apiBaseUrl: process.env.NEXT_PUBLIC_API_URL!,
              apiPrefix: '/api/payments', // optional, this is default
            }}
            authTokenGetter={() => localStorage.getItem('auth_access_token')}
          >
            {children}
          </PaymentProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
```

### 2. Display pricing plans

```tsx
import { usePlans } from '@headlesskit/react-payments';

export function PricingTable() {
  const { plans, loading, formatCurrency } = usePlans();

  if (loading) return <div>Loading plans...</div>;

  return (
    <div className="pricing-grid">
      {plans.map((plan) => (
        <div key={plan.id} className="pricing-card">
          <h3>{plan.name}</h3>
          <p className="price">
            {formatCurrency(plan.price)}/{plan.interval}
          </p>
          <p>{plan.description}</p>
          <CheckoutButton plan={plan.id} />
        </div>
      ))}
    </div>
  );
}
```

### 3. Implement checkout

```tsx
import { useCheckout } from '@headlesskit/react-payments';

export function CheckoutButton({ plan }: { plan: string }) {
  const { createCheckout, loading } = useCheckout({
    onSuccess: () => console.log('Redirecting to checkout...'),
    onError: (error) => alert(error),
  });

  return (
    <button
      onClick={() => createCheckout(plan)}
      disabled={loading}
    >
      {loading ? 'Loading...' : 'Subscribe'}
    </button>
  );
}
```

### 4. Show subscription status

```tsx
import { useSubscription } from '@headlesskit/react-payments';

export function SubscriptionStatus() {
  const { subscription, hasSubscription, isOnTrial } = useSubscription();

  if (!hasSubscription) {
    return <div>No active subscription</div>;
  }

  return (
    <div>
      <h3>Current Plan: {subscription.plan_name}</h3>
      <p>Status: {subscription.status}</p>
      {isOnTrial && <p>Trial ends: {subscription.trial_end}</p>}
    </div>
  );
}
```

### 5. Add billing portal link

```tsx
import { useBilling } from '@headlesskit/react-payments';

export function ManageSubscriptionButton() {
  const { openBillingPortal, loading } = useBilling();

  return (
    <button onClick={openBillingPortal} disabled={loading}>
      Manage Subscription
    </button>
  );
}
```

## 📚 Core Concepts

### PaymentProvider

The main component that provides payment context to your app.

```tsx
<PaymentProvider
  config={{
    apiBaseUrl: 'https://api.myapp.com',
    apiPrefix: '/api/payments', // default
    successUrl: '/payment/success', // default
    cancelUrl: '/payment/cancel', // default
    portalUrl: '/dashboard/billing', // default
    currency: 'usd', // default
    locale: 'en-US', // default
  }}
  
  // Auth integration
  authTokenGetter={() => getAccessToken()}
  
  // Lifecycle callbacks
  onCheckoutSuccess={(url) => console.log('Checkout created:', url)}
  onCheckoutError={(error) => toast.error(error)}
  onSubscriptionChange={(subscription) => {
    // React to subscription changes
    analytics.track('subscription_changed', { plan: subscription?.plan });
  }}
>
  {children}
</PaymentProvider>
```

### Hooks

#### usePayments

Main hook for all payment functionality.

```tsx
const {
  // State
  plans,
  plansLoading,
  subscription,
  subscriptionLoading,
  hasSubscription,
  isOnTrial,
  
  // Actions
  createCheckout,
  openPortal,
  cancelSubscription,
  upgradeSubscription,
  refreshSubscription,
  refreshPlans,
  
  // Utilities
  formatCurrency,
} = usePayments();
```

#### usePlans

Focused hook for pricing plans.

```tsx
const { plans, loading, refreshPlans, formatCurrency } = usePlans();
```

#### useSubscription

Focused hook for subscription management.

```tsx
const {
  subscription,
  loading,
  hasSubscription,
  isOnTrial,
  refresh,
  cancel,
  upgrade,
} = useSubscription();
```

#### useCheckout

Hook for checkout operations with loading and error states.

```tsx
const { createCheckout, loading, error } = useCheckout({
  onSuccess: (url) => console.log('Success'),
  onError: (error) => console.error('Error'),
});

// Use it
await createCheckout('pro_plan', 14); // 14-day trial
```

#### useBilling

Hook for billing portal access.

```tsx
const { openBillingPortal, loading } = useBilling();
```

## 🎯 Usage Examples

### Pricing Table with Features

```tsx
import { usePlans, useCheckout } from '@headlesskit/react-payments';

export function PricingTable() {
  const { plans, formatCurrency } = usePlans();
  const { createCheckout, loading } = useCheckout();

  return (
    <div className="grid grid-cols-3 gap-4">
      {plans.map((plan) => (
        <div key={plan.id} className="border rounded-lg p-6">
          <h3 className="text-2xl font-bold">{plan.name}</h3>
          <p className="text-4xl font-bold my-4">
            {formatCurrency(plan.price)}
            <span className="text-sm text-gray-500">/{plan.interval}</span>
          </p>
          
          {plan.features && (
            <ul className="space-y-2 mb-6">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-center">
                  <CheckIcon className="w-5 h-5 text-green-500 mr-2" />
                  {feature}
                </li>
              ))}
            </ul>
          )}
          
          <button
            onClick={() => createCheckout(plan.id)}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded"
          >
            {loading ? 'Processing...' : 'Subscribe'}
          </button>
        </div>
      ))}
    </div>
  );
}
```

### Subscription Management Page

```tsx
import { useSubscription, useBilling } from '@headlesskit/react-payments';

export function SubscriptionManagementPage() {
  const { subscription, hasSubscription, cancel } = useSubscription();
  const { openBillingPortal } = useBilling();

  if (!hasSubscription) {
    return (
      <div>
        <h2>No Active Subscription</h2>
        <Link href="/pricing">View Plans</Link>
      </div>
    );
  }

  return (
    <div>
      <h2>Your Subscription</h2>
      
      <div className="subscription-details">
        <p><strong>Plan:</strong> {subscription.plan_name}</p>
        <p><strong>Status:</strong> {subscription.status}</p>
        <p><strong>Renews:</strong> {new Date(subscription.current_period_end).toLocaleDateString()}</p>
        
        {subscription.is_on_trial && (
          <p className="text-blue-600">
            Trial ends: {new Date(subscription.trial_end!).toLocaleDateString()}
          </p>
        )}
      </div>

      <div className="actions">
        <button onClick={openBillingPortal}>
          Update Payment Method
        </button>
        
        <button onClick={cancel} className="text-red-600">
          Cancel Subscription
        </button>
      </div>
    </div>
  );
}
```

### Plan Upgrade Flow

```tsx
import { useSubscription, usePayments } from '@headlesskit/react-payments';

export function UpgradePlanModal() {
  const { subscription } = useSubscription();
  const { plans, upgradeSubscription } = usePayments();

  const handleUpgrade = async (newPlan: string) => {
    try {
      await upgradeSubscription(newPlan);
      alert('Plan upgraded successfully!');
    } catch (error) {
      alert('Upgrade failed');
    }
  };

  const availableUpgrades = plans.filter(
    (plan) => plan.id !== subscription?.plan
  );

  return (
    <div>
      <h3>Upgrade Your Plan</h3>
      {availableUpgrades.map((plan) => (
        <div key={plan.id}>
          <h4>{plan.name}</h4>
          <button onClick={() => handleUpgrade(plan.id)}>
            Upgrade to {plan.name}
          </button>
        </div>
      ))}
    </div>
  );
}
```

### Gated Feature Component

```tsx
import { useSubscription } from '@headlesskit/react-payments';
import Link from 'next/link';

export function PremiumFeature({ children }: { children: React.ReactNode }) {
  const { hasSubscription, subscription } = useSubscription();
  
  const isPro = subscription?.plan === 'pro' || subscription?.plan === 'enterprise';

  if (!hasSubscription || !isPro) {
    return (
      <div className="blur-sm relative">
        {children}
        <div className="absolute inset-0 flex items-center justify-center bg-white/80">
          <div className="text-center">
            <h3>Premium Feature</h3>
            <p>Upgrade to Pro to unlock this feature</p>
            <Link href="/pricing">
              <button className="bg-blue-600 text-white px-6 py-2 rounded">
                View Plans
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
```

## 🔌 Backend Integration

Works seamlessly with [flask-headless-payments](https://pypi.org/project/flask-headless-payments/):

```python
# Backend setup (Flask)
from flask_headless_payments import PaymentSvc

payments = PaymentSvc(
    app,
    user_model=User,
    plans={
        'free': {
            'name': 'Free',
            'price_id': None,
        },
        'pro': {
            'name': 'Pro',
            'price_id': 'price_xxx',
        },
    },
    url_prefix='/api/payments'  # Match your frontend config
)
```

```typescript
// Frontend setup
<PaymentProvider
  config={{
    apiBaseUrl: process.env.NEXT_PUBLIC_API_URL,
    apiPrefix: '/api/payments', // Must match backend
  }}
/>
```

## 📖 API Reference

### PaymentProvider Props

```typescript
interface PaymentProviderProps {
  children: ReactNode;
  config: {
    apiBaseUrl: string;                   // Required
    apiPrefix?: string;                   // Default: '/api/payments'
    successUrl?: string;                  // Default: '/payment/success'
    cancelUrl?: string;                   // Default: '/payment/cancel'
    portalUrl?: string;                   // Default: '/dashboard/billing'
    currency?: string;                    // Default: 'usd'
    locale?: string;                      // Default: 'en-US'
    debug?: boolean;
  };
  authTokenGetter?: () => string | null;  // Required for authenticated requests
  onCheckoutSuccess?: (url: string) => void;
  onCheckoutError?: (error: string) => void;
  onSubscriptionChange?: (subscription: Subscription | null) => void;
}
```

### Plan Type

```typescript
interface Plan {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  stripe_price_id: string;
  features?: string[];
  limits?: Record<string, number>;
}
```

### Subscription Type

```typescript
interface Subscription {
  id: string;
  plan: string;
  plan_name?: string;
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid';
  stripe_subscription_id: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  is_subscribed: boolean;
  is_on_trial: boolean;
  days_until_renewal?: number;
}
```

## 🤝 Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](./CONTRIBUTING.md).

## 📄 License

MIT © HeadlessKit Contributors

## 🔗 Related Packages

- [flask-headless-payments](https://pypi.org/project/flask-headless-payments/) - Backend companion
- [@headlesskit/react-auth](https://www.npmjs.com/package/@headlesskit/react-auth) - Authentication integration

## 💬 Support

- 📖 [Documentation](https://headlesskit.dev/docs/react-payments)
- 💬 [Discord Community](https://discord.gg/headlesskit)
- 🐛 [Issue Tracker](https://github.com/headlesskit/react-payments/issues)

---

**Built with ❤️ by the HeadlessKit team**
