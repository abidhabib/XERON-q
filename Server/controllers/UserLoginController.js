import con from '../config/db.js';
export const userLogin = (req, res) => {
    const sql = "SELECT id,email,approved,payment_ok FROM users WHERE email = ? AND password = ?";
    con.query(sql, [req.body.email, req.body.password], (err, result) => {
        if (err) return res.json({ Status: "Error", Error: err });

        if (result.length > 0) {
            req.session.userId = result[0].id;
            req.session.email = result[0].email;
            return res.json({
                Status: "Success",
                Email: req.session.email,
                PaymentOk: result[0].payment_ok,
                id: result[0].id,
                approved: result[0].approved
            });
        } else {
            return res.json({ Status: "Error", Error: "Invalid Email/Password" });
        }
    });
};
