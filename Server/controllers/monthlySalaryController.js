// controllers/monthlySalaryController.js
import { queryAsync } from "../utils/queryAsync.js";

const isValidPhoneNumber = (number) => /^\d{6,15}$/.test(number);

const getCurrentWindow = (approvedAt) => {
  const approvalDate = new Date(approvedAt);
  const now = new Date();
  
  const monthsSince = (
    (now.getFullYear() - approvalDate.getFullYear()) * 12 +
    now.getMonth() - approvalDate.getMonth()
  );
  
  let windowStart = new Date(approvalDate);
  windowStart.setMonth(approvalDate.getMonth() + monthsSince);
  
  if (windowStart > now) {
    windowStart.setMonth(windowStart.getMonth() - 1);
  }
  
  let windowEnd = new Date(windowStart);
  windowEnd.setMonth(windowStart.getMonth() + 1);
  
  return {
    start: windowStart.toISOString().split('T')[0],
    end: windowEnd.toISOString().split('T')[0],
    startDisplay: windowStart.toLocaleDateString(),
    endDisplay: windowEnd.toLocaleDateString()
  };
};

export const getMonthlySalaryStatus = async (req, res) => {
  const userId = req.session?.userId;
  console.log('🔍 [getMonthlySalaryStatus] Request from user ID:', userId);
  
  if (!userId) {
    console.warn('⚠️ [getMonthlySalaryStatus] Unauthorized access attempt');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log(`🔍 [getMonthlySalaryStatus] Fetching user data for ID: ${userId}`);
    const [userRow] = await queryAsync(`
      SELECT 
        u.approved_at,
        u.monthly_salary_unlocked,
        s.month_salary_amount,
        s.month_salary_person_require
      FROM users u
      CROSS JOIN settings s ON s.id = 1
      WHERE u.id = ?
    `, [userId]);

    if (!userRow) {
      console.warn(`⚠️ [getMonthlySalaryStatus] User not found: ${userId}`);
      return res.status(404).json({ error: 'User not found' });
    }

    const { approved_at, monthly_salary_unlocked, month_salary_amount, month_salary_person_require } = userRow;
    console.log(`📊 [getMonthlySalaryStatus] User data:`, { 
      approved_at, 
      monthly_salary_unlocked, 
      month_salary_amount, 
      month_salary_person_require 
    });
    
    if (!approved_at) {
      console.log(`ℹ️ [getMonthlySalaryStatus] User ${userId} not approved yet`);
      return res.json({
        isEligible: false,
        requiredTeam: parseInt(month_salary_person_require) || 0,
        currentTeam: 0,
        salaryAmount: parseFloat(month_salary_amount) || 0,
        applicationStatus: null,
        hasCollectedThisMonth: false,
        currentWindow: null
      });
    }

    const required = Math.max(0, Math.floor(parseFloat(month_salary_person_require))) || 0;
    const isEligible = !!monthly_salary_unlocked;
    const window = getCurrentWindow(approved_at);
    console.log(`📅 [getMonthlySalaryStatus] Current window for user ${userId}:`, window);

    let currentCount = 0;
    if (!isEligible) {
      console.log(`🔍 [getMonthlySalaryStatus] Checking team count for window: ${window.start}`);
      const [count] = await queryAsync(`
        SELECT recruit_count FROM window_recruits
        WHERE user_id = ? AND window_start = ?
      `, [userId, window.start]);
      currentCount = count?.recruit_count || 0;
      console.log(`👥 [getMonthlySalaryStatus] Team count: ${currentCount}/${required}`);
    }

    console.log(`🔍 [getMonthlySalaryStatus] Fetching latest application status for user ${userId}`);
    const [app] = await queryAsync(`
      SELECT status FROM salary_applications
      WHERE user_id = ? ORDER BY created_at DESC LIMIT 1
    `, [userId]);
    const applicationStatus = app?.status || null;
    console.log(`📝 [getMonthlySalaryStatus] Application status: ${applicationStatus}`);

    const currentMonth = new Date().toISOString().slice(0, 7).replace('-', '');
    console.log(`💰 [getMonthlySalaryStatus] Checking payment for month: ${currentMonth}`);
    const [payment] = await queryAsync(`
      SELECT id FROM monthly_salary_payments
      WHERE user_id = ? AND payment_month = ?
    `, [userId, currentMonth]);
    const hasCollectedThisMonth = !!payment;
    console.log(`✅ [getMonthlySalaryStatus] Has collected this month: ${hasCollectedThisMonth}`);

    const response = {
      isEligible,
      requiredTeam: required,
      currentTeam: currentCount,
      salaryAmount: parseFloat(month_salary_amount) || 0,
      applicationStatus,
      hasCollectedThisMonth,
      currentWindow: {
        start: window.startDisplay,
        end: window.endDisplay
      }
    };
    
    console.log(`✅ [getMonthlySalaryStatus] Returning status for user ${userId}:`, response);
    return res.json(response);
    
  } catch (error) {
    console.error('❌ [getMonthlySalaryStatus] ERROR:', error);
    return res.status(500).json({ error: 'Failed to fetch status' });
  }
};

