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
import  MonthData  from './routes/MonthlyMatrixRoute.js';
import UserLogin from './routes/UserLogin.js';
import registerUser from './routes/UserRegisterRoute.js';
import getUserWallet from './routes/GetUserWalletRoute.js';
import getUserData from './routes/UserContextDataRoute.js';
import getBep20Account from './routes/AdminWalletAddress.js';
import getBep20Addresses from './routes/AllAdminWallet.js';
import getAllAdmins from './routes/getAllAdmin.js';
import getToadyApprovedUsers from './routes/GetToadyApprovedUsers.js';
import getUserSalaryStatus  from './routes/GetUserSalaryStatusRoute.js';
import getUserIdFromSession from './utils/getSessionMiddleware.js';
import getPendingForApproveUsers from './routes/PendingForApproveUser.js';
import  getUserTaskStatus  from './routes/getUserTaskStatus.js';
import  getUserWithdrawalRequests  from './routes/GetUserWithdraw.js';
import getAllApprovedUsers from './routes/getAllApprovedUsers.js';
import FindReferrer from './routes/FindReferrer.js';
import monthlyLevelsRoutes from './routes/monthlyLevels.js'; // Adjust path as needed
import monthlySalaryRoutes from './routes/monthlySalary.js'; // Adjust path as needed
import adminProfileCardRoutes from './routes/adminProfileCardRoutes.js';


import https from 'https';


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
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
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

 

app.use('/', dashboardRoutes);
app.use('/', UserLogin);
app.use('/', notificationRoutes); 
app.use('/', userRoutes);
app.get('/getUserIdFromSession', getUserIdFromSession);
app.use('/', MonthData);
app.use('/',registerUser);
app.use('/',getUserWallet);
app.use('/',getUserSalaryStatus);
app.use('/',getUserData);
app.use('/',getBep20Account);
app.use('/',getBep20Addresses);
app.use('/',getAllAdmins)
app.use('/',getPendingForApproveUsers)
app.use('/',getToadyApprovedUsers)
app.use('/',getUserTaskStatus)
app.use('/',getUserWithdrawalRequests);
app.use('/',getAllApprovedUsers)
app.use('/',FindReferrer)
app.use('/api/monthly-levels', monthlyLevelsRoutes); // Prefix all routes in monthlyLevels.js with /api/monthly-levels
app.use('/api/monthly-salary', monthlySalaryRoutes);
app.use('/api', adminProfileCardRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.urlencoded({ extended: true }));




const storage = multer.diskStorage({
    destination: './uploads/',
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });














app.get('/', (req, res) => {
    res.send(`Loading...`);

});








app.get('/api/salary-history', async (req, res) => {
  const userId = req.session.userId; // This should be set by your authenticateUser middleware

  if (!userId) {
      console.error('User ID not found in session for salary history request.');
      return res.status(401).json({ status: 'error', message: 'Unauthorized: User ID missing.' });
  }

  try {

    const [rows] = await con.promise().query(
      'SELECT id, user_id, level, amount, payment_week, created_at FROM salary_payments WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
console.log(rows);

    // --- 3. Format the Data (Optional, but good practice) ---
    const formattedHistory = rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      level: row.level,
      amount: row.amount, // Keep as string to preserve decimal places if needed, or parseFloat(row.amount).toFixed(2)
      paymentWeek: row.payment_week,
      // Format the date for easier frontend consumption if needed
      paymentDate: row.created_at.toISOString().split('T')[0], // YYYY-MM-DD
      paymentDateTime: row.created_at.toISOString(), // Full ISO string
      // You could add more formatting here, like extracting date/time parts
      date: row.created_at.toLocaleDateString('en-US'), // Example: 7/30/2025
      time: row.created_at.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) // Example: 7:44 PM
    }));

    // --- 4. Send Success Response ---
    res.json({
      status: 'success',
      message: 'Salary history fetched successfully.',
      history: formattedHistory
      // Optionally include count: formattedHistory.length
    });

  } catch (error) {
    // --- 5. Handle Errors ---
    console.error('Error fetching salary history for user ID:', userId, error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while fetching salary history. Please try again later.'
      // Avoid sending raw error messages to frontend in production
    });
  }
});

