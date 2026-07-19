// controllers/WalletController.js
import con from '../config/db.js';

// Helper: Validate blockchain addresses server-side (defense in depth)
const validateAddress = (chain, address) => {
  const patterns = {
    bep20: /^0x[a-fA-F0-9]{40}$/,
    trc20: /^T[a-zA-Z0-9]{33}$/,
    eth: /^0x[a-fA-F0-9]{40}$/,
    btc: /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[a-z0-9]{39,59}$/,
    sol: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
    polygon: /^0x[a-fA-F0-9]{40}$/
  };
  return patterns[chain]?.test(address.trim());
};

// GET /api/wallets → returns wallets for authenticated user only
export const getUserWallets = (req, res) => {
  // ✅ Security: Get userId from session, NOT from params (prevents IDOR)
  const userId = req.session?.userId;
  
  if (!userId) {
    return res.status(401).json({ success: false, error: 'Authentication required' });
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

// PUT /api/wallets → saves address for authenticated user only
export const saveWalletAddress = (req, res) => {
  // ✅ Security: Get userId from session, ignore client-provided value
  const userId = req.session?.userId;
  const { chain, address } = req.body;

  if (!userId) {
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }

  if (!chain || !address) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  // ✅ Security: Strict chain whitelist
  const allowedChains = ['bep20', 'trc20', 'eth', 'btc', 'sol', 'polygon'];
  if (!allowedChains.includes(chain.toLowerCase())) {
    console.warn(`Invalid chain attempt: ${chain} by user ${userId}`);
    return res.status(400).json({ success: false, error: 'Unsupported blockchain' });
  }

  const normalizedChain = chain.toLowerCase();
  const normalizedAddress = address.trim();

  // ✅ Security: Server-side address validation (never trust client)
  if (!validateAddress(normalizedChain, normalizedAddress)) {
    console.warn(`Invalid address format for ${normalizedChain} by user ${userId}`);
    return res.status(400).json({ success: false, error: 'Invalid address format' });
  }

  // ✅ Security: Prevent excessively long addresses (DoS protection)
  if (normalizedAddress.length > 200) {
    return res.status(400).json({ success: false, error: 'Address too long' });
  }

  const sql = `
    INSERT INTO users_accounts (user_id, chain, address, updated_at)
    VALUES (?, ?, ?, NOW())
    ON DUPLICATE KEY UPDATE address = VALUES(address), updated_at = NOW()
  `;

  con.query(sql, [userId, normalizedChain, normalizedAddress], (err, result) => {
    if (err) {
      console.error('Save wallet error:', err);
      // ✅ Security: Don't leak DB structure in error messages
      return res.status(500).json({ success: false, error: 'Failed to save address' });
    }

    // ✅ Security: Audit log (optional but recommended)
    console.log(`Wallet updated: user=${userId}, chain=${normalizedChain}, action=${result.affectedRows > 0 ? 'insert' : 'update'}`);

    res.json({ success: true, message: 'Address saved successfully' });
  });
};