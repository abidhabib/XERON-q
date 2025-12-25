// controllers/adminMonthlySalaryController.js
import { queryAsync } from '../utils/queryAsync.js';

// Get applications with optional status filter
export const getPendingApplications = async (req, res) => {
  try {
    const { status = 'pending' } = req.query;
    
    let statusCondition = '';
    if (status === 'pending') {
      statusCondition = "WHERE status IS NULL OR status = 'pending'";
    } else if (status === 'approved') {
      statusCondition = "WHERE status = 'approved'";
    } else if (status === 'rejected') {
      statusCondition = "WHERE status = 'rejected'";
    }

    const rows = await queryAsync(`
      SELECT 
        id, user_id, full_name, document_type, document_number,
        phone_country_code, phone_number,
        whatsapp_country_code, whatsapp_number,
        identity_front_url, identity_back_url, selfie_url,
        status, created_at
      FROM salary_applications
      ${statusCondition}
      ORDER BY created_at DESC
    `);

    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error('getPendingApplications:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch applications' });
  }
};

export const getApplicationDetails = async (req, res) => {
  const { id } = req.params;
  try {
    const [row] = await queryAsync(
      `SELECT * FROM salary_applications WHERE id = ?`,
      [id]
    );
    if (!row) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }
    return res.json({ success: true, data: row });
  } catch (error) {
    console.error('getApplicationDetails:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch application' });
  }
};

export const approveApplication = async (req, res) => {
  const { id } = req.params;
  try {
    const [existing] = await queryAsync(
      `SELECT status FROM salary_applications WHERE id = ?`,
      [id]
    );

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }

    if (existing.status === 'approved') {
      return res.status(400).json({ success: false, error: 'Already approved' });
    }

    await queryAsync(
      `UPDATE salary_applications SET status = 'approved', updated_at = NOW() WHERE id = ?`,
      [id]
    );

    // Optional: Send notification, update user eligibility, etc.

    return res.json({ success: true, message: 'Application approved' });
  } catch (error) {
    console.error('approveApplication:', error);
    return res.status(500).json({ success: false, error: 'Failed to approve application' });
  }
};

export const rejectApplication = async (req, res) => {
  const { id } = req.params;
  try {
    const [existing] = await queryAsync(
      `SELECT status FROM salary_applications WHERE id = ?`,
      [id]
    );

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }

    if (existing.status === 'rejected') {
      return res.status(400).json({ success: false, error: 'Already rejected' });
    }

    await queryAsync(
      `UPDATE salary_applications SET status = 'rejected', updated_at = NOW() WHERE id = ?`,
      [id]
    );

    return res.json({ success: true, message: 'Application rejected' });
  } catch (error) {
    console.error('rejectApplication:', error);
    return res.status(500).json({ success: false, error: 'Failed to reject application' });
  }
};