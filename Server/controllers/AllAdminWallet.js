
import { queryAsync } from '../utils/queryAsync.js';
export const getBep20Addresses = async (req, res) => {
    try {
        const addresses = await queryAsync('SELECT * FROM bep20_settings ORDER BY created_at DESC');
                console.log('BEP20 API result:', addresses); // <- Add this

        res.json(addresses);
    } catch (err) {
        console.error('Error fetching addresses:', err);
        res.status(500).json({ error: 'Failed to fetch addresses' });
    }
}
