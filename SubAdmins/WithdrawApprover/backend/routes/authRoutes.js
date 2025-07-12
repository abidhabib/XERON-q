const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.get('/profile', authMiddleware.authenticate, authController.getProfile);

// Temporary route to reset password (remove in production)
router.post('/reset-password', authController.resetPassword);

module.exports = router;
