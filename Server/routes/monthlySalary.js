// routes/monthlySalary.js
import express from 'express';
import {
  getMonthlySalaryStatus,
  applyForMonthlySalary,
  collectMonthlySalary,
  getMonthlySalaryHistory
} from '../controllers/monthlySalaryController.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.get('/status', getMonthlySalaryStatus);
router.post('/collect', collectMonthlySalary);
router.get('/history', getMonthlySalaryHistory);
router.post(
  '/apply',
  upload.fields([
    { name: 'identityFront', maxCount: 1 },
    { name: 'identityBack', maxCount: 1 },
    { name: 'selfie', maxCount: 1 }
  ]),
  applyForMonthlySalary
);
export default router;