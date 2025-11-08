import express from "express";
import Stripe from "stripe";
import { authenticateToken } from "../middleware/auth.js";
import Payment from "../models/Payment.js";
import Post from "../models/Post.js";
import User from "../models/User.js";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

// GET /payments/public-key - Get Stripe public key
router.get("/public-key", (req, res) => {
  const publicKey = process.env.STRIPE_PUBLIC_KEY || 
                    process.env.STRIPE_TEST_PUBLIC_KEY;
  
  if (!publicKey) {
    return res.status(503).json({ 
      error: "Stripe public key not configured",
      message: "Please set STRIPE_PUBLIC_KEY or STRIPE_TEST_PUBLIC_KEY in your .env file"
    });
  }
  
  res.json({ publicKey });
});

// Initialize Stripe - check both possible env variable names
const stripeKey = process.env.STRIPE_SECRET_KEY || 
                  process.env.STRIPE_TEST_SECRET_KEY ||
                  process.env.STRIPE_SECRET_KEY_TEST;

if (!stripeKey) {
  console.warn("⚠️  Stripe secret key not found. Payment functionality will not work.");
  console.warn("   Please set STRIPE_SECRET_KEY or STRIPE_TEST_SECRET_KEY in your .env file");
}

const stripe = stripeKey ? new Stripe(stripeKey, {
  apiVersion: "2024-12-18.acacia",
}) : null;

// POST /payments/create-intent - Create a payment intent for funding a post
router.post("/create-intent", authenticateToken, async (req, res) => {
  if (!stripe) {
    return res.status(500).json({ error: "Stripe is not configured" });
  }
  
  try {
    const { postId, amount, message } = req.body;
    const donorId = String(req.user._id);

    // Validate inputs
    if (!postId) {
      return res.status(400).json({ error: "postId is required" });
    }

    const amountInCents = Math.round(parseFloat(amount) * 100);
    if (!amountInCents || amountInCents < 50) {
      // Minimum $0.50
      return res.status(400).json({ error: "Minimum amount is $0.50" });
    }

    if (amountInCents > 10000000) {
      // Maximum $100,000
      return res.status(400).json({ error: "Maximum amount is $100,000" });
    }

    // Get post and author
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    const recipientId = String(post.accountId);

    // Prevent self-funding
    if (donorId === recipientId) {
      return res.status(400).json({ error: "You cannot fund your own post" });
    }

    // Get recipient user info
    const recipient = await User.findById(recipientId).select("username email");
    if (!recipient) {
      return res.status(404).json({ error: "Post author not found" });
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: "usd",
      metadata: {
        postId,
        donorId,
        recipientId,
        message: message || "",
      },
      description: `Funding for post by ${recipient.username || recipient.email}`,
    });

    // Create payment record
    const payment = await Payment.create({
      postId,
      donorId,
      recipientId,
      amount: amountInCents,
      currency: "usd",
      stripePaymentIntentId: paymentIntent.id,
      status: "pending",
      message: message || "",
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentId: payment._id,
    });
  } catch (error) {
    console.error("Create payment intent error:", error);
    res.status(500).json({ error: "Failed to create payment intent" });
  }
});

// POST /payments/confirm - Confirm payment after successful Stripe payment
router.post("/confirm", authenticateToken, async (req, res) => {
  if (!stripe) {
    return res.status(500).json({ error: "Stripe is not configured" });
  }
  
  try {
    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({ error: "paymentIntentId is required" });
    }

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    // Find payment record
    const payment = await Payment.findOne({
      stripePaymentIntentId: paymentIntentId,
    });

    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }

    // Update payment status
    if (paymentIntent.status === "succeeded") {
      payment.status = "succeeded";

      // Update post funding totals
      await Post.findByIdAndUpdate(payment.postId, {
        $inc: {
          fundingTotal: payment.amount,
          fundingCount: 1,
        },
      });

      await payment.save();

      res.json({
        success: true,
        payment: {
          id: payment._id,
          amount: payment.amount / 100,
          status: payment.status,
        },
      });
    } else {
      payment.status = paymentIntent.status;
      await payment.save();

      res.json({
        success: false,
        status: paymentIntent.status,
      });
    }
  } catch (error) {
    console.error("Confirm payment error:", error);
    res.status(500).json({ error: "Failed to confirm payment" });
  }
});

