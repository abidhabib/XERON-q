// controllers/ContactController.js
import con from '../config/db.js';

// Helper: Get user's referral chain (up to 10 levels) - reusable for validation
const getUserReferralChain = async (userId) => {
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
  `, [userId]);
  
  return chain;
};

// Helper: Verify if a parent is eligible to be reviewed by this user
const isEligibleForReview = async (reviewerId, parentId) => {
  // ✅ Security: Verify parentId exists in reviewer's referral chain
  const chain = await getUserReferralChain(reviewerId);
  const parentInChain = chain.find(u => u.id === parentId);
  
  if (!parentInChain) {
    console.warn(`Review attempt: user ${reviewerId} tried to review non-chain user ${parentId}`);
    return { eligible: false, reason: 'not_in_chain' };
  }
  
  // ✅ Security: Verify parent has approved application + unlocked salary
  const [apps] = await con.promise().query(`
    SELECT sa.whatsapp_number, sa.whatsapp_country_code, 
           sa.phone_number, sa.phone_country_code, sa.status
    FROM salary_applications sa
    WHERE sa.user_id = ? AND sa.status = 'approved'
  `, [parentId]);
  
  if (apps.length === 0 || !parentInChain.monthly_salary_unlocked) {
    console.warn(`Review attempt: user ${parentId} not eligible (app: ${apps.length}, unlocked: ${parentInChain.monthly_salary_unlocked})`);
    return { eligible: false, reason: 'not_eligible' };
  }
  
  return { eligible: true, contactData: apps[0], parentData: parentInChain };
};

export const getContactInfo = async (req, res) => {
  const userId = req.session?.userId;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const chain = await getUserReferralChain(userId);

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
      // ✅ Security: Verify review ownership (reviewer can only check their own reviews)
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
    // ✅ Security: Generic error message
    res.status(500).json({ error: 'Failed to fetch contact info' });
  }
};

export const submitReview = async (req, res) => {
  const { parentId, rating } = req.body;
  const reviewerId = req.session?.userId;

  // ✅ Security: Auth check first
  if (!reviewerId) return res.status(401).json({ error: 'Unauthorized' });
  
  // ✅ Security: Input validation
  if (!parentId || typeof parentId !== 'number' || !Number.isInteger(parentId)) {
    console.warn(`Invalid parentId format from user ${reviewerId}: ${parentId}`);
    return res.status(400).json({ error: 'Invalid request' });
  }
  
  if (!rating || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5' });
  }

  try {
    // ✅ CRITICAL SECURITY: Verify parentId is actually eligible for review by this user
    const eligibility = await isEligibleForReview(reviewerId, parentId);
    
    if (!eligibility.eligible) {
      // ✅ Security: Generic error to prevent enumeration
      return res.status(400).json({ error: 'Cannot submit review' });
    }

    // ✅ Security: Prevent duplicate reviews (DB constraint + app check)
    const [existing] = await con.promise().query(
      `SELECT 1 FROM reviews WHERE reviewer_id = ? AND reviewed_id = ? LIMIT 1`,
      [reviewerId, parentId]
    );
    
    if (existing.length > 0) {
      return res.status(400).json({ error: 'You already reviewed this mentor' });
    }

    // ✅ Security: Use transaction for atomic operations
    await con.promise().beginTransaction();
    
    try {
      // Insert review
      await con.promise().query(
        `INSERT INTO reviews (reviewer_id, reviewed_id, rating, created_at) VALUES (?, ?, ?, NOW())`,
        [reviewerId, parentId, rating]
      );

      // Recalculate average (with proper rounding)
      const [avgResult] = await con.promise().query(`
        SELECT ROUND(AVG(rating), 1) as avg_rating 
        FROM reviews 
        WHERE reviewed_id = ?
      `, [parentId]);

      const avgRating = avgResult[0].avg_rating || 0;

      // Update user's average_rating
      await con.promise().query(
        `UPDATE users SET average_rating = ?, updated_at = NOW() WHERE id = ?`,
        [avgRating, parentId]
      );

      // Notify mentor
      const notificationMsg = `You received a ${rating}-star review from your Downline member.`;
      await con.promise().query(
        `INSERT INTO notifications (user_id, msg, is_read, created_at)
         VALUES (?, ?, 0, NOW())`,
        [parentId, notificationMsg]
      );

      await con.promise().commit();
      
      // ✅ Security: Audit log
      console.log(`Review submitted: reviewer=${reviewerId}, reviewed=${parentId}, rating=${rating}`);

      res.json({ 
        success: true,
        message: 'Review submitted',
        average_rating: avgRating
      });
      
    } catch (dbError) {
      await con.promise().rollback();
      throw dbError;
    }
    
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'You have already reviewed this mentor' });
    }
    
    res.status(500).json({ error: 'Submission failed' });
  }
};