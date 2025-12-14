import { queryAsync } from './queryAsync.js';

export const updateBalancesAndWallet = async (userId, depth = 0) => {
    if (depth >= 7) return;

    try {
        const referrerResult = await queryAsync(`
            SELECT refer_by
            FROM users
            WHERE id = ?
        `, [userId]);

        const referrerId = referrerResult[0]?.refer_by;

        if (referrerId) {
            // Fetch ALL commission fields: existing + new
            const commissionResult = await queryAsync(`
                SELECT 
                    direct_bonus, 
                    indirect_bonus,
                    week_backend,
                    web_backend
                FROM commission
                WHERE id = ?
            `, [depth]);

            const {
                direct_bonus = 0,
                indirect_bonus = 0,
                week_backend = 0,
                web_backend = 0
            } = commissionResult[0] || {};

            const feeResult = await queryAsync(`
                SELECT joining_fee
                FROM joining_fee
                WHERE id = 1
            `);
            const joiningFee = feeResult[0]?.joining_fee || 0;

            // Existing bonus amounts
            const directBonusAmount = (direct_bonus * joiningFee) / 100;
            const indirectBonusAmount = (indirect_bonus * joiningFee) / 100;

            // NEW: Week and Web credit amounts
            const weekCreditAmount = (week_backend * joiningFee) / 100;
            const webCreditAmount = (web_backend * joiningFee) / 100;

            // Total credits to add to `all_credits`
            const totalCredits = directBonusAmount + indirectBonusAmount + weekCreditAmount + webCreditAmount;

            await queryAsync(`
                UPDATE users
                SET 
                    balance = balance + ?,
                    backend_wallet = backend_wallet + ?,
                    all_credits = all_credits + ?,
                    week_credits = week_credits + ?,
                    web_credits = web_credits + ?
                WHERE id = ?
            `, [
                directBonusAmount,      // balance
                indirectBonusAmount,    // backend_wallet
                totalCredits,           // all_credits (includes all 4)
                weekCreditAmount,       // week_credits
                webCreditAmount,        // web_credits
                referrerId
            ]);

            // Recurse to next referrer level
            await updateBalancesAndWallet(referrerId, depth + 1);
        }
    } catch (error) {
        console.error('Error updating balances and wallet:', error.message);
        throw error;
    }
};