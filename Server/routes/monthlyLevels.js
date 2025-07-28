// routes/monthlyLevels.js
import express from 'express';
import {
    getMonthlyLevels,
    createMonthlyLevel,
    updateMonthlyLevel,
    deleteMonthlyLevel
} from '../controllers/monthlyLevelsController.js'; // Adjust path as needed

const router = express.Router();

/**
 * @route   GET /api/monthly-levels
 * @desc    Get all monthly levels
 * @access  Admin
 */
router.get('/', getMonthlyLevels);

/**
 * @route   POST /api/monthly-levels
 * @desc    Create a new monthly level
 * @access  Admin
 */
router.post('/', createMonthlyLevel);

/**
 * @route   PUT /api/monthly-levels/:id
 * @desc    Update an existing monthly level by ID
 * @access  Admin
 */
router.put('/:id', updateMonthlyLevel);

/**
 * @route   DELETE /api/monthly-levels/:id
 * @desc    Delete a monthly level by ID
 * @access  Admin
 */
router.delete('/:id', deleteMonthlyLevel);

export default router;