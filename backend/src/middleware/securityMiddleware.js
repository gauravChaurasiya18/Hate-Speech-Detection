const validator = require("validator");

const dangerousKey = (key) => key.startsWith("$") || key.includes(".");

const sanitizeValue = (value) => {
  if (Array.isArray(value)) return value.map(sanitizeValue);
  if (value && typeof value === "object") {
    return Object.entries(value).reduce((acc, [key, child]) => {
      if (!dangerousKey(key)) acc[key] = sanitizeValue(child);
      return acc;
    }, {});
  }
  if (typeof value === "string") {
    return validator.stripLow(value, true).trim();
  }
  return value;
};

const sanitizeRequest = (req, _res, next) => {
  if (req.body) req.body = sanitizeValue(req.body);
  if (req.params) req.params = sanitizeValue(req.params);
  if (req.query) req.query = sanitizeValue(req.query);
  next();
};

module.exports = sanitizeRequest;
