// routes/salaryRoutes.js
import { Router } from 'express';
import { getSalaryStatus, collectSalary } from '../controllers/SalaryController.js';
import { authenticateUser } from '../utils/authMiddleware.js';
const router = Router();

// Apply auth middleware to both routes
router.get('/salary/status', authenticateUser, getSalaryStatus);
router.post('/salary/collect', authenticateUser, collectSalary);

export default router;