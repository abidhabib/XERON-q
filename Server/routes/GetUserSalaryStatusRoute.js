import express from 'express';
import { getUserSalaryStatus } from '../controllers/GetUserSalaryStatus.js';

const router = express.Router();



router.get('/salary-status', getUserSalaryStatus);

export default router;