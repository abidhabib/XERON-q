import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import multer from 'multer';
import path, { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path'
import fs from 'fs';
import jwt from 'jsonwebtoken';
import moment from 'moment';
import con from './config/db.js';
import './cron/index.js';

import userRoutes from './routes/userRoutes.js';

import dashboardRoutes from './routes/dashboardRoutes.js';
import notificationRoutes from './routes/notifications.js';
import setupWebPush from './utils/setupWebPush.js';
setupWebPush();

dotenv.config();
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function getDayName(dayIndex) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayIndex];
}
app.use(bodyParser.json());
app.use(cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
    credentials: true

}));
app.use('/storage', express.static(join(__dirname, 'uploads')));
app.use(cookieParser());
app.use(express.json());
app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 699900000 }

}));

con.connect(function (err) {
    if (err) {
        console.error('Error in connection:', err);
    } else {
        console.log('Connected');
    }
}
);



app.use('/', dashboardRoutes); // Mount your route
app.use('/', notificationRoutes); // handles /save-subscription etc.
app.use('/', userRoutes);



const storage = multer.diskStorage({
    destination: './uploads/',
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });



app.get('/api/approvals/monthly', (req, res) => {
    const { range } = req.query; // number of months
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
});










const getUserIdFromSession = (req, res, next) => {
    if (req.session && req.session.userId) {
        res.json({ userId: req.session.userId });
    } else {
        res.status(401).json({ error: 'User not authenticated' });
    }
};



app.get('/getUserIdFromSession', getUserIdFromSession);



app.get('/', (req, res) => {
    res.send(`
      Welcome to the server!`);

});




app.post('/login', (req, res) => {
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
});

app.post('/register', (req, res) => {
    try {
        const { ref } = req.query;
        const user = { ...req.body };
        delete user.confirmPassword;

        const checkEmailSql = "SELECT * FROM users WHERE email = ?";
        con.query(checkEmailSql, [user.email], (err, existingUsers) => {
            if (err) {
                return res.json({ status: 'error', error: 'An error occurred while checking the email' });
            }

            if (existingUsers.length > 0) {
                return res.json({ status: 'error', error: 'Email already registered' });
            }

            const registerUser = () => {
                user.refer_by = ref;

                const sql = "INSERT INTO users SET ?";
                con.query(sql, user, (err, result) => {
                    if (err) {
                        console.log(err);
                        return res.json({ status: 'error', error: 'Kindly try again With Referred ID' });
                    }

                    req.session.userId = result.insertId;

                    return res.json({ status: 'success', message: 'User registered successfully', userId: result.insertId });
                });
            };

            if (ref) {
                const checkReferralSql = "SELECT * FROM users WHERE id = ?";
                con.query(checkReferralSql, [ref], (err, referralUsers) => {
                    if (err) {
                        return res.json({ status: 'error', error: 'Failed to check referral ID' });
                    }

                    if (referralUsers.length === 0) {
                        return res.json({ status: 'error', error: 'Invalid referral ID' });
                    }

                    registerUser();
                });
            } else {
                registerUser();
            }
        });
    } catch (error) {
        return res.json({ status: 'error', error: 'An unexpected error occurred' });
    }
});





app.get('/salary-status/:userId', async (req, res) => {
    const userId = req.params.userId;
    const currentWeek = parseInt(moment().format('YYYYWW'));
    const today = moment().day(); // 0-6 (Sun-Sat)

    try {
        const [user] = await con.promise().query(`
            SELECT u.id, u.level, u.balance AS wallet,
                   u.salary_collection_week, u.last_salary_collected_at,
                   l.salary_amount, l.salary_day, l.weekly_recruitment
            FROM users u
            JOIN levels l ON u.level = l.level
            WHERE u.id = ?
        `, [userId]);

        if (!user.length) {
            return res.status(404).json({ status: 'error', error: 'User not found' });
        }

        const userData = user[0];

        const [recruits] = await con.promise().query(`
            SELECT new_members 
            FROM weekly_recruits 
            WHERE user_id = ? AND week_id = ?
        `, [userId, currentWeek]);

        const newMembers = recruits[0]?.new_members || 0;

        let isEligible = false;
        let reason = "";

        if (today === userData.salary_day) {
            if (userData.salary_collection_week === currentWeek) {
                reason = "Already collected this week";
            } else {
                const [lastPayment] = await con.promise().query(`
                    SELECT level FROM salary_payments 
                    WHERE user_id = ?
                    ORDER BY created_at DESC 
                    LIMIT 1
                `, [userId]);

                const isFirstAtLevel = !lastPayment.length || lastPayment[0].level !== userData.level;

                if (isFirstAtLevel) {
                    isEligible = true;
                    reason = "First collection at this level";
                } else {
                    if (newMembers >= userData.weekly_recruitment) {
                        isEligible = true;
                        reason = "Met weekly requirement";
                    } else {
                        reason = `Need ${userData.weekly_recruitment - newMembers} more recruits`;
                    }
                }
            }
        } else {
            reason = `Salary day is ${getDayName(userData.salary_day)}`;
        }

        res.json({
            status: 'success',
            data: {
                currentLevel: userData.level,
                salaryAmount: userData.salary_amount,
                nextSalaryDay: userData.salary_day,
                dayName: getDayName(userData.salary_day),
                sameLevelRequirement: userData.weekly_recruitment,
                newMembersThisWeek: newMembers,
                isEligible,
                reason,
                wallet: userData.wallet
            }
        });
    } catch (error) {
        console.error('Salary status error:', error);
        res.status(500).json({ status: 'error', error: 'Server error' });
    }
});
app.post('/collect-salary/:userId', async (req, res) => {
    const userId = req.params.userId;
    const currentWeek = parseInt(moment().format('YYYYWW'));
    const today = moment().day();

    try {
        await con.promise().query('START TRANSACTION');

        const [user] = await con.promise().query(`
            SELECT u.id, u.level, u.balance AS wallet,
                   u.salary_collection_week, l.salary_amount, l.salary_day, l.weekly_recruitment
            FROM users u
            JOIN levels l ON u.level = l.level
            WHERE u.id = ?
            FOR UPDATE
        `, [userId]);

        if (!user.length) {
            await con.promise().query('ROLLBACK');
            return res.status(404).json({ status: 'error', error: 'User not found' });
        }

        const userData = user[0];

        if (today !== userData.salary_day) {
            await con.promise().query('ROLLBACK');
            return res.status(400).json({ 
                status: 'error', 
                error: `Today is not your salary day (${getDayName(userData.salary_day)})`
            });
        }

        if (userData.salary_collection_week === currentWeek) {
            await con.promise().query('ROLLBACK');
            return res.status(400).json({ 
                status: 'error', 
                error: 'Already collected this week'
            });
        }

        const [recruits] = await con.promise().query(`
            SELECT new_members 
            FROM weekly_recruits 
            WHERE user_id = ? AND week_id = ?
        `, [userId, currentWeek]);

        const newMembers = recruits[0]?.new_members || 0;

        const [lastPayment] = await con.promise().query(`
            SELECT level 
            FROM salary_payments 
            WHERE user_id = ?
            ORDER BY created_at DESC 
            LIMIT 1
        `, [userId]);

        const isFirstAtLevel = !lastPayment.length || lastPayment[0].level !== userData.level;

        if (!isFirstAtLevel && newMembers < userData.weekly_recruitment) {
            await con.promise().query('ROLLBACK');
            return res.status(400).json({ 
                status: 'error', 
                error: `Need ${userData.weekly_recruitment - newMembers} more recruits`
            });
        }

        const newWallet = parseFloat(userData.wallet) + parseFloat(userData.salary_amount);

        await con.promise().query(`
            UPDATE users 
            SET 
                balance = ?,
                salary_collection_week = ?,
                last_salary_collected_at = NOW(),
                total_salary = total_salary + ?
            WHERE id = ?
        `, [newWallet, currentWeek, userData.salary_amount, userId]);

        await con.promise().query(`
            INSERT INTO salary_payments 
            (user_id, level, amount, payment_week)
            VALUES (?, ?, ?, ?)
        `, [userId, userData.level, userData.salary_amount, currentWeek]);

        const message = `Salary collected: $${userData.salary_amount} for Level ${userData.level}`;
       await con.promise().query(`
    INSERT INTO notifications (user_id, msg, is_read, created_at)
    VALUES (?, ?, 0, NOW())
`, [userId, message]);


        await con.promise().query('COMMIT');

        res.json({
            status: 'success',
            message: 'Salary collected successfully',
            newBalance: newWallet
        });
    } catch (error) {
        await con.promise().query('ROLLBACK');
        console.error('Salary collection error:', error);
        res.status(500).json({ status: 'error', error: 'Collection failed' });
    }
});





