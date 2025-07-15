import express from 'express';
import { approveUser } from '../controllers/userApprovalController.js';

const router = express.Router();

router.put('/approveUser/:userId', approveUser);

export default router;
