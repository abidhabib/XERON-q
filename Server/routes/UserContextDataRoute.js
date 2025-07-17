import express from 'express';
import { getUserData } from '../controllers/UserContextData.js';

const router = express.Router();

router.get('/getUserData', getUserData);

export default router;