app.post('/collect-salary', async (req, res) => {
    const userId = req.session.userId;
    
    const currentWeek = parseInt(moment().format('YYYYWW'));
    const today = moment().day();
    console.log(userId+"ddddd"+today);

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









app.put('/updateProfile', upload.single('profilePicture'), async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ status: 'error', error: 'User not logged in' });
    }

    const { name, currentPassword, newPassword, phoneNumber } = req.body;

    // Validation
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
            // Simple password comparison (in production, use bcrypt)
            if (userPassword !== currentPassword) {
                return res.status(400).json({ status: 'error', error: 'Current password is incorrect' });
            }

            // Update the password
            const updatePasswordQuery = 'UPDATE users SET password = ? WHERE id = ?';
            con.query(updatePasswordQuery, [newPassword, req.session.userId], (err, result) => {
                if (err) {
                    return res.status(500).json({ status: 'error', error: 'Failed to update password' });
                }

                // Update other fields (name, profile picture, phone number)
                const updateUserDataQuery = 'UPDATE users SET name = ?, profile_picture = ?, phoneNumber = ? WHERE id = ?';
                con.query(updateUserDataQuery, [name, profilePicturePath || existingProfilePicture, phoneNumber, req.session.userId], (err, result) => {
                    if (err) {
                        return res.status(500).json({ status: 'error', error: 'Failed to update profile' });
                    }

                    // Delete existing profile picture if a new one is uploaded
                    if (existingProfilePicture && req.file) {
                        // Check if file exists before trying to delete
                        fs.access(existingProfilePicture, fs.constants.F_OK, (err) => {
                            if (!err) {
                                // File exists, safe to delete
                                fs.unlink(existingProfilePicture, (unlinkErr) => {
                                    if (unlinkErr) {
                                        console.error('Failed to delete existing profile picture:', unlinkErr);
                                    }
                                });
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
                    // Check if file exists before trying to delete
                    fs.access(existingProfilePicture, fs.constants.F_OK, (err) => {
                        if (!err) {
                            // File exists, safe to delete
                            fs.unlink(existingProfilePicture, (unlinkErr) => {
                                if (unlinkErr) {
                                    console.error('Failed to delete existing profile picture:', unlinkErr);
                                }
                            });
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





// Unified user rejection endpoint
app.put('/rejectUserCurrMin/:userId', async (req, res) => {
            const userId = req.params.userId;

    try {
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
    const { amount, accountNumber, bankName, totalWithdrawn, team } = req.body;

    if (!amount || !accountNumber || !bankName) {
        return res.status(400).json({ status: 'error', error: 'All fields are required' });
    }

    const checkRequestSql = `
        SELECT * FROM withdrawal_requests
        WHERE user_id = ? AND approved = 'pending' AND reject = 0
    `;

    con.query(checkRequestSql, [userId], (err, results) => {
        if (err) return res.status(500).json({ status: 'error', error: 'Failed to check for existing requests', details: err.message });

        if (results.length > 0) {
            return res.status(400).json({ status: 'error', error: 'You already have a pending withdrawal request' });
        }

        const getUserAttemptsSql = `SELECT withdrawalAttempts FROM users WHERE id = ?`;

        con.query(getUserAttemptsSql, [userId], (err, userResults) => {
            if (err) return res.status(500).json({ status: 'error', error: 'Failed to fetch user attempts', details: err.message });

            if (userResults.length === 0) {
                return res.status(404).json({ status: 'error', error: 'User not found' });
            }

            const userAttempts = userResults[0].withdrawalAttempts;
            const effectiveAttempts = userAttempts > 3 ? 3 : userAttempts;

            const checkLimitsSql = `SELECT allow_limit FROM withdraw_limit WHERE withdrawalAttempts = ?`;

            con.query(checkLimitsSql, [effectiveAttempts], (err, limitResults) => {
                if (err) return res.status(500).json({ status: 'error', error: 'Failed to check withdrawal limits', details: err.message });

                if (limitResults.length === 0) {
                    return res.status(500).json({ status: 'error', error: 'Withdrawal limit not found' });
                }

                const minimumLimit = limitResults[0].allow_limit;

                const getExchangeFeeSql = `SELECT fee FROM exchange_fee WHERE id = 1`;

                con.query(getExchangeFeeSql, (err, feeResults) => {
                    if (err) return res.status(500).json({ status: 'error', error: 'Failed to fetch exchange fee', details: err.message });

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
                        if (err) return res.status(500).json({ status: 'error', error: 'Failed to start transaction' });

                        const withdrawSql = `
                            INSERT INTO withdrawal_requests 
                            (user_id, amount, account_number, bank_name, total_withdrawn, team, request_date, approved, fee)
                            VALUES (?, ?, ?, ?, ?, ?, NOW(), 'pending', ?)
                        `;

                        con.query(withdrawSql, [userId, amountAfterFee, accountNumber, bankName, totalWithdrawn, team, fee], (err) => {
                            if (err) {
                                return con.rollback(() => {
                                    res.status(500).json({ status: 'error', error: 'Failed to make withdrawal', details: err.message });
                                    console.log(err);
                                    
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
app.put('/updateCommissionData', (req, res) => {
  const { id, direct_bonus, indirect_bonus, week_backend, web_backend } = req.body;

  // Validate all four fields (adjust validation as needed)
  if (
    direct_bonus == null ||
    indirect_bonus == null ||
    week_backend == null ||
    web_backend == null
  ) {
    return res.status(400).json({
      status: 'error',
      message: 'Direct Bonus, Indirect Bonus, Week Backend, and Web Backend are required'
    });
  }

  let updateQuery;
  let queryParams;

  if (id === 0) {
    updateQuery = `
      UPDATE commission
      SET 
        direct_bonus = ?,
        indirect_bonus = ?,
        week_backend = ?,
        web_backend = ?
      WHERE id = 0`;
    queryParams = [direct_bonus, indirect_bonus, week_backend, web_backend];
  } else {
    updateQuery = `
      UPDATE commission
      SET 
        direct_bonus = ?,
        indirect_bonus = ?,
        week_backend = ?,
        web_backend = ?
      WHERE id = ?`;
    queryParams = [direct_bonus, indirect_bonus, week_backend, web_backend, id];
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
        SELECT wr.id, wr.user_id, wr.amount, wr.bank_name,  
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
const msg = `${amount}$ withdrawal approved`;

    const insertNotificationSql = `
        INSERT INTO notifications (user_id, msg, created_at)
        VALUES (?, ?, CURRENT_TIMESTAMP)`;

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


                con.query(insertNotificationSql, [userId, msg], (error) => {
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

    const insertNotificationSql = `
        INSERT INTO notifications (user_id, msg, is_read, created_at) 
        VALUES (?, ?, 0, NOW());
    `;

    try {
        con.query(updateWithdrawalRequestsSql, [reason, requestId, userId], (err, result) => {
            if (err) {
                console.error('Error executing update', err);
                return res.status(500).json({ error: 'Internal server error' });
            }

            if (result.affectedRows > 0) {
                const notificationMsg = `❌ Your withdrawal request has been rejected.\nReason: ${reason}`;

                con.query(insertNotificationSql, [userId, notificationMsg], (notifErr, notifResult) => {
                    if (notifErr) {
                        console.error('Notification insert error:', notifErr);
                        // continue with success response even if notification fails
                        return res.json({
                            message: 'Withdrawal request rejected, but failed to notify the user.'
                        });
                    }

                    return res.json({ message: 'Withdrawal request rejected and user notified.' });
                });
            } else {
                return res.status(404).json({ error: 'No matching withdrawal request found' });
            }
        });
    } catch (error) {
        console.error('Try/catch error:', error);
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

// GET endpoint - Get coin value
app.get('/get-coin-value', async (req, res) => {
    const connection = con.promise(); 
    try {
        const [result] = await connection.query(
            'SELECT value FROM coin_value WHERE id = 1'
        );
        
        if (result.length === 0) {
            return res.status(404).json({ error: 'Coin value not found' });
        }
        
        res.json({ value: result[0].value });
    } catch (error) {
        console.error('Error fetching coin value:', error);
        res.status(500).json({ error: 'Failed to fetch coin value' });
    }
});

// POST endpoint - Update coin value with validation
app.post('/update-coin-value', async (req, res) => {
    const { value } = req.body;
    const connection = con.promise();
    
    // Validate input
    if (value === undefined || value === null) {
        return res.status(400).json({ error: 'Value is required' });
    }
    
    // Validate that value is a number
    const numericValue = parseFloat(value);
    if (isNaN(numericValue)) {
        return res.status(400).json({ error: 'Value must be a valid number' });
    }
    
    // Ensure value is not negative (optional, based on your business logic)
    if (numericValue < 0) {
        return res.status(400).json({ error: 'Value cannot be negative' });
    }
    
    try {
        const [result] = await connection.query(
            'UPDATE coin_value SET value = ? WHERE id = 1',
            [numericValue]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Coin value record not found' });
        }
        
        res.json({ 
            success: true, 
            message: 'Coin value updated successfully',
            value: numericValue
        });
    } catch (error) {
        console.error('Error updating coin value:', error);
        res.status(500).json({ error: 'Failed to update coin value' });
    }
});
// Fixed /exchange-coin endpoint
app.post('/exchange-coin', async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: 'Unauthorized' });

    const userId = req.session.userId;
    const connection = con.promise();

    try {
        await connection.query('START TRANSACTION');

        // Get current coin value
        const [valueResult] = await connection.query(
            `SELECT value FROM coin_value WHERE id = 1`
        );
        
        if (!valueResult.length) {
            await connection.query('ROLLBACK');
            return res.status(404).json({ error: 'Coin value not found' });
        }
        
        const currentValue = valueResult[0].value;

        // Get user coins with lock
        const [user] = await connection.query(
            `SELECT coin FROM users WHERE id = ? FOR UPDATE`,
            [userId]
        );

        if (!user.length) {
            await connection.query('ROLLBACK');
            return res.status(400).json({ error: 'User not found' });
        }

        const coins = user[0].coin;
        if (coins <= 0) {
            await connection.query('ROLLBACK');
            return res.status(400).json({ error: 'No coins to exchange' });
        }

        // Calculate USD amount
        const usdAmount = coins / currentValue;

        // Update user balance and reset coins
        await connection.query(
            `UPDATE users SET balance = balance + ?, coin = 0 WHERE id = ?`,
            [usdAmount, userId] // Use usdAmount, not coins for balance update
        );

        // Insert into history
        await connection.query(
            `INSERT INTO coin_collect_history (user_id, type, amount, usd_value) VALUES (?, 'exchange', ?, ?)`,
            [userId, coins, usdAmount]
        );

        // Get updated user data
        const [updatedUser] = await connection.query(
            `SELECT balance, coin FROM users WHERE id = ?`,
            [userId]
        );

        await connection.query('COMMIT');

        res.json({
            success: true,
            balance: updatedUser[0].balance,
            coin: updatedUser[0].coin,
            usd_amount: usdAmount
        });
    } catch (error) {
        await connection.query('ROLLBACK');
        console.error('Exchange error:', error);
        res.status(500).json({ error: 'Exchange failed' });
    }
});

// Fixed /user-data endpoint to match frontend expectations
app.get('/user-data', async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const [results] = await con.promise().query(
            `SELECT backend_wallet, coin , balance, last_collect_date FROM users WHERE id = ?`,
            [req.session.userId]
        );

        res.json(results[0]);
    } catch (error) {
        console.error('User data error:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

app.get('/coin-collect-history', async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const [results] = await con.promise().query(
            `SELECT id, type, amount, usd_value, created_at FROM coin_collect_history WHERE user_id = ? ORDER BY created_at DESC LIMIT 50`,
            [req.session.userId]
        );

        res.json(results);
    } catch (error) {
        console.error('History error:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

app.post('/collect-coin', async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = req.session.userId;

    const connection = con.promise();

    try {
        await connection.query('START TRANSACTION'); // ✅ start transaction

        // 1. Fetch user data with lock
        const [userRows] = await connection.query(
            `SELECT backend_wallet, last_collect_date FROM users WHERE id = ? FOR UPDATE`,
            [userId]
        );

        if (!userRows.length) {
            await connection.query('ROLLBACK');
            return res.status(400).json({ error: 'User not found' });
        }

        const user = userRows[0];

        // 2. Get current database date
        const [currentDateRows] = await connection.query(
            `SELECT CURRENT_DATE() AS today`
        );
        const today = currentDateRows[0].today;

        if (user.last_collect_date >= today) {
            await connection.query('ROLLBACK');
            return res.status(400).json({ error: 'Already collected today' });
        }

        if (user.backend_wallet <= 0) {
            await connection.query('ROLLBACK');
            return res.status(400).json({ error: 'Insufficient funds' });
        }

        // 3. Calculate
        const collectAmount = user.backend_wallet * 0.1;
        const newWallet = user.backend_wallet - collectAmount;

        // 4. Get current winstuk value
        const [valueResult] = await connection.query(
            `SELECT value FROM coin_value WHERE id = 1`
        );
        const coinValue = valueResult[0].value;
console.log(coinValue);

        // 5. Update user
        await connection.query(
            `UPDATE users SET backend_wallet = ?, coin = coin + ?, last_collect_date = CURDATE() WHERE id = ?`,
            [newWallet, collectAmount, userId]
        );

        // 6. Insert into history
        await connection.query(
            `INSERT INTO coin_collect_history (user_id, type, amount, usd_value) VALUES (?, 'collect', ?, ?)`,
            [userId, collectAmount, collectAmount / coinValue]
        );

        // 7. Get updated user data
        const [updatedUserRows] = await connection.query(
            `SELECT backend_wallet, coin, last_collect_date FROM users WHERE id = ?`,
            [userId]
        );

        const updatedUser = updatedUserRows[0];

        await connection.query('COMMIT');

        res.json({
            success: true,
            backend_wallet: updatedUser.backend_wallet,
            coin: updatedUser.coin,
            collected_amount: collectAmount,
            current_value: coinValue,
            last_collect_date: updatedUser.last_collect_date, // timestamp ke saath
        });
    } catch (error) {
        await connection.query('ROLLBACK');
        console.error('Collect error:', error);
        res.status(500).json({ error: 'Collection failed' });
    }
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
app.get('/notifications/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const [notifications] = await con.promise().query(`
      SELECT id, msg, is_read, created_at
      FROM notifications
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `, [userId, parseInt(limit), parseInt(offset)]);

    const [countResult] = await con.promise().query(`
      SELECT COUNT(*) as total
      FROM notifications
      WHERE user_id = ?
    `, [userId]);

    res.json({ 
      status: 'success', 
      data: notifications,
      pagination: {
        total: countResult[0].total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(countResult[0].total / limit)
      }
    });
  } catch (error) {
    console.error('Notification fetch error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch notifications' });
  }
});

// Mark notification as read
app.patch('/notifications/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    await con.promise().query(`UPDATE notifications SET is_read = 1 WHERE id = ?`, [id]);
    res.json({ status: 'success' });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to update notification' });
  }
});

// Mark all notifications as read for a user
app.patch('/notifications/:userId/read-all', async (req, res) => {
  try {
    const { userId } = req.params;
    await con.promise().query(`UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0`, [userId]);
    res.json({ status: 'success' });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to update notifications' });
  }
});

// Get unread notification count
app.get('/notifications/:userId/unread-count', async (req, res) => {
  try {
    const { userId } = req.params;
    const [result] = await con.promise().query(`
      SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0
    `, [userId]);
    res.json({ status: 'success', count: result[0].count });
  } catch (error) {
    console.error('Unread count error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to get unread count' });
  }
});






if (process.env.USE_SSL === 'true') {
    console.log('🔒 HTTPS Server running on port ' + process.env.PORT);
    
  const options = {
    key: fs.readFileSync('/etc/letsencrypt/live/rovexking.com/privkey.pem'),
    cert: fs.readFileSync('/etc/letsencrypt/live/rovexking.com/fullchain.pem')
  };

  https.createServer(options, app).listen(process.env.PORT, () => {
    console.log('🔒 HTTPS Server running on port ' + process.env.PORT);
  });
} else {
  app.listen( process.env.PORT, () => {
    console.log('⚠️  HTTP Server running on port ' +  process.env.PORT);
  });
} 