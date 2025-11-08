# Stripe Payment Setup Guide

## Overview
This guide will help you set up Stripe payments for the funding feature on posts.

## Backend Setup

### 1. Add Stripe Keys to Backend `.env` file

Add these lines to your `backend/.env` file:

```env
# Stripe Payment Keys (Test Mode)
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_PUBLIC_KEY=pk_test_your_public_key_here
STRIPE_TEST_SECRET_KEY=sk_test_your_secret_key_here  # Alternative name
STRIPE_TEST_PUBLIC_KEY=pk_test_your_public_key_here  # Alternative name

# Optional: For webhook handling in production
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

**Note:** The code checks for `STRIPE_SECRET_KEY` or `STRIPE_TEST_SECRET_KEY`, so either will work.

### 2. Get Your Stripe Test Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
2. Copy your **Publishable key** (starts with `pk_test_`)
3. Copy your **Secret key** (starts with `sk_test_`)
4. Add them to your `.env` file

### 3. Restart Backend Server

After adding the keys, restart your backend server:
```bash
cd backend
npm start
# or
npm run dev
```

## Frontend Setup

### Option 1: Get Public Key from Backend (Recommended)

The frontend automatically fetches the Stripe public key from the backend endpoint `/payments/public-key`. No frontend configuration needed!

### Option 2: Set Environment Variable

If you prefer to set it directly in the frontend, create a `.env` file in the `frontend` directory:

```env
VITE_STRIPE_PUBLIC_KEY=pk_test_your_public_key_here
```

Then restart your frontend dev server:
```bash
cd frontend
npm run dev
```

## Testing Payments

### Test Card Numbers

Use these Stripe test card numbers:

- **Success:** `4242 4242 4242 4242`
- **Decline:** `4000 0000 0000 0002`
- **Requires Authentication:** `4000 0025 0000 3155`

**For all test cards:**
- Expiry: Any future date (e.g., `12/25`)
- CVC: Any 3 digits (e.g., `123`)
- ZIP: Any 5 digits (e.g., `12345`)

### Testing Flow

1. **Create a post** (or use an existing one)
2. **Click the Fund button** (💰 icon) on any post
3. **Select an amount** ($1, $5, $10, etc.) or enter custom amount
4. **Optionally add a message**
5. **Enter test card details**
6. **Complete payment**

## Features

### ✅ What's Included

- 💰 **Fund Posts** - Users can fund any post with a minimum of $0.50
- 📊 **Funding Stats** - See total funding and donation count on each post
- 💳 **Stripe Integration** - Secure payment processing
- 💬 **Optional Messages** - Donors can leave messages with donations
- 📈 **Funding Display** - Shows total raised amount on post cards
- 🚫 **Self-Funding Prevention** - Users cannot fund their own posts

### 📍 Endpoints

- `POST /payments/create-intent` - Create payment intent
- `POST /payments/confirm` - Confirm payment
- `GET /payments/post/:postId` - Get funding stats for a post
- `GET /payments/my-donations` - Get donations made by user
- `GET /payments/my-earnings` - Get earnings from posts
- `GET /payments/public-key` - Get Stripe public key
- `POST /payments/webhook` - Stripe webhook (for production)

## Troubleshooting

### "Stripe is not configured" Error

**Backend:**
- Check that `STRIPE_SECRET_KEY` or `STRIPE_TEST_SECRET_KEY` is in your `.env` file
- Make sure the key starts with `sk_test_` (for test mode)
- Restart your backend server after adding keys

**Frontend:**
- The frontend automatically fetches the public key from the backend
- If that fails, set `VITE_STRIPE_PUBLIC_KEY` in your frontend `.env`
- Restart your frontend dev server

### "Payment failed" Error

- Make sure you're using a valid test card number
- Check that the amount is at least $0.50
- Verify your Stripe keys are correct
- Check browser console for detailed error messages

### Payment Not Showing Up

- Payments are updated immediately after successful payment
- If webhook is configured, it will also update via webhook
- Check that `POST /payments/confirm` is being called after payment
- Verify the payment intent status is "succeeded"

## Production Setup

### 1. Switch to Live Keys

Replace test keys with live keys in your production `.env`:

```env
STRIPE_SECRET_KEY=sk_live_your_live_secret_key
STRIPE_PUBLIC_KEY=pk_live_your_live_public_key
```

### 2. Set Up Webhooks

1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. Add endpoint: `https://yourdomain.com/payments/webhook`
3. Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`
4. Copy webhook secret to `STRIPE_WEBHOOK_SECRET` in `.env`

### 3. Update Frontend

Update your frontend `.env` with live public key:
```env
VITE_STRIPE_PUBLIC_KEY=pk_live_your_live_public_key
```

## Security Notes

- ✅ Never commit `.env` files to git
- ✅ Always use environment variables for keys
- ✅ Use test keys for development
- ✅ Use live keys only in production
- ✅ Keep your secret keys secure
- ✅ Enable webhook signature verification in production

## Support

If you encounter issues:
1. Check the browser console for errors
2. Check backend logs for payment errors
3. Verify Stripe keys are correct
4. Test with Stripe test cards
5. Check Stripe Dashboard for payment attempts