export const applyForMonthlySalary = async (req, res) => {
  const userId = req.session?.userId;
  console.log('🔍 [applyForMonthlySalary] Application start for user ID:', userId);

  if (!userId) {
    console.warn('⚠️ [applyForMonthlySalary] Unauthorized access attempt');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const {
    fullName,
    documentType,
    documentNumber,
    phoneCountryCode,
    phoneNumber,
    whatsappCountryCode,
    whatsappNumber
  } = req.body;

  console.log('📄 [applyForMonthlySalary] Application data:', { 
    fullName, documentType, documentNumber, phoneCountryCode, 
    phoneNumber, whatsappCountryCode, whatsappNumber,
    hasFiles: !!req.files
  });

  // === Input Validation ===
  if (!fullName?.trim() || fullName.trim().length < 2) {
    console.warn('⚠️ [applyForMonthlySalary] Validation failed: Full name invalid');
    return res.status(400).json({ error: 'Full name is required (min 2 characters)' });
  }
  if (!['nic', 'passport', 'driving_license'].includes(documentType)) {
    console.warn('⚠️ [applyForMonthlySalary] Validation failed: Invalid ID type');
    return res.status(400).json({ error: 'Invalid ID type' });
  }
  if (!documentNumber?.trim() || documentNumber.length < 3) {
    console.warn('⚠️ [applyForMonthlySalary] Validation failed: ID number invalid');
    return res.status(400).json({ error: 'Valid ID number is required (min 3 characters)' });
  }
  if (!phoneCountryCode || !phoneNumber || !isValidPhoneNumber(phoneNumber)) {
    console.warn('⚠️ [applyForMonthlySalary] Validation failed: Phone number invalid');
    return res.status(400).json({ error: 'Valid phone number is required' });
  }
  if (!whatsappCountryCode || !whatsappNumber || !isValidPhoneNumber(whatsappNumber)) {
    console.warn('⚠️ [applyForMonthlySalary] Validation failed: WhatsApp number invalid');
    return res.status(400).json({ error: 'Valid WhatsApp number is required' });
  }

  // === File Validation ===
  if (!req.files) {
    console.warn('⚠️ [applyForMonthlySalary] Validation failed: No files uploaded');
    return res.status(400).json({ error: 'Identity photos are missing' });
  }

  const identityFront = req.files.identityFront?.[0];
  const identityBack = req.files.identityBack?.[0];
  const selfie = req.files.selfie?.[0];

  if (!identityFront || !identityBack || !selfie) {
    console.warn('⚠️ [applyForMonthlySalary] Validation failed: Missing required files', {
      hasFront: !!identityFront,
      hasBack: !!identityBack,
      hasSelfie: !!selfie
    });
    return res.status(400).json({ error: 'All three photos (ID front, ID back, selfie) are required' });
  }

  console.log('📁 [applyForMonthlySalary] File names:', {
    front: identityFront.filename,
    back: identityBack.filename,
    selfie: selfie.filename
  });

  try {
    console.log('🔄 [applyForMonthlySalary] Starting transaction for user:', userId);
    await queryAsync('START TRANSACTION');

    const [userCheck] = await queryAsync(`
      SELECT monthly_salary_unlocked FROM users WHERE id = ?
    `, [userId]);

    if (!userCheck || !userCheck.monthly_salary_unlocked) {
      console.warn('⚠️ [applyForMonthlySalary] User not eligible:', userId);
      await queryAsync('ROLLBACK');
      return res.status(403).json({ error: 'You have not unlocked monthly salary eligibility' });
    }

    console.log('💾 [applyForMonthlySalary] Inserting application for user:', userId);
    await queryAsync(`
      INSERT INTO salary_applications (
        user_id, full_name, document_type, document_number,
        phone_country_code, phone_number,
        whatsapp_country_code, whatsapp_number,
        identity_front_url, identity_back_url, selfie_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      userId,
      fullName.trim(),
      documentType,
      documentNumber.trim(),
      phoneCountryCode,
      phoneNumber,
      whatsappCountryCode,
      whatsappNumber,
      identityFront.filename,
      identityBack.filename,
      selfie.filename
    ]);

    await queryAsync('COMMIT');
    console.log('✅ [applyForMonthlySalary] Application submitted successfully for user:', userId);
    return res.json({ success: true, message: 'Application submitted successfully' });

  } catch (error) {
    await queryAsync('ROLLBACK');
    console.error('❌ [applyForMonthlySalary] ERROR:', error);
    return res.status(500).json({ error: 'Failed to submit application. Please try again.' });
  }
};

export const collectMonthlySalary = async (req, res) => {
    console.log('SESSION USER ID (backend):', req.session?.userId);
  const userId = req.session?.userId;
  console.log('🔍 [collectMonthlySalary] Collection request from user ID:', userId);
  console.log('🔍 SESSION USER ID:', req.session?.userId);
console.log('🔍 REQUEST COOKIES:', req.headers.cookie);
  if (!userId) {
    console.warn('⚠️ [collectMonthlySalary] Unauthorized access attempt');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const currentMonth = new Date().toISOString().slice(0, 7).replace('-', '');
  console.log(`📅 [collectMonthlySalary] Current payment month: ${currentMonth}`);

  try {
    console.log('🔄 [collectMonthlySalary] Starting transaction for user:', userId);
    await queryAsync('START TRANSACTION');

    console.log(`🔍 [collectMonthlySalary] Checking for approved application for user ${userId}`);
 const appCheckRows = await queryAsync(`
  SELECT id FROM salary_applications
  WHERE user_id = ? AND status = 'approved'
`, [userId]);

if (appCheckRows.length === 0) {
  console.warn(`⚠️ [collectMonthlySalary] No approved application found for user ${userId}`);
  await queryAsync('ROLLBACK');
  return res.status(403).json({ error: 'You must have an approved application' });
}
console.log(`✅ [collectMonthlySalary] Approved application found: ID ${appCheckRows[0].id}`);
    console.log(`🔍 [collectMonthlySalary] Checking if already collected for month ${currentMonth}`);
  const paymentCheckRows = await queryAsync(`
  SELECT id FROM monthly_salary_payments 
  WHERE user_id = ? AND payment_month = ?
  FOR UPDATE
`, [userId, currentMonth]);

if (paymentCheckRows.length > 0) {
      console.warn(`⚠️ [collectMonthlySalary] Already collected for user ${userId} in month ${currentMonth}`);
      await queryAsync('ROLLBACK');
      return res.status(400).json({ error: 'You have already collected this month' });
    }

    console.log('🔍 [collectMonthlySalary] Fetching salary amount from settings');
  const settingsRows = await queryAsync(`
  SELECT month_salary_amount FROM settings WHERE id = 1
`);

if (settingsRows.length === 0) {
  console.warn('⚠️ [collectMonthlySalary] Settings row not found');
  await queryAsync('ROLLBACK');
  return res.status(500).json({ error: 'Salary settings not configured' });
}

const amount = parseFloat(settingsRows[0].month_salary_amount) || 0;
    console.log(`💰 [collectMonthlySalary] Salary amount: $${amount}`);
    
    if (amount <= 0) {
      console.warn('⚠️ [collectMonthlySalary] Salary amount not configured');
      await queryAsync('ROLLBACK');
      return res.status(400).json({ error: 'Salary amount not configured' });
    }

    console.log(`💳 [collectMonthlySalary] Updating balance for user ${userId} (+$${amount})`);
    await queryAsync(`
      UPDATE users SET balance = balance + ? WHERE id = ?
    `, [amount, userId]);

    console.log(`💾 [collectMonthlySalary] Recording payment for user ${userId} in month ${currentMonth}`);
    await queryAsync(`
      INSERT INTO monthly_salary_payments (user_id, amount, payment_month)
      VALUES (?, ?, ?)
    `, [userId, amount, currentMonth]);

    await queryAsync('COMMIT');
    console.log(`✅ [collectMonthlySalary] Salary collected successfully for user ${userId}: $${amount}`);
    return res.json({ success: true, amount });
    
  } catch (error) {
    await queryAsync('ROLLBACK');
    console.error('❌ [collectMonthlySalary] ERROR:', error);
    return res.status(500).json({ error: 'Failed to collect salary' });
  }
};

export const getMonthlySalaryHistory = async (req, res) => {
  const userId = req.session?.userId;
  console.log('🔍 [getMonthlySalaryHistory] Request from user ID:', userId);
  
  if (!userId) {
    console.warn('⚠️ [getMonthlySalaryHistory] Unauthorized access attempt');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log(`🔍 [getMonthlySalaryHistory] Fetching payment history for user ${userId}`);
    const rows = await queryAsync(`
      SELECT amount, payment_month, created_at
      FROM monthly_salary_payments
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 20
    `, [userId]);

    const history = rows.map(row => ({
      amount: parseFloat(row.amount) || 0,
      month: row.payment_month,
      date: row.created_at
    }));

    console.log(`✅ [getMonthlySalaryHistory] Found ${history.length} records for user ${userId}`);
    return res.json({ history });
    
  } catch (error) {
    console.error('❌ [getMonthlySalaryHistory] ERROR:', error);
    return res.status(500).json({ error: 'Failed to fetch history' });
  }
};