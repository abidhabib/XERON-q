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
            // Fetch commission rates for current depth
            const commissionResult = await queryAsync(`
                SELECT
                    direct_bonus,
                    indirect_bonus
                FROM commission
                WHERE id = ?
            `, [depth]);

            const {
                direct_bonus = 0,
                indirect_bonus = 0
            } = commissionResult[0] || {};

            // Fetch joining fee from settings table
            const settingsResult = await queryAsync(`
                SELECT joining_fee
                FROM settings
                WHERE id = 1
            `);

            const joiningFee =
                parseFloat(settingsResult[0]?.joining_fee) || 0;

            // Compute bonus amounts
            const directBonusAmount =
                (parseFloat(direct_bonus) * joiningFee) / 100;

            const indirectBonusAmount =
                (parseFloat(indirect_bonus) * joiningFee) / 100;

            const totalCredits =
                directBonusAmount + indirectBonusAmount;

            // Update referrer's wallets
            await queryAsync(`
                UPDATE users
                SET
                    balance = balance + ?,
                    backend_wallet = backend_wallet + ?,
                    all_credits = all_credits + ?
                WHERE id = ?
            `, [
                directBonusAmount,
                indirectBonusAmount,
                totalCredits,
                referrerId
            ]);

            // Recurse upward
            await updateBalancesAndWallet(referrerId, depth + 1);
        }
    } catch (error) {
        console.error(
            'Error updating balances and wallet:',
            error.message
        );

        throw error;
    }
};
