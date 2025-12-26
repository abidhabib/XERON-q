// routes/contactRoutes.js
import { Router } from 'express';
import { submitReview, getContactInfo } from '../controllers/ContactController.js';
import { authenticateUser } from '../utils/authMiddleware.js';

const router = Router();

// Protected routes (require login)
router.post('/review', authenticateUser, submitReview);
router.get('/contact-info', authenticateUser, getContactInfo);

export default router;