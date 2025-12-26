import con from "../config/db.js";



export const getUserWithdrawalRequests = (req, res) => {
  const userId = req.session.userId;
  if (!userId) {
    return res.status(401).json({ error: 'User not logged in' });
  }

  const sql = `
    SELECT 
      id,
      user_id,
      amount,
      chain,                -- ✅ NEW
      address,              -- ✅ NEW
      fee,
      approved,
      reject,
      request_date,
      approved_time,
      msg
    FROM withdrawal_requests 
    WHERE user_id = ? 
    ORDER BY request_date DESC
  `;

  con.query(sql, [userId], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch withdrawal requests' });
    }

    const formattedResults = results.map(request => ({
      id: request.id,
      uid: request.user_id,
      request_date: request.request_date,
      // ✅ Use approved_time if available, otherwise request_date
      date: request.approved_time || request.request_date,
      amount: request.amount,
      chain: request.chain || 'BEP20',        // fallback
      address: request.address || request.account_number, // fallback
      approved: request.approved,
      reject: request.reject,
      fee: request.fee || 0,
      msg: request.msg || ''
    }));

    res.json(formattedResults);
  });
};