import con from '../config/db.js';
import bcrypt from 'bcrypt';

export const userLogin = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ 
            Status: "Error", 
            Error: "Email and password are required" 
        });
    }

    const sql = "SELECT id, email, password, approved, payment_ok FROM users WHERE email = ? LIMIT 1";
    
    con.query(sql, [email.toLowerCase().trim()], async (err, result) => {
        if (err) {
            console.error('Login database error:', err);
            return res.status(500).json({ 
                Status: "Error", 
                Error: "Database error" 
            });
        }

        if (result.length === 0) {
            return res.status(401).json({ 
                Status: "Error", 
                Error: "Invalid Email/Password" 
            });
        }

        const user = result[0];

        // Compare password with bcrypt
        try {
            const isMatch = await bcrypt.compare(password, user.password);
            
            if (!isMatch) {
                return res.status(401).json({ 
                    Status: "Error", 
                    Error: "Invalid Email/Password" 
                });
            }

            // Set session
            req.session.userId = user.id;
            req.session.email = user.email;

            return res.json({
                Status: "Success",
                Email: user.email,
                PaymentOk: user.payment_ok,
                id: user.id,
                approved: user.approved
            });

        } catch (bcryptError) {
            console.error('Bcrypt compare error:', bcryptError);
            return res.status(500).json({ 
                Status: "Error", 
                Error: "Authentication error" 
            });
        }
    });
};