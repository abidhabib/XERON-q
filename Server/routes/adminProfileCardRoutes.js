// routes/adminProfileCardRoutes.js
import express from 'express';
import AdminProfileCardController from '../controllers/adminProfileCardController.js';
import multer from 'multer';
import getUserIdFromSession from '../utils/getSessionMiddleware.js';
import fs from 'fs';
import path from 'path';
const router = express.Router();

// Configure multer for file uploads (No changes here)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'public/uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'admin-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Public route - anyone can access the general profile info
router.get('/public/admin-profile', AdminProfileCardController.getPublicProfile);

// --- NEW: Public route - anyone with a VALID token can access the profile data ---
// Uses the validatePublicToken middleware FIRST, then getPublicProfile
router.get('/admin/public-profile/:token', AdminProfileCardController.validatePublicToken, AdminProfileCardController.getPublicProfile);

// --- NEW: Admin route - generate the encrypted public access link ---
// Requires authentication via middleware and admin check in controller
router.post('/admin/generate-public-link',  AdminProfileCardController.generatePublicLink);

// Admin routes - require authentication (via middleware) and admin privileges (checked in controller)
router.get('/admin/profile',  AdminProfileCardController.getAdminProfile);
router.put('/admin/profile',  AdminProfileCardController.updateAdminProfile);
router.post('/admin/profile/image',  upload.single('profileImage'), AdminProfileCardController.uploadImage);

export default router;