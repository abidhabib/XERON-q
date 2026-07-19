import express from 'express';
import { auditSummary } from '../controllers/AuditController';

const router = express.Router();

router.get('/audit/summary', auditSummary);
export default router;