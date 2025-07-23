import express from 'express';
import {getAllApprovedUsers  } from '../controllers/ApprovedUsers.js';

const router = express.Router();

router.get('/approved-users', getAllApprovedUsers);

export default router;