app.get('/getCryptoAddress/:userId', (req, res) => {
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
});
app.put('/updateCryptoAddress', (req, res) => {
    const { address, addressType, userId } = req.body;

    if (!address || !addressType || !userId) {
        return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const sql = `
        INSERT INTO users_accounts (user_id, coin_address, address_type)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE 
            coin_address = VALUES(coin_address),
            address_type = VALUES(address_type)
    `;

    const values = [userId, address, addressType];

    con.query(sql, values, (err, result) => {
        if (err) {
            console.error('DB error:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }

        res.json({ success: true, message: 'Crypto address saved/updated successfully' });
    });
});

app.get('/getUserData', (req, res) => {
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
});

app.get('/getAllAdmins', verifyToken, (req, res) => {
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
});



const bep20Storage = multer.diskStorage({
    destination: './uploads/bep20/',
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'bep20-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const bep20Upload = multer({
    storage: bep20Storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});
// Helper function for async queries
const dbQuery = (sql, params) => {
    return new Promise((resolve, reject) => {
        con.query(sql, params, (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
};
app.get('/bep20active', async (req, res) => {
    try {
        const [account] = await dbQuery(`
        SELECT * FROM bep20_settings 
        WHERE is_active = 1 
        ORDER BY created_at DESC 
        LIMIT 1
      `);

        if (!account) {
            return res.json({ success: false, message: 'No active BEP20 account found' });
        }

        res.json({
            success: true,
            account: {
                address: account.bep20_address,
                qrCode: account.qr_code_image
            }
        });
    } catch (err) {
        console.error('Error fetching BEP20 account:', err);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});


// 1. Get all BEP20 addresses
app.get('/bep20', async (req, res) => {
    try {
        const addresses = await dbQuery('SELECT * FROM bep20_settings ORDER BY created_at DESC');
        res.json(addresses);
    } catch (err) {
        console.error('Error fetching addresses:', err);
        res.status(500).json({ error: 'Failed to fetch addresses' });
    }
});

// 2. Create new BEP20 address
app.post('/bep20', bep20Upload.single('qr_code_image'), async (req, res) => {
    const { bep20_address, is_active } = req.body;
    const file = req.file;

    if (!bep20_address || !file) {
        return res.status(400).json({ error: 'BEP20 address and QR code are required' });
    }

    try {
        const qr_code_image = `/uploads/bep20/${file.filename}`;
        const activeStatus = is_active === 'true';

        // Start transaction
        await dbQuery('START TRANSACTION');

        // Insert new address
        const result = await dbQuery(
            'INSERT INTO bep20_settings (bep20_address, qr_code_image, is_active) VALUES (?, ?, ?)',
            [bep20_address, qr_code_image, activeStatus]
        );

        // If setting as active, deactivate others
        if (activeStatus) {
            await dbQuery(
                'UPDATE bep20_settings SET is_active = 0 WHERE id != ?',
                [result.insertId]
            );
        }

        await dbQuery('COMMIT');

        res.json({
            id: result.insertId,
            bep20_address,
            qr_code_image,
            is_active: activeStatus
        });
    } catch (err) {
        await dbQuery('ROLLBACK');

        // Delete uploaded file if insertion failed
        if (req.file) {
            fs.unlink(req.file.path, () => { });
        }

        console.error('Error creating address:', err);

        if (err.code === 'ER_DUP_ENTRY') {
            res.status(400).json({ error: 'This address already exists' });
        } else {
            res.status(500).json({ error: 'Failed to create address' });
        }
    }
});

// 3. Update BEP20 address
app.put('/bep20/:id', bep20Upload.single('qr_code_image'), async (req, res) => {
    const { id } = req.params;
    const { bep20_address, is_active } = req.body;
    const file = req.file;

    if (!bep20_address) {
        return res.status(400).json({ error: 'BEP20 address is required' });
    }

    try {
        // Get existing record
        const [existing] = await dbQuery('SELECT * FROM bep20_settings WHERE id = ?', [id]);
        if (!existing) {
            return res.status(404).json({ error: 'Address not found' });
        }

        let qr_code_image = existing.qr_code_image;

        // Start transaction
        await dbQuery('START TRANSACTION');

        // Handle new file upload
        if (file) {
            const newImagePath = `/uploads/bep20/${file.filename}`;

            // Delete old file
            if (existing.qr_code_image) {
                const oldFilePath = path.join(__dirname, 'uploads', 'bep20', path.basename(existing.qr_code_image));
                if (fs.existsSync(oldFilePath)) {
                    fs.unlink(oldFilePath, () => { });
                }
            }

            qr_code_image = newImagePath;
        }

        const activeStatus = is_active === 'true';

        // Update the address
        await dbQuery(
            'UPDATE bep20_settings SET bep20_address = ?, qr_code_image = ?, is_active = ? WHERE id = ?',
            [bep20_address, qr_code_image, activeStatus, id]
        );

        // If setting as active, deactivate others
        if (activeStatus) {
            await dbQuery(
                'UPDATE bep20_settings SET is_active = 0 WHERE id != ?',
                [id]
            );
        }

        await dbQuery('COMMIT');

        res.json({
            id,
            bep20_address,
            qr_code_image,
            is_active: activeStatus
        });
    } catch (err) {
        await dbQuery('ROLLBACK');

        // Delete uploaded file if update failed
        if (req.file) {
            fs.unlink(req.file.path, () => { });
        }

        console.error('Error updating address:', err);

        if (err.code === 'ER_DUP_ENTRY') {
            res.status(400).json({ error: 'This address already exists' });
        } else {
            res.status(500).json({ error: 'Failed to update address' });
        }
    }
});

// 4. Delete BEP20 address
app.delete('/bep20/:id', async (req, res) => {
    const { id } = req.params;

    try {
        // Get the address
        const [address] = await dbQuery('SELECT * FROM bep20_settings WHERE id = ?', [id]);
        if (!address) {
            return res.status(404).json({ error: 'Address not found' });
        }

        // Start transaction
        await dbQuery('START TRANSACTION');

        // Delete the record
        await dbQuery('DELETE FROM bep20_settings WHERE id = ?', [id]);

        // If it was active, activate the most recent one
        if (address.is_active) {
            const [newActive] = await dbQuery(
                'SELECT * FROM bep20_settings ORDER BY created_at DESC LIMIT 1'
            );

            if (newActive) {
                await dbQuery(
                    'UPDATE bep20_settings SET is_active = 1 WHERE id = ?',
                    [newActive.id]
                );
            }
        }

        // Delete the QR code file
        if (address.qr_code_image) {
            const filePath = path.join(__dirname, 'uploads', 'bep20', path.basename(address.qr_code_image));
            if (fs.existsSync(filePath)) {
                fs.unlink(filePath, () => { });
            }
        }

        await dbQuery('COMMIT');

        res.json({ success: true });
    } catch (err) {
        await dbQuery('ROLLBACK');
        console.error('Error deleting address:', err);
        res.status(500).json({ error: 'Failed to delete address' });
    }
});

// 5. Activate BEP20 address
app.patch('/bep20/:id/activate', async (req, res) => {
    const { id } = req.params;

    try {
        // Start transaction
        await dbQuery('START TRANSACTION');

        // Deactivate all addresses
        await dbQuery('UPDATE bep20_settings SET is_active = 0');

        // Activate the selected address
        await dbQuery('UPDATE bep20_settings SET is_active = 1 WHERE id = ?', [id]);

        await dbQuery('COMMIT');

        res.json({ success: true });
    } catch (err) {
        await dbQuery('ROLLBACK');
        console.error('Error activating address:', err);
        res.status(500).json({ error: 'Failed to activate address' });
    }
});


app.post('/changePassword', (req, res) => {
    const { username, oldPassword, newPassword } = req.body;

    const sql = "SELECT password FROM admins WHERE username = ?";

    con.query(sql, [username], (err, result) => {
        if (err || result.length === 0) {
            return res.json({ message: 'Username not found' });
        }

        const storedPassword = result[0].password;

        if (storedPassword !== oldPassword) {
            return res.json({ message: 'Old password is incorrect' });
        }

        const updateSql = "UPDATE admins SET password = ? WHERE username = ?";

        con.query(updateSql, [newPassword, username], (updateErr, updateResult) => {
            if (updateErr) {
                return res.json({ message: 'Failed to update password' });
            }

            return res.json({ message: 'Password updated successfully' });
        });
    });
});
app.post('/updateBalance', (req, res) => {
    const { productId } = req.body;

    if (!req.session.userId) {
        return res.json({ status: 'error', error: 'User not logged in' });
    }

    const userId = req.session.userId;
    const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format

    // Check if the product was already clicked today
    const checkClickSql = `
        SELECT 1 FROM user_product_clicks 
        WHERE user_id = ? AND product_id = ? AND DATE(last_clicked) = ?
    `;

    con.query(checkClickSql, [userId, productId, today], (err, result) => {
        if (err) {
            return res.status(500).json({ status: 'error', error: 'Failed to check click history' });
        }

        if (result.length > 0) {
            return res.json({ status: 'error', error: 'You have already clicked this product today' });
        }

        // Step 1: Get backend_wallet value
        const getWalletSql = `SELECT backend_wallet FROM users WHERE id = ?`;
        con.query(getWalletSql, [userId], (err, walletResult) => {
            if (err || walletResult.length === 0) {
                return res.status(500).json({ status: 'error', error: 'Failed to fetch backend_wallet' });
            }

            const backendWallet = walletResult[0].backend_wallet;
            const onePercent = backendWallet * 0.012;

            // Step 2: Deduct 1% from backend_wallet and increment balance
            const updateWalletSql = `
                UPDATE users 
                SET backend_wallet = backend_wallet - ?, balance = balance + ? 
                WHERE id = ?`;
            con.query(updateWalletSql, [onePercent, onePercent, userId], (err, updateResult) => {
                if (err) {
                    return res.status(500).json({ status: 'error', error: 'Failed to update backend_wallet and balance' });
                }

                // Step 3: Insert or update the click history with the current timestamp
                const updateLastClickedSql = `
                    INSERT INTO user_product_clicks (user_id, product_id, last_clicked) 
                    VALUES (?, ?, NOW()) 
                    ON DUPLICATE KEY UPDATE last_clicked = VALUES(last_clicked)
                `;
                con.query(updateLastClickedSql, [userId, productId], (err, clickResult) => {
                    if (err) {
                        return res.status(500).json({ status: 'error', error: 'Failed to update last clicked time' });
                    }

                    return res.json({ status: 'success', message: 'Balance and backend_wallet updated successfully' });
                });
            });
        });
    });
});









app.get('/getUserTaskStatus/:userId', (req, res) => {
    const userId = req.params.userId;
    const sql = 'SELECT * FROM user_product_clicks WHERE user_id = ?';

    con.query(sql, [userId], (err, results) => {
        if (err) {
            return res.status(500).json({ status: 'error', error: 'Failed to fetch user task status' });
        }

        const taskStatus = results.reduce((acc, curr) => {
            acc[curr.product_id] = curr.last_clicked;
            return acc;
        }, {});

        res.json({ status: 'success', taskStatus });
    });
});
app.put('/updateProfile', upload.single('profilePicture'), async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ status: 'error', error: 'User not logged in' });
    }

    const { name, currentPassword, newPassword, phoneNumber } = req.body;

    if (!name || !phoneNumber) {
        return res.status(400).json({ status: 'error', error: 'Name and phone number are required' });
    }

    let profilePicturePath = null;

    // Check if a new profile picture is uploaded
    if (req.file) {
        profilePicturePath = req.file.path;  // New profile picture uploaded
    }

    con.query('SELECT profile_picture, password FROM users WHERE id = ?', [req.session.userId], async (err, result) => {
        if (err) {
            return res.status(500).json({ status: 'error', error: 'Failed to fetch user data' });
        }

        const existingProfilePicture = result[0]?.profile_picture;
        const userPassword = result[0]?.password;

        // Handle password change if current password and new password are provided
        if (currentPassword && newPassword) {
            if (userPassword !== currentPassword) {
                return res.status(400).json({ status: 'error', error: 'Current password is incorrect' });
            }

            // Update the password
            const updatePasswordQuery = 'UPDATE users SET password = ? WHERE id = ?';
            con.query(updatePasswordQuery, [newPassword, req.session.userId], (err, result) => {
                if (err) {
                    return res.status(500).json({ status: 'error', error: 'Failed to update password' });
                }

                // Update other fields (name and profile picture if provided)
                const updateUserDataQuery = 'UPDATE users SET name = ?, profile_picture = ?, phoneNumber = ? WHERE id = ?';
                con.query(updateUserDataQuery, [name, profilePicturePath || existingProfilePicture, phoneNumber, req.session.userId], (err, result) => {
                    if (err) {
                        return res.status(500).json({ status: 'error', error: 'Failed to update profile' });
                    }

                    // Delete existing profile picture if a new one is uploaded
                    if (existingProfilePicture && req.file) {
                        fs.unlink(existingProfilePicture, (err) => {
                            if (err) {
                                console.error('Failed to delete existing profile picture:', err);
                            }
                        });
                    }

                    res.json({ status: 'success', message: 'Profile updated successfully' });
                });
            });
        } else {
            // If no password change, update other fields
            const updateUserDataQuery = 'UPDATE users SET name = ?, profile_picture = ?, phoneNumber = ? WHERE id = ?';
            con.query(updateUserDataQuery, [name, profilePicturePath || existingProfilePicture, phoneNumber, req.session.userId], (err, result) => {
                if (err) {
                    return res.status(500).json({ status: 'error', error: 'Failed to update profile' });
                }

                // Delete existing profile picture if a new one is uploaded
                if (existingProfilePicture && req.file) {
                    fs.unlink(existingProfilePicture, (err) => {
                        if (err) {
                            console.error('Failed to delete existing profile picture:', err);
                        }
                    });
                }

                res.json({ status: 'success', message: 'Profile updated successfully' });
            });
        }
    });
});





app.post('/logout', (req, res) => {
    if (req.session) {
        req.session.destroy(err => {
            if (err) {
                return res.json({ Status: 'Error', Error: 'Failed to logout' });
            }

            return res.json({ Status: 'Success', Message: 'Logged out successfully' });
        });
    } else {
        return res.json({ Status: 'Error', Error: 'No session to logout' });
    }
});






app.post('/admin-login', (req, res) => {
    const sentloginUserName = req.body.LoginUserName;
    const sentLoginPassword = req.body.LoginPassword;

    const sql = 'SELECT * FROM admins WHERE username = ? && password = ?';
    const values = [sentloginUserName, sentLoginPassword];

    con.query(sql, values, (err, results) => {
        if (err) {
            res.status(500).send({ error: err });
        }
        if (results.length > 0) {
            const token = jwt.sign({ username: sentloginUserName, isAdmin: true }, 'your_secret_key', { expiresIn: '30d' });
            res.status(200).send({ token });
        } else {
            res.status(401).send({ message: `Credentials don't match!` });
        }
    });
});




function verifyToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];


    if (!token) {
        return res.status(403).json({ success: false, message: `No token provided ${token}` });
    }

    jwt.verify(token, 'your_secret_key', (err, decoded) => {
        if (err) {
            return res.status(401).json({ success: false, message: 'Failed to authenticate token.' });
        }

        if (!decoded.isAdmin) {
            return res.status(403).json({ success: false, message: 'Not authorized to access this resource.' });
        }

        next();
    });
}


app.get('/todayApproved', (req, res) => {


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
});



// Unified approved users endpoint with efficient pagination
app.get('/approved-users', async (req, res) => {
    try {
        const {
            page = 1,
            perPage = 100,
            searchTerm = '',
            sortKey = 'id',
            sortDirection = 'asc'
        } = req.query;

        const offset = (page - 1) * perPage;

        // Validate and sanitize sortKey
        const validSortKeys = ['id', 'name', 'email', 'balance', 'team', 'trx_id',
            'total_withdrawal', 'team', 'refer_by', 'level_updated', 'level'];
        const sortField = validSortKeys.includes(sortKey) ? sortKey : 'id';
        const sortDir = sortDirection.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

        // Base query with all needed fields
        let baseQuery = `
        SELECT 
          u.id, u.balance,u.blocked,u.refer_by, u.team, u.name, u.email, u.phoneNumber, 
          u.backend_wallet, u.trx_id, u.total_withdrawal, u.refer_by, 
          u.password, u.level_updated, u.level, u.all_credits, u.today_wallet
        FROM users u
        WHERE u.approved = 1 AND u.payment_ok = 1
      `;

        // Count query
        let countQuery = `
        SELECT COUNT(*) AS totalCount 
        FROM users u
        WHERE u.approved = 1 AND u.payment_ok = 1
      `;

        const params = [];
        let whereClause = '';

        if (searchTerm) {
            whereClause = ' AND (u.name LIKE ? OR u.email LIKE ? OR u.trx_id LIKE ? OR u.phoneNumber  LIKE ? OR u.id = ?)';
            params.push(`%${searchTerm}%`, `%${searchTerm}%`, searchTerm ? `%${searchTerm}%` : '', searchTerm ? `%${searchTerm}%` : '', searchTerm);
        } else {
            whereClause = ' AND u.team > 1';
        }

        baseQuery += whereClause;
        countQuery += whereClause;

        // Get total count
        const countResult = await queryAsync(countQuery, [...params]);
        const totalCount = countResult[0].totalCount;
        const totalPages = Math.ceil(totalCount / perPage);

        // Add sorting and pagination to main query
        baseQuery += ` ORDER BY ${sortField} ${sortDir} LIMIT ?, ?`;
        params.push(offset, parseInt(perPage));

        // Execute main query
        const result = await queryAsync(baseQuery, [...params]);

        // Extract user IDs for batch processing
        const userIds = result.map(user => user.id);

        if (userIds.length > 0) {
            // Batch fetch bonus data
            const bonusHistoryQuery = `
          SELECT user_id, SUM(amount) AS total_bonus 
          FROM bonus_history 
          WHERE user_id IN (?)
          GROUP BY user_id
        `;

            const bonusHistoryLevelUpQuery = `
          SELECT user_id, SUM(bonus_amount) AS total_level_up_bonus 
          FROM bonus_history_level_up 
          WHERE user_id IN (?)
          GROUP BY user_id
        `;

            const [bonusHistoryResults, bonusHistoryLevelUpResults] = await Promise.all([
                queryAsync(bonusHistoryQuery, [userIds]),
                queryAsync(bonusHistoryLevelUpQuery, [userIds])
            ]);

            // Create maps for quick lookup
            const bonusMap = new Map();
            const levelUpMap = new Map();

            bonusHistoryResults.forEach(row => bonusMap.set(row.user_id, row.total_bonus || 0));
            bonusHistoryLevelUpResults.forEach(row => levelUpMap.set(row.user_id, row.total_level_up_bonus || 0));

            // Calculate finalResult for each user
            const usersWithFinalResult = result.map(user => {
                const totalBonus = bonusMap.get(user.id) || 0;
                const totalLevelUpBonus = levelUpMap.get(user.id) || 0;

                const finalResult = user.all_credits -
                    user.backend_wallet -
                    user.balance -
                    user.total_withdrawal -
                    totalBonus -
                    totalLevelUpBonus -
                    user.today_wallet;

                return {
                    ...user,
                    finalResult
                };
            });

            return res.status(200).json({
                success: true,
                approvedUsers: usersWithFinalResult,
                totalCount,
                currentPage: parseInt(page),
                totalPages
            });
        }

        // Return empty result if no users found
        res.status(200).json({
            success: true,
            approvedUsers: [],
            totalCount,
            currentPage: parseInt(page),
            totalPages
        });

    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while fetching approved users.'
        });
    }
});

