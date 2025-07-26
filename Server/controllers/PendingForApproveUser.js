import con  from '../config/db.js';
export const getPendingForApproveUsers = (req, res) => {


    const sql = `
        SELECT 
            u.id, 
            u.trx_id, 
            u.refer_by, 
            u.name, 
            u.email, 
            u.blocked,
            ref.name AS referrer_name 
        FROM 
            users u
        LEFT JOIN 
            users ref 
        ON 
            u.refer_by = ref.id
        WHERE 
            u.approved = 0 
            AND u.payment_ok = 1 
            `;

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