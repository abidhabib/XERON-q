import { queryAsync } from "../utils/queryAsync.js";
export const getBep20Account = async (req, res) => {
    try {
        const [account] = await queryAsync(`
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
};