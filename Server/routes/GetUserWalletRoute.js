import express from 'express';
import { getUserWallet } from '../controllers/GetUserWalletController.js';

const router = express.Router();



router.get('/getCryptoAddress/:userId', getUserWallet);



export default router;  