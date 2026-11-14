// Additive and repeatable: no tables, balances, or existing records are removed.
const requiredColumns = {
  products: { active: 'TINYINT(1) NOT NULL DEFAULT 1' },
  users: {
    task_reward_date: 'DATE NULL',
    task_reward_per_product: 'DECIMAL(10,6) NOT NULL DEFAULT 0',
    task_product_ids: 'JSON NULL',
  },
  user_product_clicks: { reward_amount: 'DECIMAL(10,6) NOT NULL DEFAULT 0' },
};

export function createProductTaskSchemaInitializer(db) {
  let pending;
  return function ensureProductTaskSchema() {
    if (!pending) {
      pending = (async () => {
        for (const [table, columns] of Object.entries(requiredColumns)) {
          const [existing] = await db.query('SHOW COLUMNS FROM ??', [table]);
          const names = new Set(existing.map(column => column.Field));
          for (const [column, definition] of Object.entries(columns)) {
            if (names.has(column)) continue;
            try {
              await db.query(`ALTER TABLE ?? ADD COLUMN ?? ${definition}`, [table, column]);
            } catch (error) {
              // Another server process may have added the column after our check.
              if (error.code !== 'ER_DUP_FIELDNAME') throw error;
            }
          }
        }
      })().catch(error => {
        pending = undefined;
        throw error;
      });
    }
    return pending;
  };
}
