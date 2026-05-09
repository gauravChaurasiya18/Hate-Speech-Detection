const express = require("express");
const { authValidators, signup, login, logout, me } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/signup", authValidators.signup, signup);
router.post("/login", authValidators.login, login);
router.post("/logout", logout);
router.get("/me", protect, me);

module.exports = router;

