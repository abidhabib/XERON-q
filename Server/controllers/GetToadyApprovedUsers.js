import  con  from "../config/db.js";
 export const getToadyApprovedUsers = (req, res) => {


    const sql = `SELECT * FROM users WHERE approved = 1 AND approved_at >= CURDATE() AND payment_ok = 1`;

    con.query(sql, (err, result) => {
        if (err) {
            return res.status(500).json({ status: 'error', error: 'Failed to fetch approved users' });
        }

        if (result.length > 0) {
            return res.json({ status: 'success', approvedUsers: result });
        } else {
            return res.status(404).json({ status: 'error', error: 'No approved users found' });
        }
    });
};
