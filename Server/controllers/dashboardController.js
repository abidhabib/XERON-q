// controllers/dashboardController.js
import con from '../config/db.js';

export const getDashboardData = (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const sql = `
      SELECT 
        (SELECT COUNT(*) FROM users WHERE approved = 1 AND id NOT BETWEEN 9328 AND 9338 ) as approvedUsersCount,
        (SELECT COUNT(*) FROM users WHERE approved = 1 AND approved_at >= ? AND approved_at < ?) as approvedUsersCountToday,
        (SELECT SUM(amount) FROM withdrawal_requests WHERE approved = 'approved' AND user_id NOT BETWEEN 9329 AND 9338) as totalWithdrawal,
        (SELECT SUM(amount) FROM withdrawal_requests WHERE DATE(approved_time) = CURDATE() AND user_id NOT BETWEEN 9329 AND 9338) as totalAmountToday,
        (SELECT COUNT(*) FROM users WHERE payment_ok = 0 AND approved = 0) as unapprovedUnpaidUsersCount,
        (SELECT SUM(amount) FROM withdrawal_requests WHERE DATE(approved_time) = CURDATE() AND user_id NOT BETWEEN 9329 AND 9338) as totalAmountTodayWithdrawal,
        (SELECT SUM(jf.joining_fee * (SELECT COUNT(*) FROM users WHERE approved = 1 AND id NOT BETWEEN 9328 AND 9338)) FROM joining_fee jf) as totalReceived,
        (SELECT SUM(jf.joining_fee * (SELECT COUNT(*) FROM users WHERE approved = 1 AND approved_at >= ? AND approved_at < ?)) FROM joining_fee jf) as totalReceivedToday,
        (SELECT SUM(backend_wallet) FROM users WHERE approved = 1 AND id NOT BETWEEN 9329 AND 9338) as backend_wallet,
        (SELECT SUM(balance) FROM users WHERE approved = 1 AND id NOT BETWEEN 9329 AND 9338) as balance,
        (SELECT SUM(bonus_amount) FROM bonus_history_level_up WHERE user_id NOT BETWEEN 9329 AND 9338) as bonus,
        (SELECT SUM(today_wallet) FROM users WHERE id != 9338) as today_wallet,
        (
          SELECT
              ((SELECT joining_fee FROM joining_fee WHERE id = 1) / 100) * 
              (
                (SELECT SUM(direct_bonus + indirect_bonus) FROM commission) +
                (SELECT initial_percent FROM initial_fee)
              ) * (SELECT COUNT(*) FROM users WHERE approved = 1) 
              + (SELECT SUM(bonus_amount) FROM bonus_history_level_up WHERE user_id NOT BETWEEN 9329 AND 9338)
        ) as will_give
  `;

  con.query(sql, [today, tomorrow, today, tomorrow], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: 'Error fetching dashboard data' });
    }

    const r = results[0];
    const dashboardData = {
      approvedUsersCount: r.approvedUsersCount,
      approvedUsersCountToday: r.approvedUsersCountToday,
      totalWithdrawal: r.totalWithdrawal,
      totalAmountToday: r.totalAmountToday,
      unapprovedUnpaidUsersCount: r.unapprovedUnpaidUsersCount,
      totalAmountTodayWithdrawal: r.totalAmountTodayWithdrawal,
      totalReceived: r.totalReceived,
      totalReceivedToday: r.totalReceivedToday,
      backend_wallet: r.backend_wallet,
      users_balance: r.balance,
      users_bonus: r.bonus,
      today_wallet: r.today_wallet,
      totalIncome: r.totalReceived - r.totalWithdrawal,
      todayIncome: r.totalReceivedToday - r.totalAmountTodayWithdrawal,
      will_give: r.will_give - Number(r.totalWithdrawal)
    };

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
        console.error(err2);
        return res.status(500).json({ success: false, message: 'Error fetching subadmin data' });
      }

      dashboardData.subadminApprovals = subadminResults || [];
      return res.status(200).json({ success: true, dashboardData });
    });
  });
};
