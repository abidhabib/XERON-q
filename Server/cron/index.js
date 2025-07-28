import cron from 'node-cron';
import { checkAndApproveUsers } from './approveUsers.js';
import { resetDailyStats } from './resetDailyStats.js';

cron.schedule('*/10 * * * *', () => {
    console.log('🔄 Running scheduled user payment check...');
    checkAndApproveUsers();
});

cron.schedule('44 03 * * *', () => {
    console.log('🕒 Running daily stats reset...');
    resetDailyStats();
});
