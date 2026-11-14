import express from 'express';
import dotenv from 'dotenv';
import { Contract, HDNodeWallet, Mnemonic, JsonRpcProvider, formatUnits, parseUnits } from 'ethers';
import { queryAsync } from '../utils/queryAsync.js';
import { approveUserAccount } from '../controllers/userApprovalController.js';

// Route modules load before server.js executes dotenv.config() under ESM.
dotenv.config();

const router = express.Router();
const USDT_BSC = (process.env.USDT_BSC || '0x55d398326f99059fF775485246999027B3197955').toLowerCase();
const MAIN_WALLET = process.env.MAIN_WALLET;
const BSC_RPC = process.env.BSC_RPC || 'https://bsc.publicnode.com';
const CONFIRMATIONS_REQUIRED = 15;
const INVOICE_MINUTES = 60;
const EXPIRY_GRACE_MINUTES = 15;
const provider = new JsonRpcProvider(BSC_RPC);
const usdtReadAbi = [
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'function balanceOf(address) view returns (uint256)'
];
const usdtWriteAbi = [
  'function balanceOf(address) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)'
];

let cryptoRoot;
let masterWallet;
let watcherRunning = false;

function getWallets() {
  if (!cryptoRoot) {
    if (!process.env.PAYOUT_MNEMONIC || !MAIN_WALLET) {
      throw new Error('Crypto payments are not configured. Set PAYOUT_MNEMONIC and MAIN_WALLET.');
    }
    cryptoRoot = HDNodeWallet.fromMnemonic(
      Mnemonic.fromPhrase(process.env.PAYOUT_MNEMONIC),
      "m/44'/60'/0'/0"
    );
    masterWallet = cryptoRoot.deriveChild(0).connect(provider);
  }
  return { cryptoRoot, masterWallet };
}

function requireSessionUser(req, res) {
  if (!req.session?.userId) {
    res.status(401).json({ success: false, error: 'Login required' });
    return null;
  }
  return req.session.userId;
}

// A unique address makes on-chain payments attributable without asking users
// to paste a transaction hash.
router.post('/crypto-invoice', async (req, res) => {
  const userId = requireSessionUser(req, res);
  if (!userId) return;

  try {
    const [user] = await queryAsync(
      'SELECT id, approved, payment_ok FROM users WHERE id = ? LIMIT 1', [userId]
    );
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    if (user.approved === 1 || user.payment_ok === 1) {
      return res.status(400).json({ success: false, error: 'Account payment is already being processed or approved' });
    }

    const [settings] = await queryAsync('SELECT joining_fee FROM settings WHERE id = 1 LIMIT 1');
    const amount = Number(settings?.joining_fee || 0);
    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(503).json({ success: false, error: 'Activation fee is not configured' });
    }

    const existingRows = await queryAsync(
      `SELECT id, address, amount, received_amount, expires_at
       FROM crypto_invoices
       WHERE user_id = ? AND status = 'pending' AND expires_at > NOW()
       ORDER BY id DESC LIMIT 1`, [userId]
    );
    const existing = existingRows[0];
    if (existing) {
      return res.json({
        success: true, invoice_id: existing.id, address: existing.address,
        amount: existing.amount, received_amount: existing.received_amount,
        remaining_amount: Math.max(0, Number(existing.amount) - Number(existing.received_amount || 0)),
        expires_at: existing.expires_at, network: 'BEP20 (BSC)'
      });
    }

    const { cryptoRoot: root } = getWallets();
    const indexRows = await queryAsync('SELECT COALESCE(MAX(hd_index), 0) + 1 AS next_index FROM crypto_invoices');
    const hdIndex = Number(indexRows[0].next_index);
    const address = root.deriveChild(hdIndex).address;
    const insert = await queryAsync(
      `INSERT INTO crypto_invoices (user_id, amount, address, hd_index, expires_at)
       VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL ${INVOICE_MINUTES} MINUTE))`,
      [userId, amount, address, hdIndex]
    );
    const invoiceRows = await queryAsync('SELECT expires_at FROM crypto_invoices WHERE id = ?', [insert.insertId]);
    return res.status(201).json({
      success: true, invoice_id: insert.insertId, address, amount, received_amount: 0,
      remaining_amount: amount, expires_at: invoiceRows[0].expires_at, network: 'BEP20 (BSC)'
    });
  } catch (error) {
    console.error('[crypto] invoice creation failed:', error.message);
    return res.status(500).json({ success: false, error: 'Unable to create a crypto invoice' });
  }
});

router.get('/crypto-invoice/:id', async (req, res) => {
  const userId = requireSessionUser(req, res);
  if (!userId) return;
  const rows = await queryAsync(
    `SELECT id, status, amount, received_amount,
            GREATEST(0, amount - received_amount) AS remaining_amount, expires_at
     FROM crypto_invoices WHERE id = ? AND user_id = ? LIMIT 1`,
    [req.params.id, userId]
  );
  if (!rows.length) return res.status(404).json({ success: false, error: 'Invoice not found' });
  return res.json({ success: true, ...rows[0] });
});

