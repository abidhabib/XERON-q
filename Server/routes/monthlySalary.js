// routes/monthlySalary.js
import express from 'express';
import {
    getUserMonthlySalaryStatus,
    collectMonthlySalary,
    getUserMonthlySalaryHistory
} from '../controllers/monthlySalaryController.js';

const router = express.Router();

/**
 * @route   GET /api/monthly-salary/status
 * @desc    Get the authenticated user's monthly salary eligibility status and details.
 * @access  Private (Requires authentication)
 */
router.get('/status',  getUserMonthlySalaryStatus);

/**
 * @route   POST /api/monthly-salary/collect
 * @desc    Attempt to collect the authenticated user's monthly salary if eligible.
 * @access  Private (Requires authentication)
 */
router.post('/collect',  collectMonthlySalary);

/**
 * @route   GET /api/monthly-salary/history
 * @desc    Get the authenticated user's history of monthly salary collections.
 * @access  Private (Requires authentication)
 */
router.get('/history',  getUserMonthlySalaryHistory);

export default router;