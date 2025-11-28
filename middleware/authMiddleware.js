import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

// Protect routes - verify JWT token
export const authMiddleware = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Fetch user and attach to request
      req.user = await User.findById(decoded.id).select("-password");
      
      if (!req.user) {
        return res.status(401).json({ message: "User not found" });
      }
      
      next();
    } catch (error) {
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  } else {
    return res.status(401).json({ message: "Not authorized, no token" });
  }
};

// Check if user is admin
export const isAdmin = async (req, res, next) => {
  try {
    // Make sure protect middleware has run first
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    // Check if user has admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        message: "Access denied. Admin only." 
      });
    }

    next();
  } catch (error) {
    res.status(500).json({ 
      message: "Server error", 
      error: error.message 
    });
  }
};