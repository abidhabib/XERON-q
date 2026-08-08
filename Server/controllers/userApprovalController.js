// controllers/UserController.js
import { updateBalancesAndWallet } from '../utils/updateBalancesAndWallet.js';
import { queryAsync } from '../utils/queryAsync.js';

const insertNotificationQuery = `
  INSERT INTO notifications (user_id, msg, created_at)
  VALUES (?, ?, NOW())
`;

const assignLevelByActualTeam = async (userId) => {
  await queryAsync(`
    UPDATE users u
    JOIN (
      SELECT l.level
      FROM levels l
      WHERE l.threshold <= (
        SELECT COUNT(*)
        FROM users
        WHERE refer_by = ? AND approved = 1
      )
      ORDER BY l.threshold DESC
      LIMIT 1
    ) AS matched_level
    SET u.level = matched_level.level
    WHERE u.id = ?
  `, [userId, userId]);
};

export const approveUser = async (req, res) => {
  const userId = req.params.userId;

  if (!userId) {
    return res.status(400).json({
      status: 'error',
      message: 'User ID is required'
    });
  }

  try {
    await queryAsync('START TRANSACTION');

    const [userDetails] = await queryAsync(`
      SELECT id, name
      FROM users
      WHERE id = ?
    `, [userId]);

    const [settings] = await queryAsync(`
      SELECT
        joining_fee,
        web_backend_fee_percent,
        initial_percent,
        month_salary_person_require
      FROM settings
      WHERE id = 1
    `);

    const joining_fee = Number(settings?.joining_fee) || 0;
    const webBackendFeePercent = Number(settings?.web_backend_fee_percent) || 0;
    const initial_percent = Number(settings?.initial_percent) || 0;
    const requiredForMonthlySalary = Number(settings?.month_salary_person_require) || 0;

    // Calculate fees
    const referralBonus = (joining_fee * initial_percent) / 100;
    const webBackendFeeAmount = (joining_fee * webBackendFeePercent) / 100;

    // Approve user
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

    // Update backend earnings
    if (webBackendFeeAmount > 0) {
      await queryAsync(`
        UPDATE settings
        SET web_backend_earnings = web_backend_earnings + ?
        WHERE id = 1
      `, [webBackendFeeAmount]);
    }

    await updateBalancesAndWallet(userId);

    // Assign level to newly approved user
    await assignLevelByActualTeam(userId);

    // Referrer logic
    const referrerResult = await queryAsync(`
      SELECT refer_by
      FROM users
      WHERE id = ?
    `, [userId]);

    const referrerId = referrerResult[0]?.refer_by;

    if (referrerId) {

      // Get actual approved referral count
      const approvedCountResult = await queryAsync(`
        SELECT COUNT(*) AS approved_count
        FROM users
        WHERE refer_by = ? AND approved = 1
      `, [referrerId]);

      const approvedCount = approvedCountResult[0]?.approved_count || 0;

      // Sync team count
      await queryAsync(`
        UPDATE users
        SET
          today_team = today_team + 1,
          team = ?
        WHERE id = ?
      `, [approvedCount, referrerId]);

      // Update level
      await assignLevelByActualTeam(referrerId);

      // Monthly salary logic
      if (requiredForMonthlySalary > 0) {

        const [referrerMeta] = await queryAsync(`
          SELECT approved_at
          FROM users
          WHERE id = ?
        `, [referrerId]);

        if (referrerMeta?.approved_at) {

          const approvalDate = new Date(referrerMeta.approved_at);
          const now = new Date();

          const monthsSinceApproval =
            (now.getFullYear() - approvalDate.getFullYear()) * 12 +
            (now.getMonth() - approvalDate.getMonth());

          let currentWindowStart = new Date(approvalDate);
          currentWindowStart.setMonth(
            approvalDate.getMonth() + monthsSinceApproval
          );

          if (currentWindowStart > now) {
            currentWindowStart.setMonth(currentWindowStart.getMonth() - 1);
          }

          const windowStartStr = currentWindowStart
            .toISOString()
            .split('T')[0];

          await queryAsync(`
            INSERT INTO window_recruits
              (user_id, window_start, recruit_count)
            VALUES (?, ?, 1)
            ON DUPLICATE KEY UPDATE
              recruit_count = recruit_count + 1
          `, [referrerId, windowStartStr]);

          const [windowCount] = await queryAsync(`
            SELECT recruit_count
            FROM window_recruits
            WHERE user_id = ?
              AND window_start = ?
          `, [referrerId, windowStartStr]);

          const currentCount = windowCount?.recruit_count || 1;

          const [unlockCheck] = await queryAsync(`
            SELECT monthly_salary_unlocked
            FROM users
            WHERE id = ?
          `, [referrerId]);

          if (
            !unlockCheck?.monthly_salary_unlocked &&
            currentCount >= requiredForMonthlySalary
          ) {

            await queryAsync(`
              UPDATE users
              SET monthly_salary_unlocked = 1
              WHERE id = ?
            `, [referrerId]);

            const unlockMsg =
              `Congratulations! You've unlocked monthly salary eligibility by recruiting ${requiredForMonthlySalary}+ members in your current window.`;

            await queryAsync(insertNotificationQuery, [
              referrerId,
              unlockMsg
            ]);
          }
        }
      }

      // Referral notification
      const notificationMessage = `Referral approved.

${userDetails.name} (ID: ${userDetails.id}) has joined your team.

Total team members: ${approvedCount}.`;

      await queryAsync(insertNotificationQuery, [
        referrerId,
        notificationMessage
      ]);
    }

    await queryAsync('COMMIT');

    return res.status(200).json({
      status: 'success',
      message: 'User approved and referrer updated',
      referrer_updated: !!referrerId,
      web_backend_fee_collected: webBackendFeeAmount
    });

  } catch (error) {

    console.error('Transaction error in approveUser:', error);

    await queryAsync('ROLLBACK');

    return res.status(500).json({
      status: 'error',
      error: 'Transaction failed during user approval',
      details: error.message
    });
  }
};