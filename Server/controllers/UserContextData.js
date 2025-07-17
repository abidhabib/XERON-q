import con from "../config/db.js";

export const getUserData = (req, res) => {
    if (!req.session.userId) {
        return res.json({ Status: 'Error', Error: 'User not logged in' });
    }

    const sql = "SELECT * FROM users WHERE id = ?";
    con.query(sql, [req.session.userId], (err, result) => {
        if (err) {
            return res.json({ Status: 'Error', Error: 'Failed to fetch user data' });
        }

        if (result.length > 0) {
            return res.json({ Status: 'Success', Data: result[0] });
        } else {
            return res.json({ Status: 'Error', Error: 'User not found' });
        }
    });
};