const { body } = require("express-validator");
const User = require("../models/User");
const AnalysisHistory = require("../models/AnalysisHistory");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const validate = require("../middleware/validate");
const { sendAuthCookie, clearAuthCookie } = require("../services/tokenService");

const authValidators = {
  signup: [
    body("name").isString().trim().isLength({ min: 2, max: 80 }).withMessage("Name must be 2-80 characters"),
    body("email").isEmail().normalizeEmail().withMessage("Valid email is required"),
    body("password").isStrongPassword({ minLength: 8, minSymbols: 0 }).withMessage("Password must be at least 8 characters and include uppercase, lowercase, and a number"),
    validate
  ],
  login: [
    body("email").isEmail().normalizeEmail().withMessage("Valid email is required"),
    body("password").isString().notEmpty().withMessage("Password is required"),
    validate
  ]
};

const userPayload = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  avatarColor: user.avatarColor,
  createdAt: user.createdAt,
  lastLoginAt: user.lastLoginAt
});

const signup = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const existing = await User.findOne({ email });
  if (existing) throw new ApiError(409, "Email is already registered");

  const passwordHash = await User.hashPassword(password);
  const user = await User.create({ name, email, passwordHash });
  sendAuthCookie(res, user);

  res.status(201).json({ success: true, user: userPayload(user) });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select("+passwordHash");
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, "Invalid email or password");
  }

  user.lastLoginAt = new Date();
  await user.save();
  sendAuthCookie(res, user);

  res.json({ success: true, user: userPayload(user) });
});

const logout = asyncHandler(async (_req, res) => {
  clearAuthCookie(res);
  res.json({ success: true });
});

const me = asyncHandler(async (req, res) => {
  const [totalAnalyses, lastAnalysis] = await Promise.all([
    AnalysisHistory.countDocuments({ user: req.user._id }),
    AnalysisHistory.findOne({ user: req.user._id }).sort({ createdAt: -1 }).lean()
  ]);

  res.json({
    success: true,
    user: userPayload(req.user),
    stats: {
      totalAnalyses,
      lastAnalysisAt: lastAnalysis?.createdAt || null
    }
  });
});

module.exports = { authValidators, signup, login, logout, me };

