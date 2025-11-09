import express from "express";
import { body, validationResult } from "express-validator";
import passport from "passport";
import multer from "multer";
import { GoogleGenerativeAI } from "@google/generative-ai";
import User from "../models/User.js";
import {
  generateToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../middleware/auth.js";

const router = express.Router();

// Configure multer for image upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY
);

// Validation middleware
const validateSignup = [
  body("username")
    .isLength({ min: 3, max: 30 })
    .withMessage("Username must be between 3 and 30 characters")
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage("Username can only contain letters, numbers, and underscores")
    .trim(),
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address")
    .trim(),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "Password must contain at least one lowercase letter, one uppercase letter, and one number"
    ),
  body("role")
    .optional()
    .trim()
    .toLowerCase()
    .isIn(["user", "creator", "enterprise"])
    .withMessage("role must be 'user', 'creator', or 'enterprise'"),
];

const validateLogin = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address")
    .trim(),
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 1 })
    .withMessage("Password cannot be empty"),
];

// Register new user
router.post("/signup", validateSignup, async (req, res) => {
  try {
    console.log("Signup attempt for:", req.body.email);

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log("Validation errors:", errors.array());
      return res.status(400).json({
        error: "Validation failed",
        details: errors.array(),
      });
    }

    const { username, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      console.log(
        "User already exists:",
        existingUser.email === email ? "email" : "username"
      );
      return res.status(400).json({
        error: "User already exists",
        field: existingUser.email === email ? "email" : "username",
      });
    }

    // Create new user
    // Default role is "user" (normal user)
    const user = new User({
      username,
      email,
      password,
      provider: "local",
      role: role || "user",
    });

    await user.save();
    console.log("New user created:", user._id);

    // Generate tokens
    const accessToken = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    res.status(201).json({
      message: "User created successfully",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        provider: user.provider,
        role: user.role,
        profile: user.profile,
        createdAt: user.createdAt,
      },
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: "bearer",
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to create account. Please try again.",
    });
  }
});

// Login user
router.post("/login", validateLogin, async (req, res) => {
  try {
    console.log("Login attempt for:", req.body.email);

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log("Login validation errors:", errors.array());
      return res.status(400).json({
        error: "Validation failed",
        details: errors.array(),
      });
    }

    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email, provider: "local" });
    if (!user) {
      console.log("User not found for email:", email);
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Check if account is active
    if (!user.isActive) {
      console.log("Account deactivated for:", email);
      return res.status(401).json({ error: "Account is deactivated" });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      console.log("Invalid password for:", email);
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Generate tokens
    const accessToken = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    console.log("Successful login for:", email);

    res.json({
      message: "Login successful",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        provider: user.provider,
        role: user.role,
        profile: user.profile,
        lastLogin: user.lastLogin,
      },
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: "bearer",
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Login failed. Please try again.",
    });
  }
});

// Refresh token endpoint
router.post("/refresh", async (req, res) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(401).json({ error: "Refresh token required" });
    }

    const decoded = verifyRefreshToken(refresh_token);
    const user = await User.findById(decoded.userId);

    if (!user || !user.isActive) {
      return res.status(401).json({ error: "Invalid refresh token" });
    }

    // Generate new tokens
    const accessToken = generateToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    res.json({
      access_token: accessToken,
      refresh_token: newRefreshToken,
      token_type: "bearer",
    });
  } catch (error) {
    console.error("Token refresh error:", error);
    res.status(401).json({ error: "Invalid refresh token" });
  }
});

