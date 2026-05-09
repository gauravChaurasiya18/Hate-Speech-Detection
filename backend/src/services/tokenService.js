const jwt = require("jsonwebtoken");
const env = require("../config/env");

const signToken = (userId) =>
  jwt.sign({ id: userId }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn
  });

const cookieOptions = () => ({
  httpOnly: true,
  secure: env.nodeEnv === "production",
  sameSite: env.nodeEnv === "production" ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000
});

const sendAuthCookie = (res, user) => {
  const token = signToken(user._id);
  res.cookie(env.cookieName, token, cookieOptions());
  return token;
};

const clearAuthCookie = (res) => {
  res.clearCookie(env.cookieName, cookieOptions());
};

module.exports = { sendAuthCookie, clearAuthCookie };

