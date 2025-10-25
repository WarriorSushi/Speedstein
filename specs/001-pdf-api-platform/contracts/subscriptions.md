# API Contract: Subscription Management

**Base Path**: `/api/subscriptions`
**Authentication**: Supabase JWT for user operations, webhook secret for webhooks
**Purpose**: Manage subscription lifecycle and billing

## Get Current Subscription

### Request
```
GET /api/subscriptions
Authorization: Bearer <supabase_jwt>
```

### Success Response (200 OK)
```json
{
  "success": true,
  "subscription": {
    "plan": "starter",
    "status": "active",
    "quota": 5000,
    "price": 29,
    "currency": "USD",
    "billingPeriod": "month",
    "currentPeriodStart": "2025-10-01T00:00:00.000Z",
    "currentPeriodEnd": "2025-11-01T00:00:00.000Z",
    "cancelAtPeriodEnd": false,
    "dodoCustomerId": "cus_abc123",
    "dodoSubscriptionId": "sub_def456"
  }
}
```

## Create Checkout Session

### Request
```
POST /api/subscriptions/checkout
Authorization: Bearer <supabase_jwt>
Content-Type: application/json

{
  "planTier": "starter",  // or "pro", "enterprise"
  "billingInterval": "month"  // or "year" (optional, default: month)
}
```

### Success Response (200 OK)
```json
{
  "success": true,
  "checkoutUrl": "https://checkout.dodopayments.com/session_abc123",
  "sessionId": "session_abc123"
}
```

### Implementation Flow
1. Validate user is authenticated
2. Create DodoPayments checkout session with:
   - `priceId`: Corresponding to plan tier (starter: $29/mo, pro: $99/mo)
   - `successUrl`: `https://speedstein.com/dashboard?session_id={CHECKOUT_SESSION_ID}`
   - `cancelUrl`: `https://speedstein.com/pricing`
   - `customerId`: If existing Dodo customer, otherwise create new
3. Return checkout URL for redirect

## Upgrade Subscription

### Request
```
POST /api/subscriptions/upgrade
Authorization: Bearer <supabase_jwt>
Content-Type: application/json

{
  "newPlan": "pro"
}
```

### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Subscription upgraded to Pro plan",
  "proratedAmount": 7000,  // Prorated charge in cents
  "newQuota": 50000,
  "effectiveImmediately": true
}
```

### Implementation Flow
1. Calculate prorated charge for remaining billing period
2. Update DodoPayments subscription with new price
3. Immediately update `subscriptions.plan_tier` to new plan
4. Update `usage_quotas.plan_quota` to new quota
5. Charge prorated amount via DodoPayments

## Downgrade Subscription

### Request
```
POST /api/subscriptions/downgrade
Authorization: Bearer <supabase_jwt>
Content-Type: application/json

{
  "newPlan": "starter"
}
```

### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Subscription will downgrade to Starter plan at period end",
  "effectiveDate": "2025-11-01T00:00:00.000Z",
  "newQuota": 5000
}
```

### Implementation Flow
1. Set `subscriptions.cancel_at_period_end = true`
2. Store pending downgrade in metadata
3. User retains current quota until `current_period_end`
4. At period end, webhook updates to new plan

## Cancel Subscription

### Request
```
POST /api/subscriptions/cancel
Authorization: Bearer <supabase_jwt>
```

### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Subscription canceled. You will retain access until 2025-11-01",
  "accessUntil": "2025-11-01T00:00:00.000Z"
}
```

### Implementation Flow
1. Call DodoPayments API to cancel subscription at period end
2. Set `subscriptions.cancel_at_period_end = true`
3. User retains access until `current_period_end`
4. At period end, webhook downgrades to free tier

## DodoPayments Webhook Handler

### Request
```
POST /api/subscriptions/webhook
Content-Type: application/json
X-Dodo-Signature: <webhook_signature>

{
  "event": "payment.succeeded",
  "data": {
    "customerId": "cus_abc123",
    "subscriptionId": "sub_def456",
    "amount": 2900,
    "currency": "USD",
    "invoiceId": "inv_789xyz",
    "billingPeriodStart": "2025-10-01T00:00:00.000Z",
    "billingPeriodEnd": "2025-11-01T00:00:00.000Z"
  }
}
```

### Success Response (200 OK)
```json
{
  "received": true
}
```

### Webhook Events

#### payment.succeeded
- Update `subscriptions.status = 'active'`
- Create new `invoices` record with `payment_status = 'paid'`
- Send invoice email to user

#### payment.failed
- Update `subscriptions.status = 'past_due'`
- Send email notification to user to update payment method
- Retry payment per DodoPayments retry schedule

#### subscription.updated
- Update `subscriptions` record with new plan/status
- Update `usage_quotas.plan_quota` if plan changed

#### subscription.canceled
- Update `subscriptions.plan_tier = 'free'`
- Update `subscriptions.status = 'canceled'`
- Update `usage_quotas.plan_quota = 100` (free tier quota)

### Webhook Security
```typescript
// Verify webhook signature
import crypto from 'crypto';

function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

## Error Responses

### 400 Bad Request - Invalid Plan
```json
{
  "success": false,
  "error": {
    "code": "INVALID_PLAN",
    "message": "Plan tier must be one of: starter, pro, enterprise"
  }
}
```

### 409 Conflict - Already on Plan
```json
{
  "success": false,
  "error": {
    "code": "ALREADY_ON_PLAN",
    "message": "You are already on the Starter plan"
  }
}
```

### 402 Payment Required - Failed Payment
```json
{
  "success": false,
  "error": {
    "code": "PAYMENT_REQUIRED",
    "message": "Your subscription is past due. Please update your payment method.",
    "paymentUrl": "https://billing.dodopayments.com/update-payment?customer=cus_abc123"
  }
}
```

## Pricing Tiers

| Tier | Quota | Price | Billing |
|------|-------|-------|---------|
| Free | 100 PDFs/mo | $0 | N/A |
| Starter | 5,000 PDFs/mo | $29 | Monthly |
| Pro | 50,000 PDFs/mo | $99 | Monthly |
| Enterprise | Custom | Custom | Custom |

## Implementation Notes

### DodoPayments Integration
- **API Keys**: Store in environment variables (`DODO_API_KEY`)
- **Webhook Secret**: Store in environment variables (`DODO_WEBHOOK_SECRET`)
- **Price IDs**: Map plan tiers to DodoPayments price IDs
  - `starter_monthly`: `price_starter_month_v1`
  - `pro_monthly`: `price_pro_month_v1`
- **Customer Creation**: Create customer on first paid subscription
- **Idempotency**: Use `dodo_subscription_id` to prevent duplicate charges

### Email Notifications
Send emails for:
- Subscription activated (welcome email)
- Payment succeeded (invoice)
- Payment failed (update payment method)
- Subscription upgraded (confirmation)
- Subscription canceled (retention offer)

### Retry Logic for Webhooks
- DodoPayments retries failed webhooks with exponential backoff
- Acknowledge webhook immediately with 200 OK
- Process webhook asynchronously (Cloudflare Queue or similar)
- If processing fails, DodoPayments will retry (max 3 attempts over 24h)

### Quota Updates on Plan Changes
```typescript
async function updateQuotaOnPlanChange(
  userId: string,
  newPlan: 'free' | 'starter' | 'pro' | 'enterprise'
) {
  const quotaMap = {
    free: 100,
    starter: 5000,
    pro: 50000,
    enterprise: 100000  // Default for enterprise, can be customized
  };

  await supabase
    .from('usage_quotas')
    .update({ plan_quota: quotaMap[newPlan] })
    .eq('user_id', userId);
}
```