// Unified user rejection endpoint
app.put('/rejectUserCurrMin/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const sql = 'UPDATE users SET approved = 0 , rejected = 1  WHERE id = ?';
        await queryAsync(sql, [userId]);
        res.status(200).json({ success: true, message: 'User rejected successfully' });
    } catch (error) {
        console.error('Error rejecting user:', error);
        res.status(500).json({ success: false, message: 'Error rejecting user' });
    }
});

// Unified user update endpoint
app.put('/updateUser', async (req, res) => {
    try {
        const user = req.body;
        const sql = `
        UPDATE users 
        SET 
          name = ?, 
          email = ?, 
          password = ?, 
          balance = ?, 
          team = ?, 
          trx_id = ?, 
          total_withdrawal = ?,
          level = ?,
          level_updated = ?,
          backend_wallet = ?
        WHERE id = ?
      `;

        await queryAsync(sql, [
            user.name,
            user.email,
            user.password,
            user.balance,
            user.team,
            user.trx_id,
            user.total_withdrawal,
            user.level || 0,
            user.level_updated || 0,
            user.backend_wallet || 0,
            user.id
        ]);

        res.status(200).json({ success: true, message: 'User updated successfully' });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ success: false, message: 'Error updating user' });
    }
});



// Rejected users endpoint with pagination and search
app.get('/rejectedUsers', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 100;
        const offset = (page - 1) * limit;
        const search = req.query.search || '';

        // Base query
        let baseQuery = `
        SELECT * 
        FROM users 
        WHERE approved = 0 AND  rejected = 1
      `;

        // Count query
        let countQuery = `
        SELECT COUNT(*) AS totalCount 
        FROM users 
        WHERE approved = 0 AND payment_ok = 0
      `;

        const params = [];

        if (search) {
            const searchTerm = `%${search}%`;
            baseQuery += ` AND (name LIKE ? OR email LIKE ? OR trx_id LIKE ? OR id = ?)`;
            countQuery += ` AND (name LIKE ? OR email LIKE ? OR trx_id LIKE ? OR id = ?)`;

            // Add search term for each condition (4 times for baseQuery, 4 times for countQuery)
            params.push(searchTerm, searchTerm, searchTerm, search);
        }

        // Add sorting by ID descending to get most recent
        baseQuery += ` ORDER BY id DESC LIMIT ? OFFSET ?`;
        params.push(limit, offset);

        // First get total count
        const [countResult] = await queryAsync(countQuery, [...params.slice(0, search ? 4 : 0)]);
        const totalCount = countResult.totalCount;
        const totalPages = Math.ceil(totalCount / limit);

        // Then get paginated data
        const result = await queryAsync(baseQuery, params);

        res.json({
            success: true,
            approvedUsers: result,
            total: totalCount,
            totalPages
        });

    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while fetching rejected users.'
        });
    }
});

