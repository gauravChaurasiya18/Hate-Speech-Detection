const jwt = require("jsonwebtoken");
const User = require("../models/User");
const env = require("../config/env");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");

const readToken = (req) => {
  const bearer = req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.split(" ")[1]
    : null;
  return req.cookies?.[env.cookieName] || bearer;
};

const protect = asyncHandler(async (req, _res, next) => {
  const token = readToken(req);

  if (!token) throw new ApiError(401, "Authentication required");

  const decoded = jwt.verify(token, env.jwtSecret);
  const user = await User.findById(decoded.id).select("-passwordHash");
  if (!user) throw new ApiError(401, "User no longer exists");

  req.user = user;
  next();
});

const optionalProtect = asyncHandler(async (req, _res, next) => {
  const token = readToken(req);

  if (!token) return next();

  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    const user = await User.findById(decoded.id).select("-passwordHash");
    if (user) req.user = user;
  } catch {
    req.user = null;
  }

  next();
});

module.exports = { protect, optionalProtect };
