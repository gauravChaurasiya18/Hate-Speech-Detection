const axios = require("axios");
const env = require("../config/env");
const ApiError = require("../utils/ApiError");

const client = axios.create({
  baseURL: env.mlServiceUrl,
  timeout: 120000
});

const analyzeText = async (text, options = {}) => {
  try {
    const { data } = await client.post("/predict", {
      text,
      explain: options.explain !== false,
      deep_explain: options.deepExplain === true
    });
    return data;
  } catch (error) {
    const message = error.response?.data?.error || error.message || "ML service unavailable";
    throw new ApiError(502, `ML service error: ${message}`);
  }
};

const health = async () => {
  const { data } = await client.get("/health");
  return data;
};

module.exports = { analyzeText, health };