// Google OAuth routes - Rewritten
router.get("/google/url", (req, res) => {
  try {
    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    if (!googleClientId) {
      return res.status(500).json({
        error: "Google OAuth not configured",
        message: "GOOGLE_CLIENT_ID is missing from environment variables",
      });
    }

    const redirectUri = `${
      process.env.BACKEND_BASE_URL || "http://localhost:5003"
    }/auth/google/callback`;

    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authUrl.searchParams.set("client_id", googleClientId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", "openid email profile");
    authUrl.searchParams.set("access_type", "offline");
    authUrl.searchParams.set("prompt", "consent");

    // Carry role via OAuth state (validated later). Defaults to 'user'.
    const requestedRole = (req.query.role || "user").toString().toLowerCase();
    const role = ["user", "creator", "enterprise"].includes(requestedRole)
      ? requestedRole
      : "user";
    authUrl.searchParams.set("state", JSON.stringify({ role }));

    console.log("Generated Google OAuth URL:", authUrl.toString());
    console.log("Redirect URI:", redirectUri);

    // Ensure JSON response
    res.setHeader("Content-Type", "application/json");
    res.json({
      url: authUrl.toString(),
      redirect_uri: redirectUri,
    });
  } catch (error) {
    console.error("Error generating Google OAuth URL:", error);
    // Ensure error response is also JSON
    res.status(500).setHeader("Content-Type", "application/json");
    res.json({
      error: "Failed to generate OAuth URL",
      message: error.message || "An unexpected error occurred",
    });
  }
});

router.get("/google/callback", async (req, res) => {
  try {
    console.log("Google OAuth callback received");
    console.log("Query params:", req.query);

    const { code, error, state } = req.query;

    if (error) {
      console.error("Google OAuth error:", error);
      return res.redirect(
        `${
          process.env.FRONTEND_URL || "http://localhost:5173"
        }/login?error=${error}`
      );
    }

    if (!code) {
      console.error("No authorization code received");
      return res.redirect(
        `${
          process.env.FRONTEND_URL || "http://localhost:5173"
        }/login?error=no_code`
      );
    }

    // Exchange code for tokens
    const tokenData = {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: `${
        process.env.BACKEND_BASE_URL || "http://localhost:5003"
      }/auth/google/callback`,
      grant_type: "authorization_code",
    };

    console.log("Exchanging code for tokens...");
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(tokenData),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("Token exchange failed:", tokenResponse.status, errorText);
      return res.redirect(
        `${
          process.env.FRONTEND_URL || "http://localhost:5173"
        }/login?error=token_exchange_failed`
      );
    }

    const tokens = await tokenResponse.json();
    console.log("Tokens received successfully");

    const { access_token, id_token } = tokens;

    if (!access_token) {
      console.error("No access token in response");
      return res.redirect(
        `${
          process.env.FRONTEND_URL || "http://localhost:5173"
        }/login?error=no_access_token`
      );
    }

    // Get user info from Google
    console.log("Fetching user info from Google...");
    const userInfoResponse = await fetch(
      `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${access_token}`
    );

    if (!userInfoResponse.ok) {
      const errorText = await userInfoResponse.text();
      console.error(
        "Failed to get user info:",
        userInfoResponse.status,
        errorText
      );
      return res.redirect(
        `${
          process.env.FRONTEND_URL || "http://localhost:5173"
        }/login?error=user_info_failed`
      );
    }

    const userInfo = await userInfoResponse.json();
    console.log("User info received:", {
      id: userInfo.id,
      email: userInfo.email,
      name: userInfo.name,
    });

    const { email, name, id: googleId, picture } = userInfo;

    if (!email) {
      console.error("No email in user info");
      return res.redirect(
        `${
          process.env.FRONTEND_URL || "http://localhost:5173"
        }/login?error=no_email`
      );
    }

    // Find or create user
    let user = await User.findOne({ email });
    if (!user) {
      console.log("Creating new user for:", email);
      let role = "user";
      try {
        if (state) {
          const parsed = JSON.parse(state);
          const requestedRole = (parsed.role || "user")
            .toString()
            .toLowerCase();
          if (["user", "creator", "enterprise"].includes(requestedRole))
            role = requestedRole;
        }
      } catch (_) {}

      user = new User({
        username: email.split("@")[0],
        email,
        googleId,
        provider: "google",
        role,
        profile: {
          full_name: name || "",
          avatar: picture || "",
        },
      });
      await user.save();
      console.log("New user created:", user._id);
    } else {
      console.log("Existing user found:", user._id);
      // Update Google info if needed
      if (!user.googleId) {
        user.googleId = googleId;
        user.provider = "google";
      }
      if (!user.profile.full_name && name) {
        user.profile.full_name = name;
      }
      if (!user.profile.avatar && picture) {
        user.profile.avatar = picture;
      }
      // Optionally update role from state for existing Google users
      try {
        if (state) {
          const parsed = JSON.parse(state);
          const requestedRole = (parsed.role || "user")
            .toString()
            .toLowerCase();
          if (
            ["user", "creator", "enterprise"].includes(requestedRole) &&
            user.role !== requestedRole
          ) {
            user.role = requestedRole;
          }
        }
      } catch (_) {}
      await user.save();
    }

    // Generate JWT tokens
    const jwtToken = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    console.log("OAuth successful, redirecting to frontend with token");

    // Redirect to frontend with token
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    res.redirect(
      `${frontendUrl}/login?token=${jwtToken}&refresh=${refreshToken}&success=true`
    );
  } catch (error) {
    console.error("Google OAuth callback error:", error);
    res.redirect(
      `${
        process.env.FRONTEND_URL || "http://localhost:5173"
      }/login?error=oauth_failed`
    );
  }
});

