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
        const validSortKeys = [
            'id',
            'name',
            'email',
            'balance',
            'team',
            'trx_id',
            'total_withdrawal',
            'refer_by',
            'level_updated',
            'level'
        ];

        const sortField = validSortKeys.includes(sortKey) ? sortKey : 'id';
        const sortDir = sortDirection.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

        // Base query
        let baseQuery = `
            SELECT 
                u.id,
                u.balance,
                u.blocked,
                u.refer_by,
                u.team,
                u.name,
                u.email,
                u.phoneNumber,
                u.backend_wallet,
                u.trx_id,
                u.total_withdrawal,
                u.password,
                u.level_updated,
                u.level,
                u.all_credits,
                u.today_wallet
            FROM users u
            WHERE u.approved = 1
              AND u.payment_ok = 1
        `;

        // Count query
        let countQuery = `
            SELECT COUNT(*) AS totalCount
            FROM users u
            WHERE u.approved = 1
              AND u.payment_ok = 1
        `;

        const params = [];
        let whereClause = '';

        if (searchTerm) {
            whereClause = `
                AND (
                    u.name LIKE ?
                    OR u.email LIKE ?
                    OR u.trx_id LIKE ?
                    OR u.phoneNumber LIKE ?
                    OR u.id = ?
                )
            `;

            params.push(
                `%${searchTerm}%`,
                `%${searchTerm}%`,
                `%${searchTerm}%`,
                `%${searchTerm}%`,
                searchTerm
            );
        } else {
            whereClause = ` AND u.team > 1`;
        }

        baseQuery += whereClause;
        countQuery += whereClause;

        // Total count
        const countResult = await queryAsync(countQuery, [...params]);
        const totalCount = countResult[0].totalCount;
        const totalPages = Math.ceil(totalCount / perPage);

        // Add sorting & pagination
        baseQuery += ` ORDER BY ${sortField} ${sortDir} LIMIT ?, ?`;
        params.push(offset, parseInt(perPage));

        // Fetch users
        const result = await queryAsync(baseQuery, [...params]);

        const approvedUsers = result.map(user => {
            const finalResult =
                Number(user.all_credits || 0) -
                Number(user.backend_wallet || 0) -
                Number(user.balance || 0) -
                Number(user.total_withdrawal || 0) -
                Number(user.today_wallet || 0);

            return {
                ...user,
                finalResult
            };
        });

        return res.status(200).json({
            success: true,
            approvedUsers,
            totalCount,
            currentPage: parseInt(page),
            totalPages
        });

    } catch (error) {
        console.error("Database error:", error);

        return res.status(500).json({
            success: false,
            message: "An error occurred while fetching approved users."
        });
    }
};