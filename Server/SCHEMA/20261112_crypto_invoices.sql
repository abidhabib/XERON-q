-- Run once against the Hai database before deploying crypto-only activation.
CREATE TABLE IF NOT EXISTS crypto_invoices (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  amount DECIMAL(36,18) NOT NULL,
  received_amount DECIMAL(36,18) NOT NULL DEFAULT 0,
  address VARCHAR(42) NOT NULL,
  hd_index BIGINT UNSIGNED NOT NULL,
  status ENUM('pending', 'paid', 'swept', 'expired') NOT NULL DEFAULT 'pending',
  tx_hash VARCHAR(66) NULL,
  expires_at DATETIME NOT NULL,
  paid_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_crypto_invoice_address (address),
  UNIQUE KEY uq_crypto_invoice_hd_index (hd_index),
  KEY idx_crypto_invoice_pending (status, expires_at),
  KEY idx_crypto_invoice_user_status (user_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS crypto_invoice_payments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  invoice_id BIGINT UNSIGNED NOT NULL,
  tx_hash VARCHAR(66) NOT NULL,
  log_index BIGINT UNSIGNED NOT NULL,
  amount DECIMAL(36,18) NOT NULL,
  confirmed_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_crypto_invoice_payment_log (invoice_id, tx_hash, log_index),
  KEY idx_crypto_invoice_payment_invoice (invoice_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
