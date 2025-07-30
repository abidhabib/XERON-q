// controllers/monthlySalaryController.js
import { queryAsync } from "../utils/queryAsync.js"; // Adjust path as needed
import moment from 'moment';

/**
 * Helper function to get the full month name from its 0-indexed number (0-11).
 * @param {number} monthIndex - The month index (0 for January, 11 for December).
 * @returns {string} The full month name.
 */
function getMonthName(monthIndex) {
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[monthIndex];
}

/**
 * GET /api/monthly-salary/status
 * Fetches the authenticated user's monthly salary eligibility status.
 */
export const getUserMonthlySalaryStatus = async (req, res) => {
    // User ID is obtained from the authentication middleware
    const userId = req.session.userId;
    console.log("User ID:", userId);
    

    // Basic check if user ID is available
    if (!userId) {
        return res.status(401).json({ status: 'error', message: 'Authentication required.' });
    }

    const currentDate = moment(); // Current date/time
    const currentYearMonth = currentDate.format('YYYYMM'); // e.g., 202507
    const todayDate = currentDate.date(); // Day of the month (1-31)

    try {
        // 1. Get user's current monthly level and related data from monthly_levels
        const [userLevelData] = await queryAsync(`
            SELECT 
                u.id, 
                u.monthly_salary_level, 
                u.balance AS current_balance,
                ml.salary AS level_salary,
                ml.salary_date AS designated_salary_day,
                ml.required_joins
            FROM users u
            LEFT JOIN monthly_levels ml ON u.monthly_salary_level = ml.month_level
            WHERE u.id = ?
        `, [userId]);

        if (!userLevelData) {
            return res.status(404).json({ status: 'error', message: 'User not found.' });
        }

        // Handle case where user has no monthly level or level is not configured
        if (!userLevelData.monthly_salary_level || userLevelData.monthly_salary_level <= 0) {
             return res.json({
                status: 'success',
                data: { // <-- Ensure 'data' key is present
                    isEligible: false,
                    reason: 'You have not achieved a monthly salary level yet.',
                    currentLevel: userLevelData.monthly_salary_level || 0,
                    currentBalance: parseFloat(userLevelData.current_balance) || 0,
                    levelSalary: 0,
                    designatedSalaryDay: null,
                    requiredJoins: 0,
                    recruitsThisMonth: 0,
                    currentMonthName: getMonthName(currentDate.month()), // moment months are 0-indexed
                    todayDate: todayDate,
                    currentYearMonth: currentYearMonth
                }
            });
        }

        if (userLevelData.level_salary === null || userLevelData.designated_salary_day === null) {
             // Level exists in user table but not configured in monthly_levels
             return res.json({
                status: 'success',
                data: { // <-- Ensure 'data' key is present
                    isEligible: false,
                    reason: 'Monthly level configuration not found.',
                    currentLevel: userLevelData.monthly_salary_level,
                    currentBalance: parseFloat(userLevelData.current_balance) || 0,
                    levelSalary: 0,
                    designatedSalaryDay: null,
                    requiredJoins: userLevelData.required_joins || 0,
                    recruitsThisMonth: 0,
                    currentMonthName: getMonthName(currentDate.month()),
                    todayDate: todayDate,
                    currentYearMonth: currentYearMonth
                }
            });
        }

        // 2. Get user's recruits for the current month from monthly_recruits
       const [recruitData] = await queryAsync(`
    SELECT new_members
    FROM monthly_recruits
    WHERE user_id = ? AND \`year_month\` = ? 
`, [userId, currentYearMonth]);
        const recruitsThisMonth = recruitData?.new_members || 0;

        // 3. Check if user has already collected salary this month from monthly_salary_payments
        const [lastPayment] = await queryAsync(`
            SELECT id, payment_year_month 
            FROM monthly_salary_payments 
            WHERE user_id = ? 
            ORDER BY created_at DESC 
            LIMIT 1
        `, [userId]);

        const hasCollectedThisMonth = lastPayment && lastPayment.payment_year_month === currentYearMonth;

        // --- Eligibility Logic ---
        let isEligible = false;
        let reason = "";

        if (hasCollectedThisMonth) {
            isEligible = false;
            reason = "You have already collected your salary for this month.";
        } else if (todayDate < userLevelData.designated_salary_day) {
            isEligible = false;
            reason = `Salary collection starts on day ${userLevelData.designated_salary_day} of the month.`;
        } else if (recruitsThisMonth < userLevelData.required_joins) {
             isEligible = false;
             reason = `You need ${userLevelData.required_joins - recruitsThisMonth} more recruits this month.`;
        } else {
            isEligible = true;
            reason = "You are eligible to collect your monthly salary.";
        }
        // --- End Eligibility Logic ---

        res.json({
            status: 'success',
            data: { // <-- Ensure 'data' key is present
                isEligible,
                reason,
                currentLevel: userLevelData.monthly_salary_level,
                currentBalance: parseFloat(userLevelData.current_balance) || 0,
                levelSalary: parseFloat(userLevelData.level_salary) || 0,
                designatedSalaryDay: userLevelData.designated_salary_day,
                requiredJoins: userLevelData.required_joins,
                recruitsThisMonth: recruitsThisMonth,
                currentMonthName: getMonthName(currentDate.month()),
                todayDate: todayDate,
                currentYearMonth: currentYearMonth,
                hasCollectedThisMonth // Added for clarity if needed by frontend
            }
        });
    } catch (error) {
        console.error('Monthly Salary Status Error (User ID:', userId, '):', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch salary status. Please try again later.' });
    }
};

/**
 * POST /api/monthly-salary/collect
 * Collects the authenticated user's monthly salary if eligible.
 */
export const collectMonthlySalary = async (req, res) => {
    const userId = req.session.userId;

    if (!userId) {
        return res.status(401).json({ status: 'error', message: 'Authentication required.' });
    }

    const currentDate = moment();
    const currentYearMonth = currentDate.format('YYYYMM');
    const todayDate = currentDate.date();
    const paymentDateStr = currentDate.format('YYYY-MM-DD'); // Date of collection

    try {
        await queryAsync('START TRANSACTION');

        // 1. Re-fetch status data within transaction for consistency and locking
        const [userLevelData] = await queryAsync(`
            SELECT 
                u.id, 
                u.monthly_salary_level, 
                u.balance AS current_balance,
                ml.salary AS level_salary,
                ml.salary_date AS designated_salary_day,
                ml.required_joins
            FROM users u
            LEFT JOIN monthly_levels ml ON u.monthly_salary_level = ml.month_level
            WHERE u.id = ?
            FOR UPDATE 
        `, [userId]);

        if (!userLevelData) {
             await queryAsync('ROLLBACK');
            return res.status(404).json({ status: 'error', message: 'User not found.' });
        }

        // Validate user has a valid, configured level
        if (!userLevelData.monthly_salary_level || userLevelData.monthly_salary_level <= 0 ||
            userLevelData.level_salary === null || userLevelData.designated_salary_day === null) {
             await queryAsync('ROLLBACK');
             return res.status(400).json({ status: 'error', message: 'You are not eligible for a monthly salary at this time.' });
        }

        // 2. Re-fetch recruit data within transaction and lock if exists
        const [recruitData] = await queryAsync(`
            SELECT new_members 
  FROM monthly_recruits 
  WHERE user_id = ? AND \`year_month\` = ?
        `, [userId, currentYearMonth]);

        const recruitsThisMonth = recruitData?.new_members || 0;

        // 3. Re-check last payment within transaction and lock if exists
        const [lastPayment] = await queryAsync(`
            SELECT id, payment_year_month 
            FROM monthly_salary_payments 
            WHERE user_id = ? 
            ORDER BY created_at DESC 
            LIMIT 1
            FOR UPDATE 
        `, [userId]);

        const hasCollectedThisMonth = lastPayment && lastPayment.payment_year_month === currentYearMonth;

        // --- Strict Re-check Eligibility within locked context ---
        if (hasCollectedThisMonth) {
            await queryAsync('ROLLBACK');
            return res.status(400).json({ status: 'error', message: 'You have already collected your salary for this month.' });
        }

        if (todayDate < userLevelData.designated_salary_day) {
            await queryAsync('ROLLBACK');
            // Provide specific day info in error message
            const suffix = userLevelData.designated_salary_day === 1 ? 'st' :
                           userLevelData.designated_salary_day === 2 ? 'nd' :
                           userLevelData.designated_salary_day === 3 ? 'rd' : 'th';
            return res.status(400).json({
                status: 'error',
                message: `It's not the salary collection day yet. Your salary day is the ${userLevelData.designated_salary_day}${suffix} of the month.`
            });
        }

        if (recruitsThisMonth < userLevelData.required_joins) {
             await queryAsync('ROLLBACK');
             const needed = userLevelData.required_joins - recruitsThisMonth;
             return res.status(400).json({
                 status: 'error',
                 message: `You do not meet the recruitment requirement. You need ${needed} more recruit${needed > 1 ? 's' : ''} this month.`
             });
        }
        // --- End Strict Re-check ---

        // --- Process Payment ---
        const salaryAmount = parseFloat(userLevelData.level_salary);
        const newBalance = parseFloat(userLevelData.current_balance) + salaryAmount;

        // 4. Update user's balance in the users table
        await queryAsync(`
            UPDATE users 
            SET balance = ?
            WHERE id = ?
        `, [newBalance, userId]);

        // 5. Record the payment in the monthly_salary_payments table
        await queryAsync(`
            INSERT INTO monthly_salary_payments 
            (user_id, level, amount, payment_year_month, payment_date)
            VALUES (?, ?, ?, ?, ?)
        `, [userId, userLevelData.monthly_salary_level, salaryAmount, currentYearMonth, paymentDateStr]);

        await queryAsync('COMMIT');

        res.json({
            status: 'success',
            message: `Monthly salary of $${salaryAmount.toFixed(2)} collected successfully!`,
            newBalance: parseFloat(newBalance.toFixed(2)) // Ensure precision in response
        });
    } catch (error) {
        await queryAsync('ROLLBACK');
        console.error('Monthly Salary Collection Error (User ID:', userId, '):', error);
        // Generic error message for user
        res.status(500).json({ status: 'error', message: 'Failed to collect salary due to a server error. Please try again later.' });
    }
};

/**
 * GET /api/monthly-salary/history
 * Fetches the authenticated user's monthly salary payment history.
 */
export const getUserMonthlySalaryHistory = async (req, res) => {
    const userId = req.session.userId;
console.log(userId);

    if (!userId) {
        return res.status(401).json({ status: 'error', message: 'Authentication required.' });
    }

    try {
        // Fetch payment history, ordered by most recent first
        const history = await queryAsync(`
            SELECT 
                id,
                level,
                amount,
                payment_year_month,
                payment_date, 
                created_at 
            FROM monthly_salary_payments
            WHERE user_id = ?
            ORDER BY created_at DESC
            LIMIT 50
        `, [userId]);


        res.json({
            status: 'success',
            history // Send the raw history data
        });
    } catch (error) {
        console.error('Monthly Salary History Error (User ID:', userId, '):', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch salary history. Please try again later.' });
    }
};
