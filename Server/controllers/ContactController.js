// controllers/ContactController.js
import con from '../config/db.js';


export const getContactInfo = async (req, res) => {
  const userId = req.session?.userId;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const [chain] = await con.promise().query(`
      WITH RECURSIVE referral_chain AS (
        SELECT id, refer_by, monthly_salary_unlocked, name
        FROM users
        WHERE id = ?
        UNION ALL
        SELECT u.id, u.refer_by, u.monthly_salary_unlocked, u.name
        FROM users u
        INNER JOIN referral_chain rc ON u.id = rc.refer_by
        WHERE rc.refer_by IS NOT NULL
        LIMIT 10
      )
      SELECT id, refer_by, monthly_salary_unlocked, name
      FROM referral_chain
      WHERE refer_by IS NOT NULL
      ORDER BY FIELD(id, ?)
    `, [userId, userId]);

    let contactUser = null;
    let alreadyReviewed = false;
    let userRating = null;

    for (const user of chain) {
        if (user.id === userId) continue;
      const [apps] = await con.promise().query(`
        SELECT 
          sa.whatsapp_number,
          sa.whatsapp_country_code,
          sa.phone_number,
          sa.phone_country_code,
          sa.status,
          u.average_rating
        FROM salary_applications sa
        JOIN users u ON sa.user_id = u.id
        WHERE sa.user_id = ? AND sa.status = 'approved'
      `, [user.id]);

      if (apps.length > 0 && user.monthly_salary_unlocked) {
        contactUser = {
          id: user.id,
          name: user.name,
          ...apps[0]
        };
        break;
      }
    }

    if (contactUser) {
      const [review] = await con.promise().query(
        `SELECT rating FROM reviews WHERE reviewer_id = ? AND reviewed_id = ?`,
        [userId, contactUser.id]
      );

      if (review.length > 0) {
        alreadyReviewed = true;
        userRating = review[0].rating;
      }
    }

    const [ownApp] = await con.promise().query(
      `SELECT status FROM salary_applications WHERE user_id = ?`,
      [userId]
    );

    const isVerified = ownApp.length > 0 && ownApp[0].status === 'approved';

    res.json({
      success: true,
      contact: contactUser,
      isVerified,
      canReview: contactUser ? !alreadyReviewed : false,
      alreadyReviewed,
      userRating
    });

  } catch (error) {
    console.error('Contact info error:', error);
    res.status(500).json({ error: 'Failed to fetch contact info' });
  }
};

// controllers/ContactController.js
export const submitReview = async (req, res) => {
  const { parentId, rating } = req.body;
  const reviewerId = req.session?.userId;

  if (!reviewerId) return res.status(401).json({ error: 'Unauthorized' });
  if (!parentId || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Invalid rating' });
  }

  try {
    // Prevent duplicate reviews (extra safety)
    const [existing] = await con.promise().query(
      `SELECT 1 FROM reviews WHERE reviewer_id = ? AND reviewed_id = ?`,
      [reviewerId, parentId]
    );
    if (existing.length > 0) {
      return res.status(400).json({ error: 'You already reviewed this mentor' });
    }

    // Insert review
    await con.promise().query(
      `INSERT INTO reviews (reviewer_id, reviewed_id, rating) VALUES (?, ?, ?)`,
      [reviewerId, parentId, rating]
    );

    // Recalculate average (with proper rounding)
    const [avgResult] = await con.promise().query(`
      SELECT ROUND(AVG(rating), 1) as avg_rating 
      FROM reviews 
      WHERE reviewed_id = ?
    `, [parentId]);

    const avgRating = avgResult[0].avg_rating;

    // Update user's average_rating
    await con.promise().query(
      `UPDATE users SET average_rating = ? WHERE id = ?`,
      [avgRating, parentId]
    );

    // Notify mentor
    const notificationMsg = `You received a ${rating}-star review from your Downline member.`;
    await con.promise().query(
      `INSERT INTO notifications (user_id, msg, is_read, created_at)
       VALUES (?, ?, 0, NOW())`,
      [parentId, notificationMsg]
    );

    res.json({ 
      success: true,
      message: 'Review submitted',
      average_rating: avgRating
    });
  } catch (error) {
    // Inside catch block
if (error.code === 'ER_DUP_ENTRY') {
  return res.status(400).json({ error: 'You have already reviewed this mentor' });
}
    console.error('Review error:', error);
    res.status(500).json({ error: 'Submission failed' });
  }
};