// controllers/approveUser.js (or wherever your approveUser function is)
import { updateBalancesAndWallet } from '../utils/updateBalancesAndWallet.js';
import { queryAsync } from '../utils/queryAsync.js';
import moment from 'moment';

const insertNotificationQuery = `
  INSERT INTO notifications (user_id, msg, created_at) VALUES (?, ?, NOW())
`;

export const approveUser = async (req, res) => {
    const userId = req.params.userId;

    if (!userId) {
        return res.status(400).json({ status: 'error', message: 'User ID is required' });
    }

    try {
        await queryAsync('START TRANSACTION');

        // --- Approve the new user ---
        const [userDetails] = await queryAsync(`
            SELECT name, email 
            FROM users 
            WHERE id = ?
        `, [userId]);

        await queryAsync(`
            UPDATE users 
            SET 
                approved = 1, 
                payment_ok = 1,
                rejected = 0,
                blocked = 0,
                approved_at = CURRENT_TIMESTAMP,
                backend_wallet = backend_wallet + (
                    SELECT joining_fee * (SELECT initial_percent FROM initial_fee WHERE id = 1) / 100
                    FROM joining_fee
                    WHERE id = 1
                )
            WHERE id = ?
        `, [userId]);

        await updateBalancesAndWallet(userId);
        // --- End Approve User ---

        const referrerResult = await queryAsync(`
            SELECT refer_by
            FROM users
            WHERE id = ?
        `, [userId]);

        const referrerId = referrerResult[0]?.refer_by;

        if (referrerId) {
            // --- Update Referrer's Team Count (Approved Referrals) ---
            const approvedCountResult = await queryAsync(`
                SELECT COUNT(*) AS approved_count
                FROM users
                WHERE refer_by = ? AND approved = 1
            `, [referrerId]);

            const approvedCount = approvedCountResult[0]?.approved_count || 0;

            await queryAsync(`
                UPDATE users
                SET today_team = today_team + 1,
                    team = ? -- This is the total approved count
                WHERE id = ?
            `, [approvedCount, referrerId]);
            // --- End Update Referrer's Team Count ---


            // --- Weekly Recruitment Tracking (Existing Logic) ---
            const currentWeek = moment().format('YYYYWW');
            await queryAsync(`
                INSERT INTO weekly_recruits (user_id, week_id, new_members)
                VALUES (?, ?, 1)
                ON DUPLICATE KEY UPDATE new_members = new_members + 1
            `, [referrerId, currentWeek]);
            // --- End Weekly Recruitment Tracking ---


            // --- Monthly Recruitment Tracking & Level Update (New Logic) ---
            const currentYearMonth = moment().format('YYYYMM'); // e.g., 202407

            // 1. Increment the monthly recruit count for the referrer for the CURRENT month
            await queryAsync(`
                INSERT INTO monthly_recruits (user_id, \`year_month\`, new_members)
                VALUES (?, ?, 1)
                ON DUPLICATE KEY UPDATE new_members = new_members + 1
            `, [referrerId, currentYearMonth]);

            // 2. Fetch monthly levels configuration to determine the new monthly level
            const monthlyLevelsResult = await queryAsync(`
                SELECT month_level, required_joins
                FROM monthly_levels
                ORDER BY required_joins DESC -- Order descending to find the highest applicable level first
            `);

            let newMonthlyLevel = 0;
            for (const level of monthlyLevelsResult) {
                if (approvedCount >= level.required_joins) {
                    newMonthlyLevel = level.month_level;
                    break; // Stop at the first (highest) matching level
                }
            }

            // 4. Update the referrer's monthly_salary_level in the users table dynamically
            // This ensures it always reflects the level based on their total team size (approvedCount)
            await queryAsync(`
                UPDATE users
                SET monthly_salary_level = ?
                WHERE id = ?
            `, [newMonthlyLevel, referrerId]);

            // Optional: Fetch referrer details for potential monthly level notification
            // (Requires fetching the old level first for comparison)
            
            const [referrerDetails] = await queryAsync(`SELECT name, monthly_salary_level FROM users WHERE id = ?`, [referrerId]);
            const oldMonthlyLevel = referrerDetails?.monthly_salary_level || 0;

            if (newMonthlyLevel > oldMonthlyLevel) {
                 const monthlyUpgradeMessage = `Congratulations ${referrerDetails.name}! Based on your total team size (${approvedCount} approved referrals), you've achieved Monthly Level ${newMonthlyLevel}.`;
                 await queryAsync(insertNotificationQuery, [referrerId, monthlyUpgradeMessage]);
            }
            
            // --- End Monthly Recruitment Tracking & Level Update ---


            // --- Existing Weekly Level & Notification Logic (if still needed) ---
            // You can keep the existing weekly recruit update, level update, and notification logic here
            // if those features are still active.

            // Example: Basic referral notification (you can enhance this)
            const notificationMessage = `🎉 New referral approved!
            User: ${userDetails.name} (${userDetails.email})
            has joined under your referral.
            Your total team count is now ${approvedCount}.`;

            await queryAsync(insertNotificationQuery, [referrerId, notificationMessage]);
            // --- End Existing Logic ---
        }

        await queryAsync('COMMIT');
        res.status(200).json({
            status: 'success',
            message: 'User approved and referrer updated (including monthly data)',
            referrer_updated: !!referrerId
        });
    } catch (error) {
        console.error('Transaction error in approveUser:', error.message);
        console.error(error); // Log full error for debugging
        await queryAsync('ROLLBACK');
        res.status(500).json({
            status: 'error',
            error: 'Transaction failed during user approval',
            details: error.message
        });
    }
};
