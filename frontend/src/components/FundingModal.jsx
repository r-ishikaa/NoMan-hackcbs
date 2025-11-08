import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import API_CONFIG from '../config/api';
import { X, DollarSign, Heart, MessageCircle } from 'lucide-react';

// Initialize Stripe - Get public key from backend or environment
// This will be set when the modal initializes
let stripePromiseInstance = null;

// Function to initialize Stripe (called when modal opens)
const initializeStripe = async () => {
  if (stripePromiseInstance) return stripePromiseInstance;
  
  try {
    // Try to get public key from backend first
    const response = await fetch(API_CONFIG.getApiUrl('/payments/public-key'));
    if (response.ok) {
      const { publicKey } = await response.json();
      if (publicKey && publicKey !== 'pk_test_placeholder') {
        stripePromiseInstance = loadStripe(publicKey);
        return stripePromiseInstance;
      }
    }
  } catch (err) {
    console.warn('Failed to fetch Stripe public key from backend:', err);
  }
  
  // Fallback to environment variable
  const envKey = 
    import.meta.env?.VITE_STRIPE_PUBLIC_KEY ||
    process.env.REACT_APP_STRIPE_PUBLIC_KEY ||
    process.env.VITE_STRIPE_PUBLIC_KEY;
  
  if (envKey && envKey !== 'pk_test_placeholder') {
    stripePromiseInstance = loadStripe(envKey);
    return stripePromiseInstance;
  }
  
  return null;
};

function authHeaders() {
  const token =
    localStorage.getItem('hexagon_token') ||
    localStorage.getItem('token') ||
    localStorage.getItem('jwt');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function CheckoutForm({ postId, amount, message, onSuccess, onClose }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [clientSecret, setClientSecret] = useState(null);

  useEffect(() => {
    // Create payment intent when component mounts
    const createIntent = async () => {
      try {
        const response = await fetch(API_CONFIG.getApiUrl('/payments/create-intent'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...authHeaders(),
          },
          body: JSON.stringify({
            postId,
            amount: parseFloat(amount),
            message: message || '',
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to create payment intent');
        }

        const data = await response.json();
        setClientSecret(data.clientSecret);
      } catch (err) {
        setError(err.message);
      }
    };

    if (amount && parseFloat(amount) > 0) {
      createIntent();
    }
  }, [postId, amount, message]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      return;
    }

    setProcessing(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);

    try {
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
          },
        }
      );

      if (stripeError) {
        setError(stripeError.message);
        setProcessing(false);
        return;
      }

      if (paymentIntent.status === 'succeeded') {
        // Confirm payment on backend
        await fetch(API_CONFIG.getApiUrl('/payments/confirm'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...authHeaders(),
          },
          body: JSON.stringify({
            paymentIntentId: paymentIntent.id,
          }),
        });

        onSuccess();
      }
    } catch (err) {
      setError(err.message || 'Payment failed');
      setProcessing(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
        <CardElement options={cardElementOptions} />
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          disabled={processing}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || processing || !clientSecret}
          className="flex-1 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {processing ? 'Processing...' : `Pay $${parseFloat(amount).toFixed(2)}`}
        </button>
      </div>
    </form>
  );
}

function FundingModal({ postId, postAuthor, onClose, onSuccess }) {
  const [amount, setAmount] = useState('5');
  const [message, setMessage] = useState('');
  const [fundingStats, setFundingStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stripeReady, setStripeReady] = useState(false);
  const [stripeError, setStripeError] = useState(null);
  const [currentStripePromise, setCurrentStripePromise] = useState(null);

  useEffect(() => {
    // Initialize Stripe and fetch funding stats
    const init = async () => {
      try {
        // Initialize Stripe
        const stripe = await initializeStripe();
        if (stripe) {
          setCurrentStripePromise(stripe);
          setStripeReady(true);
        } else {
          setStripeError('Stripe is not configured. Please set up Stripe keys in your backend .env file.');
        }
        
        // Fetch funding stats
        const response = await fetch(API_CONFIG.getApiUrl(`/payments/post/${postId}`));
        if (response.ok) {
          const data = await response.json();
          setFundingStats(data);
        }
      } catch (err) {
        console.error('Initialization error:', err);
        setStripeError('Failed to initialize payment system');
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [postId]);

  const quickAmounts = [1, 5, 10, 25, 50, 100];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <DollarSign className="w-6 h-6 text-violet-600" />
                Fund This Post
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Support {postAuthor || 'this creator'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Funding Stats */}
          {!loading && fundingStats && (
            <div className="mb-6 p-4 bg-violet-50 rounded-lg border border-violet-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Total Raised</span>
                <span className="text-2xl font-bold text-violet-600">
                  ${fundingStats.totalFunding?.toFixed(2) || '0.00'}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Heart className="w-4 h-4" />
                  {fundingStats.fundingCount || 0} donations
                </span>
              </div>
            </div>
          )}

          {/* Amount Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount (USD)
            </label>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {quickAmounts.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setAmount(amt.toString())}
                  className={`px-4 py-2 rounded-lg border-2 font-medium transition-colors ${
                    amount === amt.toString()
                      ? 'border-violet-600 bg-violet-50 text-violet-600'
                      : 'border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  ${amt}
                </button>
              ))}
            </div>
            <input
              type="number"
              min="0.50"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Custom amount"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">Minimum: $0.50</p>
          </div>

          {/* Message (Optional) */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message (Optional)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Leave a message of support..."
              rows={3}
              maxLength={200}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              {message.length}/200 characters
            </p>
          </div>

          {/* Payment Form */}
          {stripeError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {stripeError}
            </div>
          )}
          {parseFloat(amount) >= 0.50 && stripeReady && currentStripePromise ? (
            <Elements stripe={currentStripePromise}>
              <CheckoutForm
                postId={postId}
                amount={amount}
                message={message}
                onSuccess={() => {
                  onSuccess();
                  onClose();
                }}
                onClose={onClose}
              />
            </Elements>
          ) : parseFloat(amount) >= 0.50 && !stripeReady && !stripeError ? (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm">
              Loading payment system...
            </div>
          ) : null}

          {parseFloat(amount) < 0.50 && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 text-sm">
              Please enter an amount of at least $0.50
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default FundingModal;

