import express from 'express';
import { getBep20Addresses } from '../controllers/AllAdminWallet.js';

const router = express.Router();

router.get('/bep20', getBep20Addresses);

export default router;