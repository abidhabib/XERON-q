import webpush from 'web-push';
import dotenv from 'dotenv';
dotenv.config();

export default function setupWebPush() {
    webpush.setVapidDetails(
        'mailto:your@email.com',
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
    console.log('✅ WebPush initialized');
}
