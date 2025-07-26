const { pool } = require('../config/db');

exports.getAllWithdrawalRequests = async (req, res) => {
  try {
    const sql = `
      SELECT wr.id, wr.user_id, wr.amount,  wr.bank_name,  
        wr.account_number, wr.approved, wr.team, wr.total_withdrawn, u.name AS user_name, u.balance
      FROM withdrawal_requests wr
      JOIN users u ON wr.user_id = u.id
      WHERE wr.approved = 'pending' AND wr.reject = 0
    `;

    const [results] = await pool.query(sql);
    
    const mappedResults = results.map(item => ({
      id: item.id,
      user_id: item.user_id,
      amount: item.amount,
      bank_name: item.bank_name,
      account_number: item.account_number,
      approved: item.approved === 1,
      team: item.team,
      total_withdrawn: item.total_withdrawn,
      user_name: item.user_name,
      balance: item.balance
    }));
    
    res.json(mappedResults);
  } catch (error) {
    console.error('Error fetching withdrawal requests:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.approveWithdrawal = async (req, res) => {
  const { userId, requestId, amount } = req.body;
  const approveBy = req.user.username;
  console.log(userId, requestId, amount, approveBy);

  if (!userId || !requestId || !amount || !approveBy) {
    return res.status(400).json({ error: 'User ID, request ID, and amount are required' });
  }

  try {
    await pool.query('START TRANSACTION');

    // Update withdrawal request
    const updateWithdrawalSql = `
      UPDATE withdrawal_requests 
      SET approved = 'approved', reject = 0, approved_by = ?, approved_time = CURRENT_TIMESTAMP 
      WHERE id = ? AND user_id = ? AND (approved = 'pending' OR approved = 'rejected')
    `;
    const [updateResult] = await pool.query(updateWithdrawalSql,  [approveBy, requestId, userId]);
    console.log(updateResult);
    
    if (updateResult.affectedRows === 0) {
      throw new Error('Could not find the withdrawal request or it is already approved');
    }

    // Update user balance
    const updateUserSql = `
      UPDATE users
      SET balance = balance - ?,
          total_withdrawal = total_withdrawal + ?,
          withdrawalAttempts = withdrawalAttempts + 1
      WHERE id = ?
    `;
    const [userResult] = await pool.query(updateUserSql, [amount, amount, userId]);

    // Insert notification
    const insertNotificationSql = `
      INSERT INTO notifications (user_id, msg, created_at)
      VALUES (?, 'Your withdrawal has been approved', CURRENT_TIMESTAMP)
    `;
    const [notificationResult] = await pool.query(insertNotificationSql, [userId]);

    await pool.query('COMMIT');
    res.json({ message: 'Withdrawal approved successfully!' });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Withdrawal approval error:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

exports.rejectWithdrawal = async (req, res) => {
  const { requestId, userId, reason } = req.body;
  
  if (!requestId || !userId) {
    return res.status(400).json({ error: 'Request ID and User ID are required' });
  }

  try {
    const sql = `
      UPDATE withdrawal_requests 
      SET 
          reject = 1, 
          approved = 'rejected', 
          reject_at = CURRENT_TIMESTAMP,
          msg = ?
      WHERE id = ? AND user_id = ?
    `;
    
    const [result] = await pool.query(sql, [reason || 'No reason provided', requestId, userId]);
    console.log('Update result:', result);

    if (result.affectedRows > 0) {
      res.json({ message: 'Withdrawal request rejected successfully!' });

    } else {
      res.status(404).json({ error: 'No matching withdrawal request found' });
    }
  } catch (error) {
    console.error('Withdrawal rejection error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.deleteWithdrawal = async (req, res) => {
  const { requestId, userId } = req.body;

  if (!requestId || !userId) {
    return res.status(400).json({ error: 'Request ID and User ID are required' });
  }

  try {
    const sql = `
      DELETE FROM withdrawal_requests 
      WHERE id = ? AND user_id = ?
    `;
    
    const [result] = await pool.query(sql, [requestId, userId]);
    
    if (result.affectedRows > 0) {
      res.json({ message: 'Withdrawal request deleted successfully' });
    } else {
      res.status(404).json({ error: 'No matching withdrawal request found' });
    }
  } catch (error) {
    console.error('Withdrawal deletion error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};