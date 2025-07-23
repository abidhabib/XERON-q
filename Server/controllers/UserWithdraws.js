import con from "../config/db.js";




export const getUserWithdrawalRequests = (req, res) => {
    const userId = req.session.userId;

    if (!userId) {
        return res.status(401).json({ error: 'User not logged in' });
    }

    const sql = 'SELECT id, user_id,msg, approved_time, reject,account_number,fee, amount, bank_name,account_name, approved FROM withdrawal_requests WHERE user_id = ? ORDER BY request_date DESC';

    con.query(sql, [userId], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to fetch withdrawal requests' });
        }

        const formattedResults = results.map(request => ({
            id: request.id,
            uid: request.user_id,
            date: request.approved_time,
            amount: request.amount,
            bank_name: request.bank_name,
            approved: request.approved,
            reject: request.reject,
            account_number: request.account_number,
            account_name: request.account_name,
            fee: request.fee,
            msg: request.msg

        }));
        res.json(formattedResults);
    });
}