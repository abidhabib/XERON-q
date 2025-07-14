import express from 'express';
import con from '../config/db.js';
import webpush from 'web-push';

const router = express.Router();

router.post('/save-subscription', (req, res) => {
    const { subscription } = req.body;
    if (!subscription?.endpoint || !subscription?.keys) {
        return res.status(400).json({ error: 'Invalid subscription format' });
    }
    const query = `
      INSERT INTO push_subscriptions (endpoint, \`keys\`)
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE
        \`keys\` = VALUES(\`keys\`),
        updated_at = CURRENT_TIMESTAMP
    `;
    con.query(query, [subscription.endpoint, JSON.stringify(subscription.keys)], (err, result) => {
        if (err) return res.status(500).json({ error: 'DB save failed' });
        res.status(201).json({ success: true, id: result.insertId });
    });
});

router.post('/remove-subscription', (req, res) => {
    const { endpoint } = req.body;
    if (!endpoint) return res.status(400).json({ error: 'Missing endpoint' });
    con.query('DELETE FROM push_subscriptions WHERE endpoint = ?', [endpoint], (err, result) => {
        if (err) return res.status(500).json({ error: 'DB delete failed' });
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
        res.json({ success: true });
    });
});

router.post('/broadcast-notification', (req, res) => {
    const { title, message, url } = req.body;
    if (!title || !message) return res.status(400).json({ error: 'Missing title or message' });

    con.query('SELECT endpoint, `keys` FROM push_subscriptions', async (err, subscriptions) => {
        if (err) return res.status(500).json({ error: 'DB error' });
        const payload = JSON.stringify({
            title,
            body: message,
            icon: '/icon-192x192.png',
            badge: '/badge-72x72.png',
            data: { url: url || '/' },
        });

        let sent = 0;
        const failed = [];

     const results = await Promise.allSettled(subscriptions.map(sub => {
    let keys;
    try {
        keys = typeof sub.keys === 'string' ? JSON.parse(sub.keys) : sub.keys;
    } catch (err) {
        console.error('❌ Failed to parse subscription keys:', sub.keys);
        return Promise.reject(err);
    }

    const parsed = { endpoint: sub.endpoint, keys };
    return webpush.sendNotification(parsed, payload);
}));


        results.forEach((result, i) => {
            if (result.status === 'fulfilled') sent++;
            else if (result.reason.statusCode === 410) failed.push(subscriptions[i].endpoint);
        });

        if (failed.length > 0) {
            con.query('DELETE FROM push_subscriptions WHERE endpoint IN (?)', [failed]);
        }

        res.json({ success: true, sent, failed: subscriptions.length - sent });
    });
});

router.get('/subscriber-count', (req, res) => {
    con.query('SELECT COUNT(*) AS count FROM push_subscriptions', (err, results) => {
        if (err) return res.status(500).json({ error: 'DB count failed' });
        res.json({ count: results[0].count });
    });
});

export default router;
