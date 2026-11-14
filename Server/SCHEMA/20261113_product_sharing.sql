-- Product sharing reuses products, users and user_product_clicks. No new tables.
-- Fresh schemas only: apply once before starting the updated server.
-- For existing or partly migrated schemas, run npm run migrate:product-tasks
-- from Server instead; it safely skips columns that already exist.
ALTER TABLE products ADD COLUMN active TINYINT(1) NOT NULL DEFAULT 1;
ALTER TABLE users
  ADD COLUMN task_reward_date DATE NULL,
  ADD COLUMN task_reward_per_product DECIMAL(10,6) NOT NULL DEFAULT 0,
  ADD COLUMN task_product_ids JSON NULL;
ALTER TABLE user_product_clicks
  ADD COLUMN reward_amount DECIMAL(10,6) NOT NULL DEFAULT 0;

-- Back up mining history before running this removal.
DROP TABLE IF EXISTS coin_collect_history;
