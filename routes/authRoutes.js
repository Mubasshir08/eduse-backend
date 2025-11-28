import express from "express";
import { registerUser, loginUser, getProfile, adminLogin } from "../controllers/authController.js";
import { authMiddleware as protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public routes
router.post("/register", registerUser);
router.post("/login", loginUser);

// admin login
router.post("/admin/login", adminLogin);

// Protected route
router.get("/profile", protect, getProfile);

export default router;
