// controllers/SalaryController.js
import con from '../config/db.js';
import moment from 'moment';

export const getSalaryStatus = async (req, res) => {
  const userId = req.session?.userId;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const currentWeek = parseInt(moment().format('YYYYWW'));

  try {
    const [result] = await con.promise().query(`
      SELECT 
        u.week_credits,
        u.salary_collection_week,
        u.salary_eligibility_unlocked,
        COALESCE(wr.new_members, 0) AS recruitsThisWeek
      FROM users u
      LEFT JOIN weekly_recruits wr 
        ON wr.user_id = u.id AND wr.week_id = ?
      WHERE u.id = ?
    `, [currentWeek, userId]);

    if (!result.length) {
      return res.status(404).json({ error: 'User not found' });
    }

    const row = result[0];
    const weekCredits = parseFloat(row.week_credits) || 0;
    const alreadyCollected = row.salary_collection_week == currentWeek;
    const isPermanentlyEligible = row.salary_eligibility_unlocked === 1;
    const eligible = isPermanentlyEligible && !alreadyCollected && weekCredits > 0;

    return res.json({
      eligible,
      weekCredits,
      recruitsThisWeek: parseInt(row.recruitsThisWeek),
      alreadyCollectedThisWeek: alreadyCollected,
      permanentlyEligible: isPermanentlyEligible
    });
  } catch (error) {
    console.error('getSalaryStatus error:', error);
    return res.status(500).json({ error: 'Failed to fetch salary status' });
  }
};

export const collectSalary = async (req, res) => {
  const userId = req.session?.userId;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const currentWeek = parseInt(moment().format('YYYYWW'));
  const connection = con.promise();

  try {
    await connection.beginTransaction();

    // 🔒 Re-validate under lock — NO recruit count check needed after unlock
    const [check] = await connection.query(`
      SELECT 
        u.week_credits,
        u.salary_collection_week,
        u.salary_eligibility_unlocked
      FROM users u
      WHERE u.id = ? 
      FOR UPDATE
    `, [userId]);

    if (!check.length) {
      await connection.rollback();
      return res.status(404).json({ error: 'User not found' });
    }

    const row = check[0];
    const weekCredits = parseFloat(row.week_credits);
    const alreadyCollected = row.salary_collection_week == currentWeek;
    const isEligible = row.salary_eligibility_unlocked === 1;

    if (!isEligible || alreadyCollected || weekCredits <= 0) {
      await connection.rollback();
      return res.status(403).json({ error: 'Not eligible to collect salary' });
    }

    // ✅ Transfer funds
    await connection.query(`
      UPDATE users 
      SET 
        balance = balance + ?,
        week_credits = 0,
        salary_collection_week = ?
      WHERE id = ?
    `, [weekCredits, currentWeek, userId]);

    // ✅ Log payment
    await connection.query(`
      INSERT INTO salary_payments (user_id, amount, payment_week, created_at)
      VALUES (?, ?, ?, NOW())
    `, [userId, weekCredits, currentWeek]);

    await connection.commit();

    return res.json({
      success: true,
      message: 'Salary collected successfully',
      collectedAmount: weekCredits
    });
  } catch (error) {
    await connection.rollback();
    console.error('collectSalary error:', error);
    return res.status(500).json({ error: 'Failed to collect salary' });
  }
};