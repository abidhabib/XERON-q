import cron from 'node-cron';
import { checkAndApproveUsers } from './approveUsers.js';
import { resetDailyStats } from './resetDailyStats.js';

// Every 10 minutes: check for new payments
cron.schedule('*/1 * * * *', () => {
    console.log('🔄 Running scheduled user payment check...');
    checkAndApproveUsers();
});

// Every day at 3:44 AM: reset stats
cron.schedule('44 03 * * *', () => {
    console.log('🕒 Running daily stats reset...');
    resetDailyStats();
});
