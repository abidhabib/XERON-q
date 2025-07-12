const express = require('express');
const router = express.Router();
const withdrawalController = require('../controllers/withdrawalController');
const authMiddleware = require('../middlewares/authMiddleware');

// Get all pending withdrawal requests
router.get('/withdrawal-requests', 
  authMiddleware.authenticate,
  withdrawalController.getAllWithdrawalRequests
);

// Approve a withdrawal request
router.post('/withdrawal-requests/approve',
  authMiddleware.authenticate,
  withdrawalController.approveWithdrawal
);

// Reject a withdrawal request
router.post('/withdrawal-requests/reject',
  authMiddleware.authenticate,
  withdrawalController.rejectWithdrawal
);

// Delete a withdrawal request
router.post(
  '/withdrawal-requests/delete',
  authMiddleware.authenticate,
  withdrawalController.deleteWithdrawal
);

module.exports = router;