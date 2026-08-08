
import { queryAsync } from '../utils/queryAsync.js';

export const auditSummary = async (req, res) => {
  try {
    const MIN_USER_ID = 9340;

    // 1. Get settings
    const [settings] = await queryAsync(`
      SELECT joining_fee, initial_percent
      FROM settings
      WHERE id = 1
    `);

    const joiningFee = parseFloat(settings?.joining_fee) || 0;
    const initialPercent = parseFloat(settings?.initial_percent) || 0;

    // 2. Count approved users (id >= MIN_USER_ID)
    const [userCountResult] = await queryAsync(`
      SELECT COUNT(*) AS count
      FROM users
      WHERE id >= ? AND approved = 1
    `, [MIN_USER_ID]);

    const approvedUserCount = parseInt(userCountResult?.count) || 0;
    const totalCollected = joiningFee * approvedUserCount;

    // 3. Dynamically compute referrer chain commission %
    const commissionRows = await queryAsync(`
      SELECT
        direct_bonus,
        indirect_bonus
      FROM commission
      WHERE id BETWEEN 0 AND 6
      ORDER BY id
    `);

    let referrerChainPercent = 0;

    for (const row of commissionRows) {
      referrerChainPercent += parseFloat(row.direct_bonus || 0);
      referrerChainPercent += parseFloat(row.indirect_bonus || 0);
    }

    const totalDistributionPercent =
      initialPercent + referrerChainPercent;

    const expectedDistributed =
      (totalDistributionPercent / 100) * totalCollected;

    const systemRetained =
      totalCollected - expectedDistributed;

    // 4. Actual distributed: ONLY users with id >= MIN_USER_ID
    const [distributedResult] = await queryAsync(`
      SELECT
        COALESCE(SUM(balance), 0) AS total_balance,
        COALESCE(SUM(coin), 0) AS total_coin
      FROM users
      WHERE id >= ? AND approved = 1
    `, [MIN_USER_ID]);

    const totalDistributed =
      parseFloat(distributedResult.total_balance) +
      parseFloat(distributedResult.total_coin);

    // 5. Total approved withdrawals (for valid users only)
    const [withdrawalResult] = await queryAsync(`
      SELECT COALESCE(SUM(amount), 0) AS total_withdrawn
      FROM withdrawal_requests
      WHERE user_id >= ? AND approved = 'approved'
    `, [MIN_USER_ID]);

    const totalWithdrawn =
      parseFloat(withdrawalResult?.total_withdrawn) || 0;

    // 6. Get total distributed to ALL users (including silent ancestors)
    const [allUsersResult] = await queryAsync(`
      SELECT
        COALESCE(SUM(balance + coin), 0) AS total_all
      FROM users
      WHERE approved = 1
    `);

    const totalDistributedAll =
      parseFloat(allUsersResult.total_all);

    // 7. Real financial position
    const realRetained =
      totalCollected - totalDistributedAll;

    const availableBalance =
      realRetained - totalWithdrawn;

    // Keep your fmt as-is (no toFixed)
    const fmt = (n) => Number(n);

    res.status(200).json({
      status: 'success',

      audit: {
        joining_fee_per_user: fmt(joiningFee),
        initial_percent: fmt(initialPercent),

        approved_users_count: approvedUserCount,

        total_collected_usd: fmt(totalCollected),

        system_retained_usd: fmt(systemRetained),

        expected_distribution: {
          total_percent: parseFloat(totalDistributionPercent),

          total_usd: fmt(expectedDistributed),

          breakdown: {
            new_user_bonus_percent: fmt(initialPercent),
            referrer_chain_percent: parseFloat(referrerChainPercent),
          }
        },

        actual_distributed: {
          balance: fmt(distributedResult.total_balance),
          coin: fmt(distributedResult.total_coin),
          total_usd: fmt(totalDistributed)
        },

        total_withdrawn_usd: fmt(totalWithdrawn),

        net_surplus_deficit_usd: fmt(
          totalCollected -
          totalDistributed -
          totalWithdrawn
        ),

        summary: availableBalance >= 0
          ? `Surplus of $${fmt(availableBalance)} – system is solvent.`
          : `Deficit of $${fmt(Math.abs(availableBalance))} – payout exceeds intake.`,

        distribution_variance: fmt(
          totalDistributed - expectedDistributed
        ),

        note: "Variance is expected during early growth. Full distribution requires deep trees within valid users (id >= 9340).",

        // Financial flow
        financial_flow: {
          money_in: fmt(totalCollected),

          money_out_total: fmt(totalDistributedAll),

          money_out_visible: fmt(totalDistributed),

          money_out_hidden: fmt(
            totalDistributedAll - totalDistributed
          ),

          system_retained_real: fmt(realRetained),

          withdrawals_paid: fmt(totalWithdrawn),

          available_balance: fmt(availableBalance),

          status: availableBalance >= 0
            ? 'healthy'
            : 'at risk'
        }
      }
    });

  } catch (error) {
    console.error('Audit summary error:', error);

    res.status(500).json({
      status: 'error',
      message: 'Failed to generate audit summary',
      error: error.message
    });
  }
};