// Delete old records endpoint
app.delete('/delete-old-rejected-users', async (req, res) => {
    try {
        const sql = `
        DELETE FROM users 
        WHERE approved = 0 AND payment_ok = 0 
        AND created_at < DATE_SUB(NOW(), INTERVAL 7 DAY)
      `;

        const result = await queryAsync(sql);

        if (result.affectedRows === 0) {
            return res.json({
                success: true,
                message: 'No records matched the criteria'
            });
        }

        res.json({
            success: true,
            message: `Deleted ${result.affectedRows} old rejected user records`
        });

    } catch (error) {
        console.error('Error deleting old records:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting old records'
        });
    }
});

// Delete all rejected users
app.delete('/delete-rejected-users', async (req, res) => {
    try {
        const sql = `DELETE FROM users WHERE approved = 0 AND payment_ok = 0`;
        const result = await queryAsync(sql);

        res.json({
            success: true,
            message: `Deleted ${result.affectedRows} rejected user records`
        });

    } catch (error) {
        console.error('Error deleting rejected users:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting rejected users'
        });
    }
});
app.get('/EasypaisaUsers', (req, res) => {


    const sql = `
        SELECT 
            u.id, 
            u.trx_id, 
            u.refer_by, 
            u.name, 
            u.email, 
            u.sender_name, 
            u.sender_number, 
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
});


app.get('/fetchCommissionData', (req, res) => {
    const sql = 'SELECT * FROM commission';

    con.query(sql, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ status: 'error', error: 'Failed to fetch commission data' });
        }

        res.json({ status: 'success', data: result });
    });
});
// Fetch levels data
app.get('/fetchLevelsData', (req, res) => {
    const sql = 'SELECT id, level, threshold,salary_amount,salary_day,weekly_recruitment FROM levels ORDER BY level ASC';

    con.query(sql, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ status: 'error', error: 'Failed to fetch levels data' });
        }

        res.json({ status: 'success', data: result });
    });
});

app.put('/updateLevelData', (req, res) => {
    const { id, threshold, salary_amount, salary_day, weekly_recruitment } = req.body;

    // Validate input
    const errors = [];
    if (!id) errors.push('ID is required');
    if (threshold === undefined) errors.push('Threshold is required');
    if (salary_amount === undefined) errors.push('Salary amount is required');
    if (salary_day === undefined) errors.push('Salary day is required');
    if (weekly_recruitment === undefined) errors.push('Weekly recruitment is required');
    
    if (errors.length > 0) {
        return res.status(400).json({
            status: 'error',
            message: errors.join(', ')
        });
    }

    // Convert and validate
    const thresholdValue = Number(threshold);
    const salaryAmount = Number(salary_amount);
    const salaryDay = Number(salary_day);
    const weeklyRecruitment = Number(weekly_recruitment);
    
    if (isNaN(thresholdValue)) errors.push('Invalid threshold value');
    if (isNaN(salaryAmount)) errors.push('Invalid salary amount');
    if (isNaN(salaryDay) || salaryDay < 0 || salaryDay > 6) {
        errors.push('Salary day must be 0-6');
    }
    if (isNaN(weeklyRecruitment) || weeklyRecruitment < 0) {
        errors.push('Weekly recruitment must be non-negative');
    }
    
    if (errors.length > 0) {
        return res.status(400).json({
            status: 'error',
            message: errors.join(', ')
        });
    }

    const updateQuery = `
        UPDATE levels 
        SET 
            threshold = ?,
            salary_amount = ?,
            salary_day = ?,
            weekly_recruitment = ?
        WHERE id = ?
    `;
    
    const values = [thresholdValue, salaryAmount, salaryDay, weeklyRecruitment, id];
    
    con.query(updateQuery, values, (err, result) => {
        if (err) {
            console.error('Database update error:', err);
            return res.status(500).json({
                status: 'error',
                message: 'Database operation failed',
                error: err.message
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Level not found'
            });
        }

        res.json({
            status: 'success',
            message: 'Level data updated successfully',
            data: { 
                id, 
                threshold: thresholdValue, 
                salary_amount: salaryAmount, 
                salary_day: salaryDay,
                weekly_recruitment: weeklyRecruitment
            }
        });
    });
});
 
app.get('/fetchLimitsData', (req, res) => {
    const sql = 'SELECT * FROM withdraw_limit';

    con.query(sql, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ status: 'error', error: 'Failed to fetch commission data' });
        }

        res.json({ status: 'success', data: result });
    });
});
app.get('/getUserAccount/:userId', (req, res) => {
    const user_id = req.params.userId;
    if (!user_id) {
        return res.status(400).json({ status: 'error', message: 'User ID is required' });
    }
    let fetchQuery = 'SELECT * FROM users_accounts WHERE user_id = ?';
    let queryParams = [user_id];
    con.query(fetchQuery, queryParams, (err, result) => {
        if (err) {
            console.error('Error fetching user account:', err);
            return res.status(500).json({ status: 'error', error: 'Failed to fetch user account' });
        }
        if (result.length === 0) {
            return res.status(404).json({ status: 'error', message: 'User account not found' });
        }
        res.json({ status: 'success', userAccount: result[0] });

    })
});



app.post('/withdraw', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ status: 'error', error: 'User not logged in' });
    }

    const userId = req.session.userId;
    const { amount, accountName, accountNumber, bankName, totalWithdrawn, team } = req.body;

    if (!amount || !accountName || !accountNumber || !bankName) {
        return res.status(400).json({ status: 'error', error: 'All fields are required' });
    }

    const checkRequestSql = `
        SELECT * FROM withdrawal_requests
        WHERE user_id = ? AND approved = 'pending' AND reject = 0
    `;

    con.query(checkRequestSql, [userId], (err, results) => {
        if (err) {
            return res.status(500).json({ status: 'error', error: 'Failed to check for existing requests', details: err.message });
        }

        if (results.length > 0) {
            return res.status(400).json({ status: 'error', error: 'You already have a pending withdrawal request' });
        }

        const getUserAttemptsSql = `
            SELECT withdrawalAttempts FROM users WHERE id = ?
        `;

        con.query(getUserAttemptsSql, [userId], (err, userResults) => {
            if (err) {
                return res.status(500).json({ status: 'error', error: 'Failed to fetch user withdrawal attempts', details: err.message });
            }

            if (userResults.length === 0) {
                return res.status(500).json({ status: 'error', error: 'User not found' });
            }

            let userAttempts = userResults[0].withdrawalAttempts;

            const effectiveAttempts = userAttempts > 3 ? 3 : userAttempts;

            const checkLimitsSql = `
                SELECT allow_limit 
                FROM withdraw_limit 
                WHERE withdrawalAttempts = ?
            `;

            con.query(checkLimitsSql, [effectiveAttempts], (err, limitResults) => {
                if (err) {
                    return res.status(500).json({ status: 'error', error: 'Failed to check withdrawal limits', details: err.message });
                }

                if (limitResults.length === 0) {
                    return res.status(500).json({ status: 'error', error: 'Withdrawal limit not found' });
                }

                const minimumLimit = limitResults[0].allow_limit;

                const getExchangeFeeSql = `
                    SELECT fee FROM exchange_fee WHERE id = 1
                `;

                con.query(getExchangeFeeSql, (err, feeResults) => {
                    if (err) {
                        return res.status(500).json({ status: 'error', error: 'Failed to fetch exchange fee', details: err.message });
                    }

                    if (feeResults.length === 0) {
                        return res.status(500).json({ status: 'error', error: 'Exchange fee not found' });
                    }

                    const feePercentage = feeResults[0].fee;
                    const fee = (amount * feePercentage) / 100;
                    const amountAfterFee = amount - fee;


                    if (amountAfterFee < minimumLimit) {
                        return res.status(400).json({ status: 'error', error: `Minimum withdrawal amount is ${minimumLimit}$` });
                    }
                    con.beginTransaction(err => {
                        if (err) {
                            return res.status(500).json({ status: 'error', error: 'Failed to start transaction' });
                        }

                        const withdrawSql = `
                            INSERT INTO withdrawal_requests (user_id, amount, account_name, account_number, bank_name,  total_withdrawn, team, request_date, approved, fee)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), 'pending', ?)
                        `;

                        con.query(withdrawSql, [userId, amountAfterFee, accountName, accountNumber, bankName, totalWithdrawn, team, fee], (err, withdrawResult) => {
                            if (err) {
                                return con.rollback(() => {
                                    res.status(500).json({ status: 'error', error: 'Failed to make withdrawal', details: err.message });
                                });
                            }

                            con.commit(err => {
                                if (err) {
                                    return con.rollback(() => {
                                        res.status(500).json({ status: 'error', error: 'Failed to commit transaction', details: err.message });
                                    });
                                }
                                res.json({ status: 'success', message: 'Withdrawal request submitted successfully' });
                            });
                        });
                    });
                });
            });
        });
    });
});



app.put('/updateWithdrawData', (req, res) => {
    const { id, withdrawalAttempts, allow_limit } = req.body;

    if (!withdrawalAttempts || !allow_limit) {
        return res.status(400).json({ status: 'error', message: 'Min Team, Max Team, and Level are required' });
    }

    let updateQuery = `
        UPDATE withdraw_limit

        SET 
            withdrawalAttempts = ?,
            allow_limit = ?
        WHERE id = ?`;
    let queryParams = [withdrawalAttempts, allow_limit, id];


    con.query(updateQuery, queryParams, (err, result) => {
        if (err) {
            console.error('Error updating level data:', err);
            return res.status(500).json({ status: 'error', error: 'Failed to update level data' });
        }


        if (result.affectedRows === 0) {
            return res.status(404).json({ status: 'error', message: 'Level data not found' });
        }

        res.json({ status: 'success', message: 'Level data updated successfully' });
    });
});


app.put('/updateCommissionData', (req, res) => {
    const { id, direct_bonus, indirect_bonus } = req.body;

    if (!direct_bonus || !indirect_bonus) {
        return res.status(400).json({ status: 'error', message: 'Direct Bonus and Indirect Bonus are required' });
    }

    let updateQuery;
    let queryParams;

    if (id === 0) {
        updateQuery = `
            UPDATE commission
            SET 
                direct_bonus = ?,
                indirect_bonus = ?
            WHERE id = 0`;
        queryParams = [direct_bonus, indirect_bonus];
    } else {
        updateQuery = `
            UPDATE commission
            SET 
                direct_bonus = ?,
                indirect_bonus = ?
            WHERE id = ?`;
        queryParams = [direct_bonus, indirect_bonus, id];
    }


    con.query(updateQuery, queryParams, (err, result) => {
        if (err) {
            console.error('Error updating commission data:', err);
            return res.status(500).json({ status: 'error', error: 'Failed to update commission data' });
        }


        if (result.affectedRows === 0) {
            return res.status(404).json({ status: 'error', message: 'Commission data not found' });
        }

        res.json({ status: 'success', message: 'Commission data updated successfully' });
    });
});










app.get('/withdrawal-requests', (req, res) => {
    const userId = req.session.userId;

    if (!userId) {
        return res.status(401).json({ error: 'User not logged in' });
    }

    const sql = 'SELECT id, user_id,msg, approved_time, reject,account_number,fee, amount, bank_name,account_name, approved FROM withdrawal_requests WHERE user_id = ? ORDER BY request_date DESC';

    con.query(sql, [userId], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to fetch withdrawal requests' });
        }

        const formattedResults = results.map(request => ({
            id: request.id,
            uid: request.user_id,
            date: request.approved_time,
            amount: request.amount,
            bank_name: request.bank_name,
            approved: request.approved,
            reject: request.reject,
            account_number: request.account_number,
            account_name: request.account_name,
            fee: request.fee,
            msg: request.msg

        }));
        res.json(formattedResults);
    });
});

app.get('/find-referer-users', (req, res) => {
    const { refererId } = req.query;

    con.query(
        `SELECT * FROM users WHERE refer_by = ? AND approved = 1 AND payment_ok = 1`,
        [refererId],
        (err, results) => {
            if (err) {
                console.error('Error fetching referer users:', err);
                return res.status(500).json({ success: false, message: 'Internal Server Error' });
            }

            res.json({
                success: true,
                users: results,
                totalCount: results.length
            });
        }
    );
});


app.get('/find-users', async (req, res) => {
    try {
        const { searchTerm, page = 1, perPage = 10, sortKey = 'id', sortDirection = 'asc' } = req.query;

        const allowedSortKeys = ['id', 'name', 'email', 'phoneNumber', 'refer_by', 'balance', 'trx_id', 'total_withdrawal', 'team', 'created_at'];
        const allowedDirections = ['asc', 'desc'];

        if (!allowedSortKeys.includes(sortKey) || !allowedDirections.includes(sortDirection)) {
            return res.status(400).json({ success: false, message: 'Invalid sort parameters' });
        }
        if (!searchTerm) {
            return res.json({
                success: true,
                users: [],
                totalCount: 0,
                totalPages: 0
            });
        }


        const offset = (page - 1) * perPage;

        let query = `
        SELECT 
          *,
          CASE 
            WHEN blocked = 1 THEN 'Blocked'
            WHEN payment_ok = 1 AND approved = 1 THEN 'Active'
            WHEN payment_ok = 1 AND approved = 0 THEN 'Pending Approval'
            WHEN payment_ok = 0 AND approved = 0 THEN 'Pending'
            ELSE 'Unknown'
          END AS status
        FROM users
      `;

        let countQuery = 'SELECT COUNT(*) AS totalCount FROM users';
        let params = [];
        let countParams = [];

        if (searchTerm) {
            const searchCondition = `
          WHERE 
            CAST(id AS CHAR) LIKE ? OR 
            email LIKE ? OR 
            phoneNumber LIKE ? OR 
            trx_id LIKE ?
        `;
            const searchPattern = `%${searchTerm}%`;

            query += searchCondition;
            countQuery += searchCondition;

            params = [searchPattern, searchPattern, searchPattern, searchPattern];
            countParams = [...params];
        }

        query += ` ORDER BY ${sortKey} ${sortDirection}`;
        query += ' LIMIT ? OFFSET ?';
        params.push(parseInt(perPage), parseInt(offset));

        const users = await queryAsync(query, params);
        const countResult = await queryAsync(countQuery, countParams);
        const totalCount = countResult[0]?.totalCount || 0;
        const totalPages = Math.ceil(totalCount / perPage);

        res.json({
            success: true,
            users,
            totalCount,
            totalPages,
        });

    } catch (error) {
        console.error('Error in /find-users:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Update user endpoint
app.put('/update-user', async (req, res) => {
    try {
        const { id, name, email, phoneNumber, balance, team, trx_id, total_withdrawal } = req.body;

        if (!id) {
            return res.status(400).json({ success: false, message: 'User ID is required' });
        }

        const updateQuery = `
        UPDATE users 
        SET 
          name = COALESCE(?, name),
          email = COALESCE(?, email),
          phoneNumber = COALESCE(?, phoneNumber),
          balance = COALESCE(?, balance),
          team = COALESCE(?, team),
          trx_id = COALESCE(?, trx_id),
          total_withdrawal = COALESCE(?, total_withdrawal)
        WHERE id = ?
      `;

        const result = await queryAsync(updateQuery, [
            name, email, phoneNumber, balance,
            team, trx_id, total_withdrawal, id
        ]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({ success: true, message: 'User updated successfully' });

    } catch (error) {
        console.error('Error in /update-user:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

app.get('/all-withdrawal-requests', (req, res) => {
    const sql = `
        SELECT wr.id, wr.user_id, wr.amount, wr.account_name, wr.bank_name,  
         wr.account_number, wr.approved, wr.team, wr.total_withdrawn, u.name AS user_name ,u.balance
        FROM withdrawal_requests wr
        JOIN users u ON wr.user_id = u.id
        WHERE wr.approved = "pending" AND wr.reject = "0"
    `;

    con.query(sql, (error, results) => {
        if (error) {
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }
        const mappedResults = results.map(item => ({
            id: item.id,
            user_id: item.user_id,
            amount: item.amount,
            account_name: item.account_name,
            bank_name: item.bank_name,
            account_number: item.account_number,
            approved: item.approved === 1,
            team: item.team,
            total_withdrawn: item.total_withdrawn,
            user_name: item.user_name, // Add user_name here
            balance: item.balance
        }));
        res.json(mappedResults);
    });
});







app.put('/updateUserDataEasyPaisa/:id', (req, res) => {
    const { id } = req.params;
    const { refer_by, trx_id,  email,name } = req.body;


    if (!refer_by || !trx_id) {
        return res.status(400).json({ status: 'error', message: 'All fields are required' });
    }

    const updateQuery = `
        UPDATE users 
        SET 
            refer_by = ?, 
            trx_id = ?, 
            email = ?,
            name = ?

        WHERE id = ?
    `;
    const queryParams = [refer_by, trx_id, email,name, id];

    con.query(updateQuery, queryParams, (err, result) => {
        if (err) {
            console.error('Error updating user data:', err);
            return res.status(500).json({ status: 'error', error: 'Failed to update user data' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ status: 'error', message: 'User not found' });
        }

        res.json({ status: 'success', message: 'User data updated successfully' });
    });
});



const queryAsync = (query, params) => {
    return new Promise((resolve, reject) => {
        con.query(query, params, (error, results) => {
            if (error) {
                return reject(error);
            }
            resolve(results);
        });
    });
};




app.post('/approve-withdrawal', async (req, res) => {
    const { userId, requestId, amount } = req.body;

    if (!userId || !requestId || !amount) {
        return res.status(400).json({ error: 'User ID, request ID, and amount are required' });
    }

    const updateWithdrawalRequestsSql = `
        UPDATE withdrawal_requests 
        SET approved = 'approved', reject = 0, approved_time = CURRENT_TIMESTAMP 
        WHERE id = ? AND user_id = ? AND (approved = 'pending' OR approved = 'rejected')`;

    const updateUserBalanceAndTotalWithdrawalSql = `
        UPDATE users
        SET balance = balance - ?,
            total_withdrawal = total_withdrawal + ?,
            withdrawalAttempts = withdrawalAttempts + 1
        WHERE id = ?`;

    const insertNotificationSql = `
        INSERT INTO notifications (user_id, msg, created_at)
        VALUES (?, 'Your withdrawal has been approved', CURRENT_TIMESTAMP)`;

    con.beginTransaction(error => {
        if (error) {
            console.log(error);

            return res.status(500).json({ error: 'Internal Server Error' });
        }

        con.query(updateWithdrawalRequestsSql, [requestId, userId], (error, results) => {
            if (error) {
                console.log(error);

                return con.rollback(() => {
                    res.status(500).json({ error: 'Internal Server Error' });
                });
            }

            if (results.affectedRows === 0) {
                return res.status(400).json({ error: 'Could not find the withdrawal request or it is already approved' });
            }

            con.query(updateUserBalanceAndTotalWithdrawalSql, [amount, amount, userId], (error, results) => {
                if (error) {
                    console.log(error);

                    return con.rollback(() => {
                        res.status(500).json({ error: 'Internal Server Error' });
                    });
                }


                con.query(insertNotificationSql, [userId], (error) => {
                    if (error) {
                        console.log(error);
                        return con.rollback(() => {
                            res.status(500).json({ error: 'Failed to insert notification' });
                        });
                    }

                    con.commit(error => {
                        if (error) {
                            console.log(error);

                            return con.rollback(() => {
                                res.status(500).json({ error: 'Failed to commit transaction' });
                            });
                        }

                        res.json({ message: 'Withdrawal request approved, balance and total withdrawal updated, user clicks data, referrals deleted, and notification sent successfully!' });
                    });
                });
            });
        });
    });


});
app.post('/delete-withdrawal', async (req, res) => {
    const { requestId, userId } = req.body;

    if (!requestId || !userId) {
        return res.status(400).json({ error: 'Request ID and User ID are required' });
    }

    const updateWithdrawalRequestsSql = `
        DELETE FROM withdrawal_requests 
        WHERE id=? AND user_id=? ;
    `;

    try {
        con.query(updateWithdrawalRequestsSql, [requestId, userId], (err, result) => {
            if (err) {
                console.error('Error executing query', err);
                return res.status(500).json({ error: 'Internal server error' });
            }

            if (result.affectedRows > 0) {
                return res.json({ message: 'Withdrawal request deleted successfully' });
            } else {
                return res.status(404).json({ error: 'No matching withdrawal request found' });
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }

});


app.post('/reject-withdrawal', async (req, res) => {
    const { requestId, userId, reason = 'No reason provided' } = req.body;
    console.log(requestId, userId, reason);

    if (!requestId || !userId) {
        return res.status(400).json({ error: 'Request ID and User ID are required' });
    }

    if (!reason) {
        return res.status(400).json({ error: 'Rejection reason is required' });
    }

    const updateWithdrawalRequestsSql = `
        UPDATE withdrawal_requests 
        SET 
            reject = 1, 
            approved = 'rejected', 
            reject_at = CURRENT_TIMESTAMP,
            msg = ?
        WHERE id = ? AND user_id = ?;
    `;

    try {
        con.query(updateWithdrawalRequestsSql, [reason, requestId, userId], (err, result) => {
            if (err) {
                console.error('Error executing query', err);
                return res.status(500).json({ error: 'Internal server error' });
            }

            if (result.affectedRows > 0) {
                return res.json({ message: 'Withdrawal request rejected successfully!' });
            } else {
                return res.status(404).json({ error: 'No matching withdrawal request found' });
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/withdrawalRequestsApproved', (req, res) => {
    const { search = '', limit = 50 } = req.query;

    // Base SQL query
    let sql = `
        SELECT * 
        FROM withdrawal_requests 
        WHERE approved = "approved" AND reject = 0
    `;

    // Add search conditions if search term exists
    const params = [];
    if (search) {
        sql += ` AND (
            id = ? OR 
            account_name LIKE ? OR 
            account_number LIKE ?
        )`;
        params.push(
            search,
            `%${search}%`,
            `%${search}%`
        );
    }

    // Add ordering and limiting
    sql += ' ORDER BY approved_time DESC LIMIT ?';
    params.push(parseInt(limit));

    con.query(sql, params, (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({
                status: 'error',
                error: 'Failed to fetch approved withdrawal requests'
            });
        }

        if (results.length === 0) {
            return res.status(200).json({
                status: 'success',
                message: 'No approved withdrawal requests found',
                data: []
            });
        }

        res.json({
            status: 'success',
            data: results
        });
    });
});

app.get('/withdrawalRequestsRejected', (req, res) => {
    const sql = 'SELECT * FROM withdrawal_requests WHERE approved = "rejected"';

    con.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({ status: 'error', error: 'Failed to fetch approved withdrawal requests' });
        }

        if (results.length === 0) {
            return res.status(404).json({ status: 'error', message: 'No approved withdrawal requests found' });
        }

        res.json({ status: 'success', data: results });
    });
});
app.delete('/delete-rejected-withdrawals', (req, res) => {
    const sql = 'DELETE FROM withdrawal_requests WHERE reject = 1 AND approved = "rejected" ';

    con.query(sql, (err, result) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({
                success: false,
                message: "Failed to delete rejected withdrawals"
            });
        }

        res.status(200).json({
            success: true,
            message: `${result.affectedRows} rejected withdrawals deleted successfully`
        });
    });
});

app.get('/products', (req, res) => {
    const sql = 'SELECT * FROM products';

    con.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'An error occurred while fetching the products.' });
        }

        res.status(200).json({ success: true, data: results });
    });
});
app.get('/fetchClickedProducts', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ status: 'error', error: 'User not authenticated' });
    }

    const userId = req.session.userId;

    const getUnclickedProductsSql = `
    SELECT * FROM products p
    WHERE NOT EXISTS (
        SELECT 1 FROM user_product_clicks upc 
        WHERE upc.user_id = ? 
        AND upc.product_id = p.id 
        AND DATE(upc.last_clicked) = CURDATE()
    )
