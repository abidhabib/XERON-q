import con from '../config/db.js';

export const FindReferrer = async (req, res) => {
    const { referByUserId } = req.params;

    try {
        const users = await fetchApprovedUserNames(referByUserId);
        res.json({ status: 'success', users });
    } catch (error) {
        console.error('Error fetching approved users:', error);
        res.status(500).json({ status: 'error', error: 'Failed to fetch approved users' });
    }
};
const fetchApprovedUserNames = (referByUserId) => {
    return new Promise((resolve, reject) => {
        const fetchNamesQuery = 'SELECT id, name ,team,backend_wallet, approved_at FROM users WHERE refer_by = ? AND approved = 1';
        con.query(fetchNamesQuery, [referByUserId], (err, results) => {
            if (err) {
                reject(err);
            } else {
                resolve(results);
            }
        });
    });
};