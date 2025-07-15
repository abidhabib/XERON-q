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

            const [currentLevelData] = await queryAsync(`
                SELECT u.level, l.weekly_recruitment
                FROM users u
                JOIN levels l ON u.level = l.level
                WHERE u.id = ?
            `, [referrerId]);

            const levelsResult = await queryAsync(`
                SELECT level, threshold 
                FROM levels 
                ORDER BY threshold DESC
            `);
            
            let newLevel = 0;
            for (const level of levelsResult) {
                if (approvedCount >= level.threshold) {
                    newLevel = level.level;
                    break;
                }
            }
            
            if (newLevel > 0) {
                await queryAsync(`
                    UPDATE users
                    SET level = ?,
                        last_level = ?,
                        level_updated = 1
                    WHERE id = ?
                      AND (level <> ? OR level IS NULL)
                `, [newLevel, currentLevelData?.level || 0, referrerId, newLevel]);

                if (newLevel > currentLevelData?.level) {
                    const upgradeMessage = `Congratulations! You've been promoted to Level ${newLevel}`;
                    await queryAsync(insertNotificationQuery, [referrerId, upgradeMessage]);
                }
            }

            if (currentLevelData) {
                const [recruitData] = await queryAsync(`
                    SELECT new_members 
                    FROM weekly_recruits
                    WHERE user_id = ? AND week_id = ?
                `, [referrerId, currentWeek]);

                if (recruitData && currentLevelData.weekly_recruitment > 0 &&
                    recruitData.new_members >= currentLevelData.weekly_recruitment) {
                    const recruitMessage = `You've met this week's recruitment goal (${currentLevelData.weekly_recruitment} new members)!`;
                    await queryAsync(insertNotificationQuery, [referrerId, recruitMessage]);
                }
            }

            const notificationMessage = 'Awesome! Someone has successfully joined your team.';
            await queryAsync(insertNotificationQuery, [referrerId, notificationMessage]);
        }

        await queryAsync('COMMIT');
        res.status(200).json({ 
            status: 'success', 
            message: 'User approved and referrer updated',
            referrer_updated: !!referrerId
        });
    } catch (error) {
        console.error('Transaction error:', error.message);
        await queryAsync('ROLLBACK');
        res.status(500).json({ 
            status: 'error', 
            error: 'Transaction failed',
            details: error.message
        });
    }
};
