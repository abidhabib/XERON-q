import express from 'express';
import {userLogin} from '../controllers/UserLoginController.js';



const router = express.Router();

router.post('/login', userLogin);

export default router;
