// routes/walletRoutes.js
import { Router } from 'express';
import { getUserWallets, saveWalletAddress } from '../controllers/GetUserWalletController.js';

const router = Router();

// Public or auth-protected? → Add your auth middleware if needed
router.get('/wallets/:userId', getUserWallets);
router.put('/wallets', saveWalletAddress);

export default router;