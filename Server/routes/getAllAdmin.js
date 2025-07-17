import express from 'express';
import { getAllAdmins } from '../controllers/GetAllAdmin.js';

const router = express.Router();

router.get('/getAllAdmins',getAllAdmins );

export default router;