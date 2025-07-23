import express from 'express';
import {getUserTaskStatus} from '../controllers/GetUserTaskStatus.js';
const router=express.Router();
router.get('/getUserTaskStatus/:userId',getUserTaskStatus);
export default router;
 