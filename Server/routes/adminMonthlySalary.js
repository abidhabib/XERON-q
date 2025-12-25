// routes/adminMonthlySalary.js
import express from 'express';
import {
  getPendingApplications,
  approveApplication,
  rejectApplication,
  getApplicationDetails
} from '../controllers/adminMonthlySalaryController.js';

const router = express.Router();

router.get('/applications', getPendingApplications); // ?status=pending|approved|rejected
router.get('/application/:id', getApplicationDetails);
router.patch('/application/:id/approve', approveApplication);
router.patch('/application/:id/reject', rejectApplication);

export default router;