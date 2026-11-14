import cron from 'node-cron';
import { resetDailyStats } from './resetDailyStats.js';
import { distributeWebBackendEarnings } from './distributeWebBackendEarnings.js';

// Crypto activation is watched continuously by cryptoInvoiceRoutes. The old
// hash-based payment cron is intentionally disabled: it trusted a hash entered
// by the user and could reject a legitimate payment on an RPC failure.

cron.schedule('44 03 * * *', () => {
    console.log('🕒 Running daily stats reset...');
    resetDailyStats();
});

cron.schedule('07 16 * * *', () => {
    console.log('💰 Running web backend earnings distribution...');
    distributeWebBackendEarnings();
});
