import  con  from '../config/db.js';
export const getAllAdmins = (req, res) => {
    const sql = "SELECT * FROM admins";
    con.query(sql, (err, result) => {
        if (err) {
            return res.json({ Status: 'Error', Error: 'Failed to fetch admins data' });
        }

        if (result.length > 0) {
            return res.json({ Status: 'Success', Data: result });
        } else {
            return res.json({ Status: 'Error', Error: 'No admins found' });
        }
    });
}