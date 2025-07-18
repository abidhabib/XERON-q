import express from 'express';
import { getPendingForApproveUsers } from '../controllers/PendingForApproveUser.js';

const router = express.Router();

router.get('/EasypaisaUsers', getPendingForApproveUsers);

export default router;
