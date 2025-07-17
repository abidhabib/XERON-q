import express from 'express';
import { getBep20Account } from '../controllers/AdminWalletAddress.js';

const router = express.Router();

router.get('/bep20active', getBep20Account);

export default router;