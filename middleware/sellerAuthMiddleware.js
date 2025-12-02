import jwt from 'jsonwebtoken';
import Seller from '../models/sellerModel.js';

export const protectSeller = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get seller from token
      req.seller = await Seller.findById(decoded.id).select('-password');

      if (!req.seller) {
        return res.status(401).json({
          success: false,
          message: 'Seller not found',
        });
      }

      // Check if seller is active
      if (!req.seller.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Your account has been deactivated',
        });
      }

      next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token failed',
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token',
    });
  }
};

export default { protectSeller };``