// GET /payments/post/:postId - Get funding stats for a post
router.get("/post/:postId", async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await Post.findById(postId).select("fundingTotal fundingCount");
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Get recent donations
    const recentPayments = await Payment.find({
      postId,
      status: "succeeded",
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .select("amount donorId message createdAt")
      .lean();

    // Get donor info
    const donorIds = [...new Set(recentPayments.map((p) => p.donorId))];
    const donors = await User.find({ _id: { $in: donorIds } }).select(
      "username profile.full_name profile.avatar"
    );

    const donorMap = {};
    donors.forEach((d) => {
      donorMap[String(d._id)] = {
        username: d.username,
        fullName: d.profile?.full_name || "",
        avatar: d.profile?.avatar || "",
      };
    });

    const donations = recentPayments.map((p) => ({
      amount: p.amount / 100,
      donor: donorMap[p.donorId] || { username: "Anonymous" },
      message: p.message,
      createdAt: p.createdAt,
    }));

    res.json({
      totalFunding: (post.fundingTotal || 0) / 100,
      fundingCount: post.fundingCount || 0,
      donations,
    });
  } catch (error) {
    console.error("Get post funding error:", error);
    res.status(500).json({ error: "Failed to get funding stats" });
  }
});

// GET /payments/my-donations - Get donations made by current user
router.get("/my-donations", authenticateToken, async (req, res) => {
  try {
    const donorId = String(req.user._id);

    const donations = await Payment.find({ donorId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const postIds = [...new Set(donations.map((d) => d.postId))];
    const posts = await Post.find({ _id: { $in: postIds } }).select(
      "content accountId"
    );

    const postMap = {};
    posts.forEach((p) => {
      postMap[String(p._id)] = {
        content: p.content?.substring(0, 100) || "",
        authorId: p.accountId,
      };
    });

    const result = donations.map((d) => ({
      id: d._id,
      amount: d.amount / 100,
      postId: d.postId,
      post: postMap[d.postId] || {},
      status: d.status,
      createdAt: d.createdAt,
    }));

    res.json({ donations: result });
  } catch (error) {
    console.error("Get my donations error:", error);
    res.status(500).json({ error: "Failed to get donations" });
  }
});

// GET /payments/my-earnings - Get earnings from posts (for post authors)
router.get("/my-earnings", authenticateToken, async (req, res) => {
  try {
    const recipientId = String(req.user._id);

    const earnings = await Payment.find({
      recipientId,
      status: "succeeded",
    })
      .sort({ createdAt: -1 })
      .lean();

    const totalEarnings = earnings.reduce((sum, e) => sum + e.amount, 0);

    // Group by post
    const postEarnings = {};
    earnings.forEach((e) => {
      if (!postEarnings[e.postId]) {
        postEarnings[e.postId] = { count: 0, total: 0 };
      }
      postEarnings[e.postId].count++;
      postEarnings[e.postId].total += e.amount;
    });

    res.json({
      totalEarnings: totalEarnings / 100,
      totalDonations: earnings.length,
      postEarnings: Object.entries(postEarnings).map(([postId, data]) => ({
        postId,
        count: data.count,
        total: data.total / 100,
      })),
      recent: earnings.slice(0, 20).map((e) => ({
        id: e._id,
        amount: e.amount / 100,
        postId: e.postId,
        donorId: e.donorId,
        message: e.message,
        createdAt: e.createdAt,
      })),
    });
  } catch (error) {
    console.error("Get my earnings error:", error);
    res.status(500).json({ error: "Failed to get earnings" });
  }
});

// Webhook endpoint for Stripe (to handle payment confirmations)
router.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  if (!stripe) {
    return res.status(500).send("Stripe is not configured");
  }
  
  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    if (!webhookSecret) {
      console.warn("Stripe webhook secret not configured");
      return res.status(400).send("Webhook secret not configured");
    }

    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object;

    try {
      const payment = await Payment.findOne({
        stripePaymentIntentId: paymentIntent.id,
      });

      if (payment && payment.status === "pending") {
        payment.status = "succeeded";

        // Update post funding totals
        await Post.findByIdAndUpdate(payment.postId, {
          $inc: {
            fundingTotal: payment.amount,
            fundingCount: 1,
          },
        });

        await payment.save();
        console.log(`Payment confirmed: ${payment._id}`);
      }
    } catch (error) {
      console.error("Error processing webhook:", error);
    }
  } else if (event.type === "payment_intent.payment_failed") {
    const paymentIntent = event.data.object;

    try {
      const payment = await Payment.findOne({
        stripePaymentIntentId: paymentIntent.id,
      });

      if (payment) {
        payment.status = "failed";
        await payment.save();
      }
    } catch (error) {
      console.error("Error processing failed payment:", error);
    }
  }

  res.json({ received: true });
});

export default router;

