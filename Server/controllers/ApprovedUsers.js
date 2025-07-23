import { queryAsync } from "../utils/queryAsync.js";

    

export const getAllApprovedUsers = async (req, res) => {
    try {
        const {
            page = 1,
            perPage = 100,
            searchTerm = '',
            sortKey = 'id',
            sortDirection = 'asc'
        } = req.query;

        const offset = (page - 1) * perPage;

        // Validate and sanitize sortKey
        const validSortKeys = ['id', 'name', 'email', 'balance', 'team', 'trx_id',
            'total_withdrawal', 'team', 'refer_by', 'level_updated', 'level'];
        const sortField = validSortKeys.includes(sortKey) ? sortKey : 'id';
        const sortDir = sortDirection.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

        // Base query with all needed fields
        let baseQuery = `
        SELECT 
          u.id, u.balance,u.blocked,u.refer_by, u.team, u.name, u.email, u.phoneNumber, 
          u.backend_wallet, u.trx_id, u.total_withdrawal, u.refer_by, 
          u.password, u.level_updated, u.level, u.all_credits, u.today_wallet
        FROM users u
        WHERE u.approved = 1 AND u.payment_ok = 1
      `;

        // Count query
        let countQuery = `
        SELECT COUNT(*) AS totalCount 
        FROM users u
        WHERE u.approved = 1 AND u.payment_ok = 1
      `;

        const params = [];
        let whereClause = '';

        if (searchTerm) {
            whereClause = ' AND (u.name LIKE ? OR u.email LIKE ? OR u.trx_id LIKE ? OR u.phoneNumber  LIKE ? OR u.id = ?)';
            params.push(`%${searchTerm}%`, `%${searchTerm}%`, searchTerm ? `%${searchTerm}%` : '', searchTerm ? `%${searchTerm}%` : '', searchTerm);
        } else {
            whereClause = ' AND u.team > 1';
        }

        baseQuery += whereClause;
        countQuery += whereClause;

        // Get total count
        const countResult = await queryAsync(countQuery, [...params]);
        const totalCount = countResult[0].totalCount;
        const totalPages = Math.ceil(totalCount / perPage);

        // Add sorting and pagination to main query
        baseQuery += ` ORDER BY ${sortField} ${sortDir} LIMIT ?, ?`;
        params.push(offset, parseInt(perPage));

        // Execute main query
        const result = await queryAsync(baseQuery, [...params]);

        // Extract user IDs for batch processing
        const userIds = result.map(user => user.id);

        if (userIds.length > 0) {
            // Batch fetch bonus data
            const bonusHistoryQuery = `
          SELECT user_id, SUM(amount) AS total_bonus 
          FROM bonus_history 
          WHERE user_id IN (?)
          GROUP BY user_id
        `;

            const bonusHistoryLevelUpQuery = `
          SELECT user_id, SUM(bonus_amount) AS total_level_up_bonus 
          FROM bonus_history_level_up 
          WHERE user_id IN (?)
          GROUP BY user_id
        `;

            const [bonusHistoryResults, bonusHistoryLevelUpResults] = await Promise.all([
                queryAsync(bonusHistoryQuery, [userIds]),
                queryAsync(bonusHistoryLevelUpQuery, [userIds])
            ]);

            // Create maps for quick lookup
            const bonusMap = new Map();
            const levelUpMap = new Map();

            bonusHistoryResults.forEach(row => bonusMap.set(row.user_id, row.total_bonus || 0));
            bonusHistoryLevelUpResults.forEach(row => levelUpMap.set(row.user_id, row.total_level_up_bonus || 0));

            // Calculate finalResult for each user
            const usersWithFinalResult = result.map(user => {
                const totalBonus = bonusMap.get(user.id) || 0;
                const totalLevelUpBonus = levelUpMap.get(user.id) || 0;

                const finalResult = user.all_credits -
                    user.backend_wallet -
                    user.balance -
                    user.total_withdrawal -
                    totalBonus -
                    totalLevelUpBonus -
                    user.today_wallet;

                return {
                    ...user,
                    finalResult
                };
            });

            return res.status(200).json({
                success: true,
                approvedUsers: usersWithFinalResult,
                totalCount,
                currentPage: parseInt(page),
                totalPages
            });
        }

        // Return empty result if no users found
        res.status(200).json({
            success: true,
            approvedUsers: [],
            totalCount,
            currentPage: parseInt(page),
            totalPages
        });

    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while fetching approved users.'
        });
    }
}