// routes/walletRoutes.js
import { Router } from 'express';
import { getUserWallets, saveWalletAddress } from '../controllers/GetUserWalletController.js';

const router = Router();

// Public or auth-protected? → Add your auth middleware if needed
// Both routes use the authenticated session, never the supplied user ID.
router.get('/wallets', getUserWallets);
router.get('/wallets/:userId', getUserWallets);
router.put('/wallets', saveWalletAddress);

export default router;