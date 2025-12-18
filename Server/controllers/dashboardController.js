import con from '../config/db.js';

export const getDashboardData = (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const sql = `
    SELECT 
      -- User & Withdrawal Stats
      (SELECT COUNT(*) FROM users WHERE approved = 1 AND id NOT BETWEEN 9328 AND 9338) as approvedUsersCount,
      (SELECT COUNT(*) FROM users WHERE approved = 1 AND approved_at >= ? AND approved_at < ?) as approvedUsersCountToday,
      (SELECT SUM(amount) FROM withdrawal_requests WHERE approved = 'approved' AND user_id NOT BETWEEN 9329 AND 9338) as totalWithdrawal,
      (SELECT SUM(amount) FROM withdrawal_requests WHERE DATE(approved_time) = CURDATE() AND user_id NOT BETWEEN 9329 AND 9338) as totalAmountToday,
      (SELECT COUNT(*) FROM users WHERE payment_ok = 0 AND approved = 0) as unapprovedUnpaidUsersCount,
      (SELECT SUM(backend_wallet) FROM users WHERE approved = 1 AND id NOT BETWEEN 9329 AND 9338) as backend_wallet,
      (SELECT SUM(balance) FROM users WHERE approved = 1 AND id NOT BETWEEN 9329 AND 9338) as balance,
      (SELECT SUM(bonus_amount) FROM bonus_history_level_up WHERE user_id NOT BETWEEN 9329 AND 9338) as bonus,
      (SELECT SUM(today_wallet) FROM users WHERE id != 9338) as today_wallet,

      -- Settings (from unified settings table)
      (SELECT joining_fee FROM settings WHERE id = 1 LIMIT 1) as joining_fee,
      (SELECT initial_percent FROM settings WHERE id = 1 LIMIT 1) as initial_percent,

      -- Commission total
      (SELECT SUM(direct_bonus + indirect_bonus) FROM commission) as total_commission
  `;

  // ✅ Only 2 placeholders → pass [today, tomorrow] (not 4)
  con.query(sql, [today, tomorrow], (err, results) => {
    if (err) {
      console.error('Dashboard main query error:', err);
      return res.status(500).json({ success: false, message: 'Error fetching dashboard data' });
    }

    const r = results[0];

    // Safely parse values (handle NULL/undefined)
    const approvedUsersCount = Number(r.approvedUsersCount) || 0;
    const approvedUsersCountToday = Number(r.approvedUsersCountToday) || 0;
    const totalWithdrawal = Number(r.totalWithdrawal) || 0;
    const totalAmountToday = Number(r.totalAmountToday) || 0;
    const joining_fee = Number(r.joining_fee) || 0;
    const initial_percent = Number(r.initial_percent) || 0;
    const total_commission = Number(r.total_commission) || 0;
    const bonus = Number(r.bonus) || 0;

    // ✅ Compute derived values in JavaScript (since not in SQL)
    const totalReceived = joining_fee * approvedUsersCount;
    const totalReceivedToday = joining_fee * approvedUsersCountToday;

    // ✅ Recreate will_give using the original formula:
    // ((joining_fee / 100) * (total_commission + initial_percent) * approvedUsersCount) + bonus
    const will_give = 
      (joining_fee / 100) * (total_commission + initial_percent) * approvedUsersCount 
      + bonus;

    const dashboardData = {
      approvedUsersCount,
      approvedUsersCountToday,
      totalWithdrawal,
      totalAmountToday,
      unapprovedUnpaidUsersCount: Number(r.unapprovedUnpaidUsersCount) || 0,
      totalAmountTodayWithdrawal: totalAmountToday, // alias
      totalReceived,
      totalReceivedToday,
      backend_wallet: Number(r.backend_wallet) || 0,
      users_balance: Number(r.balance) || 0,
      users_bonus: bonus,
      today_wallet: Number(r.today_wallet) || 0,
      totalIncome: totalReceived - totalWithdrawal,
      todayIncome: totalReceivedToday - totalAmountToday,
      will_give: will_give - totalWithdrawal // as per your original logic
    };

    // Subadmin query (unchanged)
    const subadminSql = `
      SELECT 
        sa.username AS subadmin,
        COUNT(wr.id) AS totalApprovedCount,
        SUM(wr.amount) AS totalApprovedAmount,
        SUM(CASE WHEN DATE(wr.approved_time) = CURDATE() THEN 1 ELSE 0 END) AS todayApprovedCount,
        SUM(CASE WHEN DATE(wr.approved_time) = CURDATE() THEN wr.amount ELSE 0 END) AS todayApprovedAmount
      FROM subadmins sa
      LEFT JOIN withdrawal_requests wr 
        ON wr.approved_by COLLATE utf8mb4_general_ci = sa.username COLLATE utf8mb4_general_ci
        AND wr.approved = 'approved'
      WHERE sa.task = 'ApproveWithdrawal'
      GROUP BY sa.username
    `;

    con.query(subadminSql, (err2, subadminResults) => {
      if (err2) {
        console.error('Subadmin query error:', err2);
        return res.status(500).json({ success: false, message: 'Error fetching subadmin data' });
      }

      dashboardData.subadminApprovals = subadminResults || [];
      return res.status(200).json({ success: true, dashboardData });
    });
  });
};