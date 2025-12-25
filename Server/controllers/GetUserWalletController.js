// controllers/WalletController.js
import con from '../config/db.js';

// GET /api/wallets/:userId → returns { bep20: '0x...', eth: '0x...', ... }
export const getUserWallets = (req, res) => {
  const { userId } = req.params;
  if (!userId) {
    return res.status(400).json({ success: false, error: 'User ID required' });
  }

  const sql = `
    SELECT chain, address 
    FROM users_accounts 
    WHERE user_id = ?
  `;

  con.query(sql, [userId], (err, results) => {
    if (err) {
      console.error('Fetch wallets error:', err);
      return res.status(500).json({ success: false, error: 'Database error' });
    }

    const wallets = {};
    results.forEach(row => {
      wallets[row.chain] = row.address;
    });

    res.json({ success: true, wallets });
  });
};

// PUT /api/wallets → saves one chain address
export const saveWalletAddress = (req, res) => {
  const { userId, chain, address } = req.body;

  if (!userId || !chain || !address) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  // Optional: validate chain (improves security)
  const allowedChains = ['bep20', 'trc20', 'eth', 'btc', 'sol', 'polygon'];
  if (!allowedChains.includes(chain)) {
    return res.status(400).json({ success: false, error: 'Unsupported blockchain' });
  }

  const sql = `
    INSERT INTO users_accounts (user_id, chain, address)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE address = VALUES(address)
  `;

  con.query(sql, [userId, chain, address], (err) => {
    if (err) {
      console.error('Save wallet error:', err);
      return res.status(500).json({ success: false, error: 'Failed to save address' });
    }
    res.json({ success: true, message: 'Address saved successfully' });
  });
};