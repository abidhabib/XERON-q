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

        const [userDetails] = await queryAsync(`
            SELECT name, email 
            FROM users 
            WHERE id = ?
        `, [userId]);

        // ✅ Fetch settings once
        const [settings] = await queryAsync(`
            SELECT joining_fee, initial_percent 
            FROM settings 
            WHERE id = 1
        `);

        const joining_fee = parseFloat(settings?.joining_fee) || 0;
        const initial_percent = parseFloat(settings?.initial_percent) || 0;

        // ✅ Compute bonus amount in JS (cleaner and safer)
        const referralBonus = (joining_fee * initial_percent) / 100;

        // ✅ Apply approval and bonus
        await queryAsync(`
            UPDATE users 
            SET 
                approved = 1, 
                payment_ok = 1,
                rejected = 0,
                blocked = 0,
                approved_at = CURRENT_TIMESTAMP,
                backend_wallet = backend_wallet + ?
            WHERE id = ?
        `, [referralBonus, userId]);

        await updateBalancesAndWallet(userId);

        // --- Referrer Logic (unchanged below) ---
        const referrerResult = await queryAsync(`
            SELECT refer_by
            FROM users
            WHERE id = ?
        `, [userId]);

        const referrerId = referrerResult[0]?.refer_by;

        if (referrerId) {
            const approvedCountResult = await queryAsync(`
                SELECT COUNT(*) AS approved_count
                FROM users
                WHERE refer_by = ? AND approved = 1
            `, [referrerId]);

            const approvedCount = approvedCountResult[0]?.approved_count || 0;

            await queryAsync(`
                UPDATE users
                SET today_team = today_team + 1,
                    team = ?
                WHERE id = ?
            `, [approvedCount, referrerId]);

            const currentWeek = moment().format('YYYYWW');
            await queryAsync(`
                INSERT INTO weekly_recruits (user_id, week_id, new_members)
                VALUES (?, ?, 1)
                ON DUPLICATE KEY UPDATE new_members = new_members + 1
            `, [referrerId, currentWeek]);

            const currentYearMonth = moment().format('YYYYMM');
            await queryAsync(`
                INSERT INTO monthly_recruits (user_id, \`year_month\`, new_members)
                VALUES (?, ?, 1)
                ON DUPLICATE KEY UPDATE new_members = new_members + 1
            `, [referrerId, currentYearMonth]);

            const monthlyLevelsResult = await queryAsync(`
                SELECT month_level, required_joins
                FROM monthly_levels
                ORDER BY required_joins DESC
            `);

            let newMonthlyLevel = 0;
            for (const level of monthlyLevelsResult) {
                if (approvedCount >= level.required_joins) {
                    newMonthlyLevel = level.month_level;
                    break;
                }
            }

            await queryAsync(`
                UPDATE users
                SET monthly_salary_level = ?
                WHERE id = ?
            `, [newMonthlyLevel, referrerId]);

            const [referrerDetails] = await queryAsync(`SELECT name, monthly_salary_level FROM users WHERE id = ?`, [referrerId]);
            const oldMonthlyLevel = referrerDetails?.monthly_salary_level || 0;

            if (newMonthlyLevel > oldMonthlyLevel) {
                const monthlyUpgradeMessage = `Congratulations ${referrerDetails.name}! Based on your total team size (${approvedCount} approved referrals), you've achieved Monthly Level ${newMonthlyLevel}.`;
                await queryAsync(insertNotificationQuery, [referrerId, monthlyUpgradeMessage]);
            }

            const notificationMessage = `🎉 New referral approved!\nUser: ${userDetails.name} (${userDetails.email})\nhas joined under your referral.\nYour total team count is now ${approvedCount}.`;

            await queryAsync(insertNotificationQuery, [referrerId, notificationMessage]);
        }

        await queryAsync('COMMIT');
        res.status(200).json({
            status: 'success',
            message: 'User approved and referrer updated (including monthly data)',
            referrer_updated: !!referrerId
        });
    } catch (error) {
        console.error('Transaction error in approveUser:', error.message);
        console.error(error);
        await queryAsync('ROLLBACK');
        res.status(500).json({
            status: 'error',
            error: 'Transaction failed during user approval',
            details: error.message
        });
    }
};