// Logout endpoint (for token blacklisting if needed)
router.post("/logout", async (req, res) => {
  // For now, we'll just return success since JWT tokens are stateless
  // In a production app, you might want to implement token blacklisting
  res.json({ message: "Logged out successfully" });
});

// Auth0 token exchange endpoint
router.post("/auth0/exchange", async (req, res) => {
  try {
    const { auth0Token, email, name, picture, sub } = req.body;

    if (!auth0Token || !email || !sub) {
      return res.status(400).json({ error: "Missing required Auth0 data" });
    }

    // Find or create user based on Auth0 sub (unique identifier)
    let user = await User.findOne({ auth0Sub: sub });

    if (!user) {
      // Check if user exists with this email (from other auth methods)
      user = await User.findOne({ email });

      if (user) {
        // Link Auth0 account to existing user
        user.auth0Sub = sub;
        if (picture && !user.profilePicture) {
          user.profilePicture = picture;
        }
        await user.save();
      } else {
        // Create new user from Auth0 data
        const username =
          email.split("@")[0] + "_" + Math.random().toString(36).substring(7);

        user = new User({
          username,
          email,
          auth0Sub: sub,
          profilePicture: picture || "",
          fullName: name || username,
          role: "user", // Default role, can be changed later
          isActive: true,
        });

        await user.save();
      }
    }

    // Generate JWT token for your backend
    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    res.json({
      access_token: token,
      refresh_token: refreshToken,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture,
      },
    });
  } catch (error) {
    console.error("Auth0 exchange error:", error);
    res.status(500).json({ error: "Failed to exchange Auth0 token" });
  }
});

// Gender verification endpoint using Gemini AI
router.post("/verify-gender", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image provided" });
    }

    // Check if Gemini API key is configured
    if (!process.env.GEMINI_API_KEY && !process.env.GOOGLE_AI_API_KEY) {
      console.error("Gemini API key not configured");
      return res
        .status(500)
        .json({ error: "AI verification service not configured" });
    }

    console.log("[Gender Verification] Processing image...");

    // Convert image buffer to base64
    const imageBase64 = req.file.buffer.toString("base64");
    const mimeType = req.file.mimetype;

    // Get Gemini model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Create prompt for gender detection
    const prompt = `Analyze this selfie image and determine the gender of the person. 
    
    Instructions:
    - Look at facial features, hair, and overall appearance
    - Respond ONLY with a JSON object in this exact format: {"gender": "male" or "female", "confidence": number between 0-100, "reasoning": "brief explanation"}
    - Be accurate and respectful
    - If you cannot determine the gender clearly or if there's no person in the image, set confidence to 0
    
    Respond with ONLY the JSON object, no other text.`;

    // Generate content with image
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: mimeType,
          data: imageBase64,
        },
      },
    ]);

    const response = await result.response;
    const text = response.text();

    console.log("[Gender Verification] AI Response:", text);

    // Parse the JSON response
    let aiResult;
    try {
      // Extract JSON from response (in case there's extra text)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        aiResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error(
        "[Gender Verification] Failed to parse AI response:",
        parseError
      );
      return res.status(500).json({
        error: "Failed to analyze image",
        details: "AI response was not in expected format",
      });
    }

    // Validate the response
    const gender = aiResult.gender?.toLowerCase();
    const confidence = parseFloat(aiResult.confidence) || 0;

    console.log(
      `[Gender Verification] Detected: ${gender}, Confidence: ${confidence}%`
    );

    // Determine if verification passed
    const isVerified = gender === "female" && confidence >= 60;

    // Prepare response
    const verificationResponse = {
      isVerified,
      gender,
      confidence,
      reasoning: aiResult.reasoning,
      message: isVerified
        ? "Verification successful! You can proceed to signup."
        : gender === "male"
        ? "Sorry, this platform is currently only available for women."
        : "We couldn't verify your identity clearly. Please try again with better lighting and ensure your face is clearly visible.",
    };

    res.json(verificationResponse);
  } catch (error) {
    console.error("[Gender Verification] Error:", error);
    res.status(500).json({
      error: "Verification failed",
      details: error.message,
    });
  }
});

export default router;
