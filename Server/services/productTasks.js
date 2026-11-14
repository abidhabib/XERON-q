export class TaskError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}

export function httpLink(value) {
  try {
    const url = new URL(String(value || '').trim());
    return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password && url.href.length <= 255 ? url.href : null;
  } catch { return null; }
}

// Round down to the wallet's six decimal places so tasks never exceed 10%.
export const taskReward = (wallet, count) => count > 0
  ? Math.floor((Math.max(0, Number(wallet) || 0) * 0.1 / count) * 1e6) / 1e6 : 0;

export function createProductTaskService(pool) {
  return async function productTasks(userId, productId = null) {
    const db = await pool.getConnection();
    try {
      await db.beginTransaction();
      const [[user]] = await db.query(
        `SELECT id, approved, balance, backend_wallet, task_product_ids, task_reward_per_product,
                DATE_FORMAT(CURDATE(), '%Y-%m-%d') AS reward_date,
                (task_reward_date = CURDATE()) AS same_task_day,
                (DATE(last_collect_date) = CURDATE()) AS mined_today
           FROM users WHERE id = ? FOR UPDATE`, [userId]
      );
      if (!user) throw new TaskError('User not found', 404);
      if (Number(user.approved) !== 1) throw new TaskError('Your account must be approved to complete tasks', 403);
      const [activeProducts] = await db.query(
        'SELECT id, description, link, imgLink FROM products WHERE active = 1 ORDER BY id DESC'
      );
      let ids = typeof user.task_product_ids === 'string' ? JSON.parse(user.task_product_ids) : user.task_product_ids;
      let reward = Number(user.task_reward_per_product || 0);
      let sameDay = Boolean(user.same_task_day);
      // A member who already used today's old mining reward starts tasks tomorrow.
      const alreadyMined = Boolean(user.mined_today) && !sameDay;
      if (!sameDay) {
        ids = activeProducts.filter(p => httpLink(p.link)).map(p => Number(p.id));
        reward = alreadyMined ? 0 : taskReward(user.backend_wallet, ids.length);
        if (!alreadyMined && ids.length && reward > 0) {
          await db.query(
            `UPDATE users SET task_reward_date = CURDATE(), task_reward_per_product = ?, task_product_ids = ? WHERE id = ?`,
            [reward, JSON.stringify(ids), userId]
          );
          sameDay = true;
        }
      }
      ids = Array.isArray(ids) ? ids.map(Number) : [];
      const [clicks] = await db.query(
        `SELECT product_id FROM user_product_clicks
          WHERE user_id = ? AND (click_date = CURDATE() OR (click_date IS NULL AND DATE(last_clicked) = CURDATE()))`,
        [userId]
      );
      const completed = new Set(clicks.map(c => Number(c.product_id)).filter(id => ids.includes(id)));
      if (productId !== null) {
        if (alreadyMined) throw new TaskError('You already collected today. Sharing tasks open tomorrow.');
        if (!ids.includes(productId) || !activeProducts.some(p => Number(p.id) === productId && httpLink(p.link))) {
          throw new TaskError('This product is not available in your daily tasks');
        }
        if (completed.has(productId)) throw new TaskError('Task already completed today', 409);
        if (!sameDay || reward <= 0 || Number(user.backend_wallet) < reward) throw new TaskError('Insufficient backend funds');
        const [transfer] = await db.query(
          `UPDATE users SET backend_wallet = backend_wallet - ?, balance = balance + ?
            WHERE id = ? AND backend_wallet >= ?`, [reward, reward, userId, reward]
        );
        if (transfer.affectedRows !== 1) throw new TaskError('Insufficient backend funds');
        await db.query(
          `INSERT INTO user_product_clicks (user_id, product_id, last_clicked, click_date, reward_amount)
           VALUES (?, ?, NOW(), CURDATE(), ?)`, [userId, productId, reward]
        );
        completed.add(productId);
      }
      const remaining = alreadyMined ? 0 : Math.max(0, ids.length - completed.size);
      const result = {
        status: 'success', reward_date: user.reward_date,
        products: alreadyMined ? [] : activeProducts.filter(p => ids.includes(Number(p.id)) && !completed.has(Number(p.id))),
        reward_per_task: reward,
        daily_reward_total: Number((reward * ids.length).toFixed(6)),
        allowed_tasks: ids.length,
        completed_today: completed.size,
        remaining_tasks: remaining,
        daily_limit_reached: alreadyMined || (ids.length > 0 && remaining === 0),
        balance: Number(user.balance) + (productId === null ? 0 : reward),
        backend_wallet: Number(user.backend_wallet) - (productId === null ? 0 : reward),
        message: alreadyMined ? 'You already collected today. Sharing tasks open tomorrow.' : null,
        ...(productId === null ? {} : { reward }),
      };
      await db.commit();
      return result;
    } catch (error) {
      await db.rollback();
      throw error;
    } finally { db.release(); }
  };
}