async function sweepInvoice(invoice) {
  try {
    const { cryptoRoot: root, masterWallet: master } = getWallets();
    const child = root.deriveChild(Number(invoice.hd_index)).connect(provider);
    const usdt = new Contract(USDT_BSC, usdtWriteAbi, child);
    const balance = await usdt.balanceOf(child.address);
    if (balance === 0n) {
      await queryAsync("UPDATE crypto_invoices SET status = 'swept' WHERE id = ? AND status IN ('paid', 'expired')", [invoice.id]);
      return;
    }

    const gasLimit = await usdt.transfer.estimateGas(MAIN_WALLET, balance);
    const feeData = await provider.getFeeData();
    const gasPrice = feeData.gasPrice ?? parseUnits('1', 'gwei');
    const requiredGas = (gasLimit * gasPrice * 125n) / 100n;
    const childBnb = await provider.getBalance(child.address);
    if (childBnb < requiredGas) {
      const gasFunding = await master.sendTransaction({ to: child.address, value: requiredGas - childBnb });
      await gasFunding.wait();
    }
    const transfer = await usdt.transfer(MAIN_WALLET, balance);
    await transfer.wait();
    await queryAsync("UPDATE crypto_invoices SET status = 'swept' WHERE id = ? AND status IN ('paid', 'expired')", [invoice.id]);
    console.log(`[crypto] swept invoice ${invoice.id}`);
  } catch (error) {
    console.error(`[crypto] sweep failed for invoice ${invoice.id}:`, error.message);
  }
}

async function processInvoicePayments(invoice, usdtRead, currentBlock) {
  const events = await usdtRead.queryFilter(usdtRead.filters.Transfer(null, invoice.address), Math.max(0, currentBlock - 5000), currentBlock);
  for (const event of events) {
    if (currentBlock - event.blockNumber < CONFIRMATIONS_REQUIRED) continue;
    const recorded = await queryAsync(
      `INSERT IGNORE INTO crypto_invoice_payments (invoice_id, tx_hash, log_index, amount, confirmed_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [invoice.id, event.transactionHash, event.index, formatUnits(event.args.value, 18)]
    );
    if (recorded.affectedRows) {
      await queryAsync(
        `UPDATE crypto_invoices SET received_amount =
          (SELECT COALESCE(SUM(amount), 0) FROM crypto_invoice_payments WHERE invoice_id = ?)
         WHERE id = ? AND status = 'pending'`, [invoice.id, invoice.id]
      );
    }
  }

  const latest = await queryAsync("SELECT * FROM crypto_invoices WHERE id = ? AND status = 'pending'", [invoice.id]);
  if (!latest.length) return;
  const current = latest[0];
  if (parseUnits(String(current.received_amount || 0), 18) < parseUnits(String(current.amount), 18)) return;

  await queryAsync('START TRANSACTION');
  try {
    const claimed = await queryAsync(
      "UPDATE crypto_invoices SET status = 'paid', tx_hash = ?, paid_at = NOW() WHERE id = ? AND status = 'pending'",
      [events.at(-1)?.transactionHash || null, current.id]
    );
    if (claimed.affectedRows) await approveUserAccount(current.user_id);
    await queryAsync('COMMIT');
    if (claimed.affectedRows) console.log(`[crypto] account ${current.user_id} auto-approved from invoice ${current.id}`);
  } catch (error) {
    try { await queryAsync('ROLLBACK'); } catch (_) {}
    throw error;
  }
}

export async function watchCryptoPayments() {
  if (watcherRunning) return;
  watcherRunning = true;
  try {
    getWallets();
    // Stop an incomplete invoice before scanning. The 15-minute grace period
    // allows a payment made near expiry to receive all confirmations, while
    // preventing late payments from activating an expired account.
    await queryAsync(
      `UPDATE crypto_invoices SET status = 'expired'
       WHERE status = 'pending' AND received_amount < amount
         AND expires_at <= DATE_SUB(NOW(), INTERVAL ${EXPIRY_GRACE_MINUTES} MINUTE)`
    );
    const pending = await queryAsync("SELECT * FROM crypto_invoices WHERE status = 'pending'");
    const paid = await queryAsync("SELECT * FROM crypto_invoices WHERE status = 'paid'");
    for (const invoice of paid) await sweepInvoice(invoice);

    if (pending.length) {
      const usdtRead = new Contract(USDT_BSC, usdtReadAbi, provider);
      const currentBlock = await provider.getBlockNumber();
      for (const invoice of pending) await processInvoicePayments(invoice, usdtRead, currentBlock);
    }

    const expiredPartials = await queryAsync("SELECT * FROM crypto_invoices WHERE status = 'expired' AND received_amount > 0");
    for (const invoice of expiredPartials) await sweepInvoice(invoice);
  } catch (error) {
    console.error('[crypto] watcher error:', error.message);
  } finally {
    watcherRunning = false;
  }
}

export function startCryptoWatcher() {
  try { getWallets(); }
  catch (error) {
    console.error(`[crypto] watcher disabled: ${error.message}`);
    return;
  }
  watchCryptoPayments();
  setInterval(watchCryptoPayments, 20_000);
}

export default router;
