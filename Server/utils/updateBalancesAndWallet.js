import { queryAsync } from './queryAsync.js';


export const updateBalancesAndWallet = async (userId, depth = 0) => {
    if (depth >= 7) return; // Limit updates to 7 levels of referrers

    try {
        const referrerResult = await queryAsync(`
            SELECT refer_by
            FROM users
            WHERE id = ?
        `, [userId]);

        const referrerId = referrerResult[0]?.refer_by;

        if (referrerId) {
            const commissionResult = await queryAsync(`
                SELECT direct_bonus, indirect_bonus
                FROM commission
                WHERE id = ?
            `, [depth]);

            const { direct_bonus, indirect_bonus } = commissionResult[0] || {};
            const feeResult = await queryAsync(`
                SELECT joining_fee
                FROM joining_fee
                WHERE id = 1
            `);

            const joiningFee = feeResult[0]?.joining_fee || 0;
            const directBonusAmount = (direct_bonus * joiningFee) / 100 || 0;
            const indirectBonusAmount = (indirect_bonus * joiningFee) / 100 || 0;

            await queryAsync(`
                UPDATE users
                SET 
                    balance = balance + ?,
                    backend_wallet = backend_wallet + ?,
                    all_credits = all_credits + ? + ?
                WHERE id = ?
            `, [directBonusAmount, indirectBonusAmount, directBonusAmount, indirectBonusAmount, referrerId]);




            await updateBalancesAndWallet(referrerId, depth + 1);
        }
    } catch (error) {
        console.error('Error updating balances and wallet:', error.message);
        throw error;
    }
};