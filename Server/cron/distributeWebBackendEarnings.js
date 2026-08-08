import con from '../config/db.js';
import { queryAsync } from '../utils/queryAsync.js';

/**
 * Distributes 10% of web_backend_earnings to all approved users
 * proportionally based on their level's give_from_webbackend ratio,
 * weighted by the number of users at each level.
 * 
 * Formula:
 *   totalUnits = Σ(userCount_at_level × ratio)
 *   unitValue  = distributableAmount / totalUnits
 *   perPerson  = ratio × unitValue
 */
export const distributeWebBackendEarnings = async () => {
  try {
    console.log('💰 Starting web backend earnings distribution...');

    // Step 1: Get current web backend earnings
    const settingsRows = await queryAsync(
      'SELECT web_backend_earnings FROM settings WHERE id = 1 LIMIT 1'
    );

    const totalEarnings = parseFloat(settingsRows[0]?.web_backend_earnings) || 0;

    if (totalEarnings <= 0) {
      console.log(`⏭️  No web backend earnings to distribute. (Found: ${totalEarnings})`);
      return;
    }

    // 10% of total earnings is the distributable pool
    const distributableAmount = totalEarnings * 0.10;

    if (distributableAmount <= 0) {
      console.log('⏭️  Distributable amount is zero after 10% calculation.');
      return;
    }

    console.log(`📊 Total earnings: $${totalEarnings.toFixed(2)}, Distributable (10%): $${distributableAmount.toFixed(4)}`);

    // Step 2: Get user counts per level joined with level ratios
    const levelDistribution = await queryAsync(`
      SELECT 
        l.id AS level_id,
        l.level,
        l.category_name,
        l.give_from_webbackend AS ratio,
        COUNT(u.id) AS user_count
      FROM levels l
      LEFT JOIN users u 
        ON u.level = l.level 
        AND u.approved = 1 
        AND u.blocked = 0
      WHERE l.give_from_webbackend > 0
      GROUP BY l.id, l.level, l.category_name, l.give_from_webbackend
      ORDER BY l.level ASC
    `);

    if (!levelDistribution || levelDistribution.length === 0) {
      console.log('⏭️  No levels with give_from_webbackend > 0 found.');
      return;
    }

    // Step 3: Calculate total ratio units = Σ(userCount × ratio)
    let totalUnits = 0;
    for (const row of levelDistribution) {
      totalUnits += row.user_count * parseFloat(row.ratio);
    }

    if (totalUnits <= 0) {
      console.log('⏭️  No eligible users found at any level with a ratio.');
      return;
    }

    // Step 4: Calculate value per ratio unit
    const unitValue = distributableAmount / totalUnits;

    console.log(`📐 Total ratio units: ${totalUnits.toFixed(4)}, Unit value: $${unitValue.toFixed(6)}`);

    // Step 5: Begin transaction for atomic distribution
    await queryAsync('START TRANSACTION');

    try {
      let totalDistributed = 0;

      for (const row of levelDistribution) {
        const ratio = parseFloat(row.ratio);
        const userCount = parseInt(row.user_count);
        const perPersonAmount = ratio * unitValue;

        if (userCount === 0 || perPersonAmount <= 0) continue;

        await queryAsync(`
          UPDATE users
          SET balance = balance + ?
          WHERE level = ?
            AND approved = 1
            AND blocked = 0
        `, [perPersonAmount, row.level]);

        const groupTotal = userCount * perPersonAmount;
        totalDistributed += groupTotal;

        console.log(
          `  ✅ Level ${row.level} (${row.category_name}): ` +
          `${userCount} users × $${perPersonAmount.toFixed(4)} = $${groupTotal.toFixed(4)}`
        );
      }

      // Step 6: Deduct distributed amount from web_backend_earnings
      await queryAsync(`
        UPDATE settings
        SET web_backend_earnings = web_backend_earnings - ?
        WHERE id = 1
      `, [totalDistributed]);

      await queryAsync('COMMIT');

      console.log(
        `✅ Distribution complete. Distributed: $${totalDistributed.toFixed(4)}, ` +
        `Remaining earnings: $${(totalEarnings - totalDistributed).toFixed(4)}`
      );
    } catch (txError) {
      await queryAsync('ROLLBACK');
      throw txError;
    }
  } catch (error) {
    console.error('❌ Web backend earnings distribution failed:', error.message);
  }
};