`;


    con.query(getUnclickedProductsSql, [userId], (err, productResults) => {
        if (err) {
            console.error('Error fetching unclicked products:', err);
            return res.status(500).json({ status: 'error', error: 'Failed to fetch unclicked products' });
        }

        res.json({
            status: 'success',
            products: productResults
        });
    });
});




app.post('/products', (req, res) => {
    const { description, link, reward, imgLink } = req.body;
    console.log(req.body);
    if (!description || !link || !imgLink) {
        return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    const product = { description, link, imgLink };
    const sql = 'INSERT INTO products SET ?';

    con.query(sql, product, (err, result) => {
        if (err) {
            console.log(err);

            return res.status(500).json({ success: false, message: 'An error occurred while adding the product.' }

            );

        }
        res.status(201).json({ success: true, message: 'Product added successfully.' });
    });
});

app.delete('/products/:id', (req, res) => {
    const id = req.params.id;

    if (!id) {
        return res.status(400).json({ success: false, message: 'ID is required.' });
    }

    const sql = 'DELETE FROM products WHERE id = ?';
    con.query(sql, [id], (err, result) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'An error occurred while deleting the product.' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Product not found.' });
        }

        res.status(200).json({ success: true, message: 'Product deleted successfully.' });
    });
});

app.put('/products/:id', (req, res) => {
    const id = req.params.id;
    const { description, link, imgLink } = req.body;
    console.log(req.body);
    if (!description || !link || !imgLink) {
        return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    const sql = 'UPDATE products SET description = ?, link = ?,  imgLink = ? WHERE id = ?';

    con.query(sql, [description, link, imgLink, id], (err, result) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'An error occurred while updating the product.' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Product not found.' });
        }

        res.status(200).json({ success: true, message: 'Product updated successfully.' });
    });
});

app.get('/user/:id', (req, res) => {
    const userId = req.params.id;
    let sql = `SELECT * FROM users WHERE id = ${con.escape(userId)}`;
    con.query(sql, (err, result) => {
        if (err) {
            res.status(500).send(err);
            return;
        }

        if (result.length === 0) {
            res.status(404).send({ message: 'User not found' });
            return;
        }

        res.send(result[0]);
    });
});







app.get('/get-offer', (req, res) => {
    const sql = 'SELECT offer FROM offer WHERE id = ?';

    const accountId = 1;

    con.query(sql, [accountId], (err, result) => {
        if (err) {
            console.error('Error fetching offer:', err);
            return res.status(500).json({ success: false, message: 'An error occurred while fetching the offer.' });
        }

        if (result.length > 0) {
            const offerValue = result[0].offer;
            res.status(200).json({ success: true, offer: offerValue });
        } else {
            res.status(404).json({ success: false, message: 'No offer found for the given account ID.' });
        }
    });
});


app.get('/get-fee', (req, res) => {
    // Query to get the joining_fee
    const feeSql = 'SELECT joining_fee FROM joining_fee WHERE id = ?';
    const accountId = 1;

    con.query(feeSql, [accountId], (feeErr, feeResult) => {
        if (feeErr) {
            console.error('Error fetching fee:', feeErr);
            return res.status(500).json({ success: false, message: 'An error occurred while fetching the fee.' });
        }

        if (feeResult.length > 0) {
            const feeValue = feeResult[0].joining_fee;

            // Now, query the usd_rate table to get the rate
            const rateSql = 'SELECT rate FROM usd_rate LIMIT 1'; // Assuming there's only one row
            con.query(rateSql, (rateErr, rateResult) => {
                if (rateErr) {
                    console.error('Error fetching rate:', rateErr);
                    return res.status(500).json({ success: false, message: 'An error occurred while fetching the rate.' });
                }

                if (rateResult.length > 0) {
                    const rate = rateResult[0].rate;
                    const feeInPkr = feeValue; // Multiply fee by rate

                    res.status(200).json({ success: true, fee: feeInPkr });
                } else {
                    res.status(404).json({ success: false, message: 'No rate found in the usd_rate table.' });
                }
            });
        } else {
            res.status(404).json({ success: false, message: 'No fee found for the given account ID.' });
        }
    });
});
// Create subadmins table if not exists
const createSubAdminsTable = `
CREATE TABLE IF NOT EXISTS subadmins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  task ENUM('ApproveUser', 'ApproveWithdrawal') NOT NULL
)`;
con.query(createSubAdminsTable, (err) => {
    if (err) console.error('Error creating subadmins table:', err);
});

// 1. Get all sub-admins
app.get('/subadmins', (req, res) => {
    const sql = "SELECT id, username,password, task FROM subadmins";
    con.query(sql, (err, result) => {
        if (err) {
            return res.status(500).json({
                status: 'error',
                message: 'Failed to fetch sub-admins'
            });
        }
        res.json({ status: 'success', data: result });
    });
});

// 2. Add new sub-admin
app.post('/subadmins', (req, res) => {
    const { username, password, task } = req.body;

    if (!username || !password || !task) {
        return res.status(400).json({
            status: 'error',
            message: 'All fields are required'
        });
    }

    if (!['ApproveUser', 'ApproveWithdrawal'].includes(task)) {
        return res.status(400).json({
            status: 'error',
            message: 'Invalid task type'
        });
    }

    const sql = "INSERT INTO subadmins (username, password, task) VALUES (?, ?, ?)";
    con.query(sql, [username, password, task], (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({
                    status: 'error',
                    message: 'Username already exists'
                });
            }
            return res.status(500).json({
                status: 'error',
                message: 'Failed to create sub-admin'
            });
        }

        res.json({
            status: 'success',
            message: 'Sub-admin created successfully',
            id: result.insertId
        });
    });
});

// 3. Update sub-admin
app.put('/subadmins/:id', (req, res) => {
    const { id } = req.params;
    const { username, password, task } = req.body;

    if (!username || !task) {
        return res.status(400).json({
            status: 'error',
            message: 'Username and task are required'
        });
    }

    if (!['ApproveUser', 'ApproveWithdrawal'].includes(task)) {
        return res.status(400).json({
            status: 'error',
            message: 'Invalid task type'
        });
    }

    let sql, params;
    if (password) {
        sql = "UPDATE subadmins SET username = ?, password = ?, task = ? WHERE id = ?";
        params = [username, password, task, id];
    } else {
        sql = "UPDATE subadmins SET username = ?, task = ? WHERE id = ?";
        params = [username, task, id];
    }

    con.query(sql, params, (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({
                    status: 'error',
                    message: 'Username already exists'
                });
            }
            return res.status(500).json({
                status: 'error',
                message: 'Failed to update sub-admin'
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Sub-admin not found'
            });
        }

        res.json({
            status: 'success',
            message: 'Sub-admin updated successfully'
        });
    });
});

// 4. Delete sub-admin
app.delete('/subadmins/:id', (req, res) => {
    const { id } = req.params;

    const sql = "DELETE FROM subadmins WHERE id = ?";
    con.query(sql, [id], (err, result) => {
        if (err) {
            return res.status(500).json({
                status: 'error',
                message: 'Failed to delete sub-admin'
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Sub-admin not found'
            });
        }

        res.json({
            status: 'success',
            message: 'Sub-admin deleted successfully'
        });
    });
});

app.get('/get-percentage', (req, res) => {
    const sql = 'SELECT initial_percent FROM initial_fee WHERE id = 1';
    con.query(sql, (err, result) => {
        if (err) {
            console.error('Error fetching fee:', err);
            return res.status(500).json({ success: false, message: 'An error occurred while fetching the fee.' });
        }
        else {
            if (result.length > 0) {
                const feeValue = result[0].initial_percent;
                res.status(200).json({ success: true, initial_percent: feeValue });
            } else {
                res.status(404).json({ success: false, message: 'No fee found for the given account ID.' });
            }
        }
    })


});



app.post('/update-fee', (req, res) => {
    const { newFeeValue } = req.body;

    const accountId = 1;

    const updateSql = 'UPDATE joining_fee SET joining_fee = ? WHERE id = ?';

    con.query(updateSql, [newFeeValue, accountId], (err, result) => {
        if (err) {
            console.error('Error updating fee:', err);
            return res.status(500).json({ success: false, message: 'An error occurred while updating the fee.' });
        }

        if (result.affectedRows > 0) {
            res.status(200).json({ success: true, message: 'Fee updated successfully.' });
        } else {
            res.status(404).json({ success: false, message: 'No fee found for the given account ID.' });
        }
    });
});


app.post('/update-percentage', (req, res) => {
    const { newFeeValue } = req.body;

    const accountId = 1;

    const updateSql = 'UPDATE initial_fee   SET initial_percent = ? WHERE id = 1';

    con.query(updateSql, [newFeeValue, accountId], (err, result) => {
        if (err) {
            console.error('Error updating fee:', err);
            return res.status(500).json({ success: false, message: 'An error occurred while updating the fee.' });
        }

        if (result.affectedRows > 0) {
            res.status(200).json({ success: true, message: 'Fee updated successfully.' });
        } else {
            res.status(404).json({ success: false, message: 'No fee found for the given account ID.' });
        }
    });
});
app.get('/pending-users', (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.perPage) || 10;
    const searchTerm = req.query.searchTerm || '';

    const offset = (page - 1) * perPage;

    let sql = 'SELECT * FROM users WHERE payment_ok = 0 AND approved = 0';

    if (searchTerm) {
        sql += ` AND (name LIKE '%${searchTerm}%' OR email LIKE '%${searchTerm}%' OR id = '${searchTerm}')`;
    }

    sql += ` LIMIT ? OFFSET ?`;

    const countSql = `SELECT COUNT(*) AS totalCount FROM users WHERE payment_ok = 0 AND approved = 0 ${searchTerm ? `AND (name LIKE '%${searchTerm}%' OR email LIKE '%${searchTerm}%' OR id = '${searchTerm}')` : ''}`;

    con.query(sql, [perPage, offset], (err, result) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'An error occurred while fetching the pending users.' });
        }

        con.query(countSql, (countErr, countResult) => {
            if (countErr) {
                return res.status(500).json({ success: false, message: 'An error occurred while fetching total count.' });
            }

            const totalCount = countResult[0].totalCount;

            res.status(200).json({
                success: true,
                pendingUsers: result,
                totalCount: totalCount,
                currentPage: page,
                totalPages: Math.ceil(totalCount / perPage)
            });
        });
    });
});


// Add this endpoint to your backend
app.delete('/deleteUser/:id', (req, res) => {
    const userId = req.params.id;

    const sql = 'DELETE FROM users WHERE id = ?';

    con.query(sql, [userId], (err, result) => {
        if (err) {
            console.error('Error deleting user:', err);
            return res.status(500).json({ success: false, message: 'Failed to delete user' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({ success: true, message: 'User deleted successfully' });
    });
});
app.put('/blockUser/:id', (req, res) => {
    const userId = req.params.id;
    const { blocked } = req.body; // Expect 0 or 1

    if (blocked !== 0 && blocked !== 1) {
        return res.status(400).json({ success: false, message: 'Invalid blocked value' });
    }

    const sql = 'UPDATE users SET blocked = ? WHERE id = ?';

    con.query(sql, [blocked, userId], (err, result) => {
        if (err) {
            console.error('Error updating block status:', err);
            return res.status(500).json({ success: false, message: 'Failed to update block status' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const statusMsg = blocked === 1 ? 'blocked' : 'unblocked';
        res.json({ success: true, message: `User ${statusMsg} successfully`, blocked });
    });
});

app.delete('/delete-7-days-old-users', (req, res) => {
    // Calculate the date 7 days ago
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Format to MySQL datetime (YYYY-MM-DD HH:MM:SS)
    const formattedDate = sevenDaysAgo.toISOString().slice(0, 19).replace('T', ' ');

    const sql = `
        DELETE FROM users 
        WHERE payment_ok = 0 
          AND approved = 0 
          AND created_at <= ?
    `;

    con.query(sql, [formattedDate], (err, result) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({
                success: false,
                message: "Database operation failed"
            });
        }

        res.status(200).json({
            success: true,
            message: `${result.affectedRows} users deleted successfully`,
            deletedCount: result.affectedRows
        });
    });
});

app.post('/upload', upload.single('image'), (req, res) => {

    const { filename, path: filePath, size } = req.file;
    const uploadTime = new Date();

    const query = 'INSERT INTO images (file_name, file_path, upload_time) VALUES (?, ?, ?)';
    const values = [filename, filePath, uploadTime];

    con.query(query, values, (error, results, fields) => {
        if (error) throw error;

        res.json({ message: 'File uploaded and data saved successfully' });
    });
});





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

app.post('/update-password', (req, res) => {
    const userId = req.session.userId;
    const { currentPassword, newPassword } = req.body;

    if (!userId) {
        return res.status(401).json({ success: false, message: 'User not logged in' });
    }

    const getPasswordSql = 'SELECT password FROM users WHERE id = ?';

    con.query(getPasswordSql, [userId], (err, results) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Database error' });
        }

        if (results.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const currentStoredPassword = results[0].password;

        if (currentPassword !== currentStoredPassword) {
            return res.status(400).json({ success: false, message: 'Current password is incorrect' });
        }

        const updatePasswordSql = 'UPDATE users SET password = ? WHERE id = ?';

        con.query(updatePasswordSql, [newPassword, userId], (err) => {
            if (err) {
                return res.status(500).json({ success: false, message: 'Failed to update password' });
            }

            res.json({ success: true, message: 'Password updated successfully' });
        });
    });
});



app.get('/approvedUserNames/:referByUserId', async (req, res) => {
    const { referByUserId } = req.params;

    try {
        const users = await fetchApprovedUserNames(referByUserId);
        res.json({ status: 'success', users });
    } catch (error) {
        console.error('Error fetching approved users:', error);
        res.status(500).json({ status: 'error', error: 'Failed to fetch approved users' });
    }
});

app.post('/payment', (req, res) => {
    const { trx_id, id } = req.body;

    const payment_ok = 1;
    const rejected = 0;
    console.log(req.body);
    console.log();


    const checkQuery = 'SELECT COUNT(*) AS count FROM users WHERE trx_id = ?';
    con.query(checkQuery, [trx_id], (checkErr, checkResults) => {
        if (checkErr) {
            return res.status(500).json({ status: 'error', error: 'Database error' });
        }

        if (checkResults[0].count > 0) {
            return res.status(400).json({ status: 'error', error: 'Transaction ID already in use' });
        }

        const sql = 'UPDATE users SET trx_id = ?, payment_ok = ?, rejected = ? WHERE id = ?';

        con.query(sql, [trx_id, payment_ok, rejected, id], (err, result) => {
            if (err) {
                console.error('Database update error:', err);
                return res.status(500).json({ status: 'error', error: 'Failed to update payment data' });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({ status: 'error', error: 'User not found' });
            }

            res.json({ status: 'success' });
        });
    });
});

app.listen( process.env.PORT, () => {
    console.log('Listening on port ' +  process.env.PORT);
});