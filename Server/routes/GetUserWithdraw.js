import express from 'express';
import { getUserWithdrawalRequests } from '../controllers/UserWithdraws.js';

const router = express.Router();

router.get('/withdrawal-requests', getUserWithdrawalRequests);

export default router;