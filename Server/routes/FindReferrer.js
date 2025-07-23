import express from 'express';
import { FindReferrer } from '../controllers/FindReferrer.js';

const router = express.Router();

router.get('/approvedUserNames/:referByUserId', FindReferrer);

export default router;