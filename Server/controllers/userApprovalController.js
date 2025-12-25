// controllers/UserController.js
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

    // ✅ Fetch ALL needed settings in one query (including monthly requirement)
    const [settings] = await queryAsync(`
      SELECT 
        joining_fee, 
        initial_percent,
        week_salary_person_require,
        month_salary_person_require
      FROM settings 
      WHERE id = 1
    `);

    const joining_fee = parseFloat(settings?.joining_fee) || 0;
    const initial_percent = parseFloat(settings?.initial_percent) || 0;
    const requiredForWeeklySalary = parseInt(settings?.week_salary_person_require) || 0;
    const requiredForMonthlySalary = parseInt(settings?.month_salary_person_require) || 0;

    // ✅ Welcome bonus for the new user
    const referralBonus = (joining_fee * initial_percent) / 100;
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

    // --- Referrer Logic ---
    const referrerResult = await queryAsync(`
      SELECT refer_by
      FROM users
      WHERE id = ?
    `, [userId]);

    const referrerId = referrerResult[0]?.refer_by;

    if (referrerId) {
      // Update total team count
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

      // ✅ WEEKLY SALARY: Track weekly recruits & unlock
      const currentWeek = moment().format('YYYYWW');
      await queryAsync(`
        INSERT INTO weekly_recruits (user_id, week_id, new_members)
        VALUES (?, ?, 1)
        ON DUPLICATE KEY UPDATE new_members = new_members + 1
      `, [referrerId, currentWeek]);

      if (requiredForWeeklySalary > 0) {
        const [weekRecruitResult] = await queryAsync(`
          SELECT new_members 
          FROM weekly_recruits 
          WHERE user_id = ? AND week_id = ?
        `, [referrerId, currentWeek]);

        const currentWeekRecruits = weekRecruitResult?.new_members || 0;

        if (currentWeekRecruits >= requiredForWeeklySalary) {
          await queryAsync(`
            UPDATE users 
            SET salary_eligibility_unlocked = 1 
            WHERE id = ? AND salary_eligibility_unlocked = 0
          `, [referrerId]);

          if (currentWeekRecruits === requiredForWeeklySalary) {
            const unlockMessage = `🌟 Congratulations! You’ve unlocked lifetime weekly salary by recruiting ${requiredForWeeklySalary}+ members this week.`;
            await queryAsync(insertNotificationQuery, [referrerId, unlockMessage]);
          }
        }
      }

      // ✅ MONTHLY SALARY: Window-based logic (NEW)
      if (requiredForMonthlySalary > 0) {
        const [referrerMeta] = await queryAsync(`
          SELECT approved_at FROM users WHERE id = ?
        `, [referrerId]);

        if (referrerMeta?.approved_at) {
          const approvalDate = new Date(referrerMeta.approved_at);
          const now = new Date();

          const monthsSinceApproval = (
            (now.getFullYear() - approvalDate.getFullYear()) * 12 +
            now.getMonth() - approvalDate.getMonth()
          );

          let currentWindowStart = new Date(approvalDate);
          currentWindowStart.setMonth(approvalDate.getMonth() + monthsSinceApproval);

          // Handle day overflow (e.g., Jan 31 → Feb 28)
          if (currentWindowStart > now) {
            currentWindowStart.setMonth(currentWindowStart.getMonth() - 1);
          }

          const windowStartStr = currentWindowStart.toISOString().split('T')[0];

          // Increment recruit count for this window
          await queryAsync(`
            INSERT INTO window_recruits (user_id, window_start, recruit_count)
            VALUES (?, ?, 1)
            ON DUPLICATE KEY UPDATE recruit_count = recruit_count + 1
          `, [referrerId, windowStartStr]);

          // Check if threshold met in this window
          const [windowCount] = await queryAsync(`
            SELECT recruit_count FROM window_recruits
            WHERE user_id = ? AND window_start = ?
          `, [referrerId, windowStartStr]);

          const currentCount = windowCount?.recruit_count || 1;

          // Check if already unlocked
          const [unlockCheck] = await queryAsync(`
            SELECT monthly_salary_unlocked FROM users WHERE id = ?
          `, [referrerId]);

          if (!unlockCheck?.monthly_salary_unlocked && currentCount >= requiredForMonthlySalary) {
            await queryAsync(`
              UPDATE users SET monthly_salary_unlocked = 1 WHERE id = ?
            `, [referrerId]);

            const unlockMsg = `🎉 Congratulations! You’ve unlocked monthly salary eligibility by recruiting ${requiredForMonthlySalary}+ members in your current window.`;
            await queryAsync(insertNotificationQuery, [referrerId, unlockMsg]);
          }
        }
      }

      // General referral notification
      const notificationMessage = `🎉 New referral approved!\nUser: ${userDetails.name} (${userDetails.email})\nhas joined under your referral.\nYour total team count is now ${approvedCount}.`;
      await queryAsync(insertNotificationQuery, [referrerId, notificationMessage]);
    }

    await queryAsync('COMMIT');
    res.status(200).json({
      status: 'success',
      message: 'User approved and referrer updated',
      referrer_updated: !!referrerId
    });
  } catch (error) {
    console.error('Transaction error in approveUser:', error.message);
    await queryAsync('ROLLBACK');
    res.status(500).json({
      status: 'error',
      error: 'Transaction failed during user approval',
      details: error.message
    });
  }
};