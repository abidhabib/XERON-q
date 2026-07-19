import express from 'express';
import { registerUser } from '../controllers/RegisterUserController.js';
import { registerLimiter } from '../utils/RateLimiter.js';
const router = express.Router();    



router.post('/register', registerUser,registerLimiter);

export default router;