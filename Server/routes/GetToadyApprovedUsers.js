import express from 'express';
import { getToadyApprovedUsers } from '../controllers/GetToadyApprovedUsers.js';

const router = express.Router();

router.get('/todayApproved', getToadyApprovedUsers);

export default router;