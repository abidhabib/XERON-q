
import con from '../config/db.js';

import bcrypt from 'bcrypt';


export const registerUser = async (req, res) => {
    try {
        const { ref } = req.query;
        // ✅ Remove confirmPassword from destructuring - it's not sent from frontend
        const { name, email, phoneNumber, password, city, completeAddress } = req.body;

        // Validation - required fields
        if (!email || !password || !name || !phoneNumber) {
            return res.status(400).json({ 
                status: 'error', 
                error: 'Missing required fields' 
            });
        }

        // ✅ Password min 8 chars (keep this)
        if (password.length < 8) {
            return res.status(400).json({ 
                status: 'error', 
                error: 'Password must be at least 8 characters' 
            });
        }

        // ❌ REMOVE THIS BLOCK - confirmPassword is not sent from frontend
        // if (password !== confirmPassword) {
        //     return res.status(400).json({ 
        //         status: 'error', 
        //         error: 'Passwords do not match' 
        //     });
        // }

        // Check email exists
        const checkEmailSql = "SELECT id FROM users WHERE email = ? LIMIT 1";
        
        con.query(checkEmailSql, [email], async (err, existingUsers) => {
            if (err) {
                console.error('Email check error:', err);
                return res.status(500).json({ 
                    status: 'error', 
                    error: 'Error checking email' 
                });
            }

            if (existingUsers.length > 0) {
                return res.status(409).json({ 
                    status: 'error', 
                    error: 'Email already registered' 
                });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 12);

            // Build user object
            const user = {
                name: name.trim(),
                email: email.toLowerCase().trim(),
                phoneNumber: phoneNumber.trim(),
                password: hashedPassword,
                city: city?.trim() || null,
                completeAddress: completeAddress?.trim() || null,
                refer_by: ref || null
            };

            const doRegister = () => {
                const sql = "INSERT INTO users SET ?";
                
                con.query(sql, user, (err, result) => {
                    if (err) {
                        console.error('Insert error:', err);
                        // Handle duplicate phone number if your DB has unique constraint
                        if (err.code === 'ER_DUP_ENTRY') {
                            return res.status(409).json({ 
                                status: 'error', 
                                error: 'Phone number already registered' 
                            });
                        }
                        return res.status(500).json({ 
                            status: 'error', 
                            error: 'Registration failed. Please try again.' 
                        });
                    }

                    req.session.userId = result.insertId;

                    return res.status(201).json({ 
                        status: 'success', 
                        message: 'User registered successfully', 
                        userId: result.insertId 
                    });
                });
            };

            // Check referral if provided
            if (ref) {
                con.query("SELECT id FROM users WHERE id = ?", [ref], (err, referralUsers) => {
                    if (err) {
                        console.error('Referral check error:', err);
                        return res.status(500).json({ 
                            status: 'error', 
                            error: 'Error verifying referral' 
                        });
                    }
                    if (referralUsers.length === 0) {
                        return res.status(400).json({ 
                            status: 'error', 
                            error: 'Invalid referral ID' 
                        });
                    }
                    doRegister();
                });
            } else {
                doRegister();
            }
        });
    } catch (error) {
        console.error('Register error:', error);
        return res.status(500).json({ 
            status: 'error', 
            error: 'An unexpected error occurred' 
        });
    }
};
