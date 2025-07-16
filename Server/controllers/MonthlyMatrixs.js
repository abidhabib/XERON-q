import con from '../config/db.js';

export const MonthData = async (req, res) => {
    const { range } = req.query;
    const rangeInt = parseInt(range) || 12;

    const query = `
   SELECT 
  DATE_FORMAT(approved_at, '%Y-%m') AS month,
  COUNT(*) AS approvals
FROM users
WHERE 
  approved_at IS NOT NULL
  AND approved = 1
  AND payment_ok = 1
  AND approved_at >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)
GROUP BY month
ORDER BY month ASC;

    `;

    con.query(query, [rangeInt], (err, results) => {
        if (err) {
            console.error('Error fetching approvals:', err);
            return res.status(500).json({ error: 'Failed to get approvals' });
        }

        res.json({ success: true, data: results });
    });

};