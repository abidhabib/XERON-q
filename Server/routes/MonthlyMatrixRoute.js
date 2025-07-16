// routes/dashboardRoutes.js
import express from 'express';
import { MonthData } from '../controllers/MonthlyMatrixs.js';

const router = express.Router();

router.get('/api/approvals/monthly',MonthData );

export default router;
