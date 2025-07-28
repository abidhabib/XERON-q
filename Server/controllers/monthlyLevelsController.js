import { queryAsync } from "../utils/queryAsync.js"; // Assuming you have a utility for async DB queries

export const getMonthlyLevels = async (req, res) => {
    try {
        const sql = 'SELECT id, month_level, required_joins, salary, salary_date, created_at, updated_at FROM monthly_levels ORDER BY month_level ASC';
        const levels = await queryAsync(sql);
        res.json({ status: 'success',  levels });
    } catch (error) {
        console.error("Error fetching monthly levels:", error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch monthly levels', error: error.message });
    }
};

export const createMonthlyLevel = async (req, res) => {
    const { month_level, required_joins, salary, salary_date } = req.body;

    // Basic Validation (include salary_date)
    const errors = [];
    if (month_level === undefined || month_level === null || month_level === '') errors.push('Month Level is required');
    if (required_joins === undefined || required_joins === null || required_joins === '') errors.push('Required Joins is required');
    if (salary === undefined || salary === null || salary === '') errors.push('Salary is required');
    // salary_date is optional, but if provided, validate it as an integer between 1 and 31
    if (salary_date !== undefined && salary_date !== null && salary_date !== '') {
         const dayValue = Number(salary_date);
         if (isNaN(dayValue) || dayValue < 1 || dayValue > 31 || !Number.isInteger(dayValue)) {
              errors.push('Salary Date must be an integer between 1 and 31, or left empty.');
         }
    }

    if (errors.length > 0) {
        return res.status(400).json({ status: 'error', message: errors.join(', ') });
    }

    // Type conversion and validation (rest remains mostly the same)
    const levelValue = Number(month_level);
    const joinsValue = Number(required_joins);
    const salaryValue = Number(salary);
    let salaryDateValue = null; // Default to null
    if (salary_date !== undefined && salary_date !== null && salary_date !== '') {
        salaryDateValue = Number(salary_date); // Convert to number
    }

    if (isNaN(levelValue) || levelValue <= 0 || !Number.isInteger(levelValue)) {
        errors.push('Month Level must be a positive integer');
    }
    if (isNaN(joinsValue) || joinsValue < 0 || !Number.isInteger(joinsValue)) {
        errors.push('Required Joins must be a non-negative integer');
    }
    if (isNaN(salaryValue) || salaryValue < 0) {
        errors.push('Salary must be a non-negative number');
    }
    // Re-check salary_date validation after conversion if needed
     if (salaryDateValue !== null && (isNaN(salaryDateValue) || salaryDateValue < 1 || salaryDateValue > 31 || !Number.isInteger(salaryDateValue))) {
          errors.push('Salary Date must be an integer between 1 and 31, or left empty.');
     }


    if (errors.length > 0) {
        return res.status(400).json({ status: 'error', message: errors.join(', ') });
    }

    try {
        // Check for duplicate level (remains the same)
        const checkSql = 'SELECT id FROM monthly_levels WHERE month_level = ?';
        const existingLevel = await queryAsync(checkSql, [levelValue]);
        if (existingLevel.length > 0) {
            return res.status(409).json({ status: 'error', message: 'A level with this Month Level already exists.' });
        }

        const insertSql = 'INSERT INTO monthly_levels (month_level, required_joins, salary, salary_date) VALUES (?, ?, ?, ?)';
        const result = await queryAsync(insertSql, [levelValue, joinsValue, salaryValue, salaryDateValue]); // salaryDateValue is number or null

        const newLevelId = result.insertId;
        const selectSql = 'SELECT id, month_level, required_joins, salary, salary_date, created_at, updated_at FROM monthly_levels WHERE id = ?';
        const [newLevel] = await queryAsync(selectSql, [newLevelId]);

        res.status(201).json({ status: 'success', message: 'Monthly level created successfully.',  newLevel });
    } catch (error) {
        console.error("Error creating monthly level:", error);
        res.status(500).json({ status: 'error', message: 'Database operation failed', error: error.message });
    }
};

export const updateMonthlyLevel = async (req, res) => {
    const { id } = req.params;
    const { month_level, required_joins, salary, salary_date } = req.body; // salary_date is now a day (integer) or null/empty

    const idValue = Number(id);
    if (isNaN(idValue) || idValue <= 0) {
        return res.status(400).json({ status: 'error', message: 'Invalid ID provided.' });
    }

    // Basic Validation (allowing partial updates)
    const errors = [];
    let levelValue = undefined;
    let joinsValue = undefined;
    let salaryValue = undefined;
    let salaryDateValue = undefined; // New variable for day of month

    if (month_level !== undefined) {
        levelValue = Number(month_level);
        if (isNaN(levelValue) || levelValue <= 0 || !Number.isInteger(levelValue)) {
            errors.push('Month Level must be a positive integer');
        }
    }
    if (required_joins !== undefined) {
        joinsValue = Number(required_joins);
        if (isNaN(joinsValue) || joinsValue < 0 || !Number.isInteger(joinsValue)) {
            errors.push('Required Joins must be a non-negative integer');
        }
    }
    if (salary !== undefined) {
         salaryValue = Number(salary);
        if (isNaN(salaryValue) || salaryValue < 0) {
            errors.push('Salary must be a non-negative number');
        }
    }
    // Handle salary_date update (optional field)
    if (salary_date !== undefined) {
        // If it's explicitly set to null, empty string, or 0, set to NULL in DB
        if (salary_date === null || salary_date === '' || salary_date === 0 || salary_date?.trim() === '') {
            salaryDateValue = null; // Explicitly set to NULL in DB
        } else {
             // Validate as integer between 1 and 31
             const dayValue = Number(salary_date);
             if (isNaN(dayValue) || dayValue < 1 || dayValue > 31 || !Number.isInteger(dayValue)) {
                  errors.push('Salary Date must be an integer between 1 and 31, or left empty/null.');
             } else {
                 salaryDateValue = dayValue; // Valid day integer
             }
        }
    }


    if (errors.length > 0) {
        return res.status(400).json({ status: 'error', message: errors.join(', ') });
    }

    try {
        // Check if level exists (remains the same)
        const checkSql = 'SELECT id FROM monthly_levels WHERE id = ?';
        const existingLevel = await queryAsync(checkSql, [idValue]);
        if (existingLevel.length === 0) {
             return res.status(404).json({ status: 'error', message: 'Monthly level not found.' });
        }

        // If month_level is being updated, check for uniqueness (remains the same)
        if (levelValue !== undefined) {
             const checkDuplicateSql = 'SELECT id FROM monthly_levels WHERE month_level = ? AND id != ?';
             const duplicateLevel = await queryAsync(checkDuplicateSql, [levelValue, idValue]);
             if (duplicateLevel.length > 0) {
                 return res.status(409).json({ status: 'error', message: 'Another level with this Month Level already exists.' });
             }
        }

        // Build dynamic update query (now includes salary_date as integer or NULL)
        const updates = [];
        const values = [];
        if (levelValue !== undefined) {
            updates.push('month_level = ?');
            values.push(levelValue);
        }
        if (joinsValue !== undefined) {
            updates.push('required_joins = ?');
            values.push(joinsValue);
        }
        if (salaryValue !== undefined) {
            updates.push('salary = ?');
            values.push(salaryValue);
        }
        // Handle salary_date update
        if (salaryDateValue !== undefined) { // This check ensures we only add it if it was in the request body
             updates.push('salary_date = ?');
             values.push(salaryDateValue); // This is now an integer (1-31) or null
        }

        if (updates.length === 0) {
             return res.status(400).json({ status: 'error', message: 'No valid fields provided for update.' });
        }

        values.push(idValue); // Add ID for WHERE clause

        const updateSql = `UPDATE monthly_levels SET ${updates.join(', ')} WHERE id = ?`;
        await queryAsync(updateSql, values);

        // Fetch the updated level to return
        const selectSql = 'SELECT id, month_level, required_joins, salary, salary_date, created_at, updated_at FROM monthly_levels WHERE id = ?';
        const [updatedLevel] = await queryAsync(selectSql, [idValue]);

        res.json({ status: 'success', message: 'Monthly level updated successfully.', data: updatedLevel });
    } catch (error) {
        console.error("Error updating monthly level:", error);
        res.status(500).json({ status: 'error', message: 'Database operation failed', error: error.message });
    }
};

// DELETE /api/monthly-levels/:id
export const deleteMonthlyLevel = async (req, res) => {
    const { id } = req.params;
    const idValue = Number(id);

    if (isNaN(idValue) || idValue <= 0) {
        return res.status(400).json({ status: 'error', message: 'Invalid ID provided.' });
    }

    try {
        const deleteSql = 'DELETE FROM monthly_levels WHERE id = ?';
        const result = await queryAsync(deleteSql, [idValue]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ status: 'error', message: 'Monthly level not found.' }); // 404 Not Found
        }

        res.json({ status: 'success', message: 'Monthly level deleted successfully.' });
    } catch (error) {
        console.error("Error deleting monthly level:", error);
        // Handle potential foreign key constraint errors if needed
        if (error.code === 'ER_ROW_IS_REFERENCED_2' || error.errno === 1451) {
             res.status(409).json({ status: 'error', message: 'Cannot delete this level because it is referenced by other data.' }); // 409 Conflict
        } else {
             res.status(500).json({ status: 'error', message: 'Database operation failed', error: error.message });
        }
    }
};