import express from 'express';
import { registerSeller, loginSeller } from '../controllers/sellerAuthController.js';

const router = express.Router();

// POST /api/seller/register
router.post('/register', registerSeller);

// POST /api/seller/login
router.post('/login', loginSeller);

export default router;
