// routes/adminProfileCardRoutes.js
import express from 'express';
import AdminProfileCardController from '../controllers/adminProfileCardController.js';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
const router = express.Router();

// Configure multer for file uploads
const FRONTEND_UPLOADS = '/home/run-webthree/htdocs/webthree.run.place';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(FRONTEND_UPLOADS)) {
      fs.mkdirSync(FRONTEND_UPLOADS, { recursive: true });
    }
    cb(null, FRONTEND_UPLOADS);
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
router.get('/admin/public-profile/:token', AdminProfileCardController.validatePublicToken, AdminProfileCardController.getPublicProfile);

// --- NEW: Admin route - generate the encrypted public access link ---
router.post('/admin/generate-public-link',  AdminProfileCardController.generatePublicLink);

// Admin routes - require authentication (via middleware) and admin privileges (checked in controller)
router.get('/admin/profile',  AdminProfileCardController.getAdminProfile);
router.put('/admin/profile',  AdminProfileCardController.updateAdminProfile);
router.post('/admin/profile/image',  upload.single('profileImage'), AdminProfileCardController.uploadImage);

export default router;