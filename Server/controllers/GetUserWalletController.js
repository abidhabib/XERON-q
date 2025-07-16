    import con from '../config/db.js';

export const getUserWallet = (req, res) => {
    const userId = req.params.userId;

    const sql = `
        SELECT 
            coin_address as address,
            address_type as addressType
        FROM users_accounts 
        WHERE user_id = ?
    `;

    con.query(sql, [userId], (err, result) => {
        if (err) {
            return res.status(500).json({ status: 'error', message: 'Database error' });
        }

        res.json({
            status: 'success',
            address: result[0]?.address || '',
            addressType: result[0]?.addressType || 'bep20'
        });
    });
};