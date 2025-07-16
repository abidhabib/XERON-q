import con from '../config/db.js';
import moment from 'moment';
function getDayName(dayIndex) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayIndex];
}
export const getUserSalaryStatus = async (req, res) => {
    const userId = req.params.userId;
    const currentWeek = parseInt(moment().format('YYYYWW'));
    const today = moment().day(); // 0-6 (Sun-Sat)

    try {
        const [user] = await con.promise().query(`
            SELECT u.id, u.level, u.balance AS wallet,
                   u.salary_collection_week, u.last_salary_collected_at,
                   l.salary_amount, l.salary_day, l.weekly_recruitment
            FROM users u
            JOIN levels l ON u.level = l.level
            WHERE u.id = ?
        `, [userId]);

        if (!user.length) {
            return res.status(404).json({ status: 'error', error: 'User not found' });
        }

        const userData = user[0];

        const [recruits] = await con.promise().query(`
            SELECT new_members 
            FROM weekly_recruits 
            WHERE user_id = ? AND week_id = ?
        `, [userId, currentWeek]);

        const newMembers = recruits[0]?.new_members || 0;

        let isEligible = false;
        let reason = "";

        if (today === userData.salary_day) {
            if (userData.salary_collection_week === currentWeek) {
                reason = "Already collected this week";
            } else {
                const [lastPayment] = await con.promise().query(`
                    SELECT level FROM salary_payments 
                    WHERE user_id = ?
                    ORDER BY created_at DESC 
                    LIMIT 1
                `, [userId]);

                const isFirstAtLevel = !lastPayment.length || lastPayment[0].level !== userData.level;

                if (isFirstAtLevel) {
                    isEligible = true;
                    reason = "First collection at this level";
                } else {
                    if (newMembers >= userData.weekly_recruitment) {
                        isEligible = true;
                        reason = "Met weekly requirement";
                    } else {
                        reason = `Need ${userData.weekly_recruitment - newMembers} more recruits`;
                    }
                }
            }
        } else {
            reason = `Salary day is ${getDayName(userData.salary_day)}`;
        }

        res.json({
            status: 'success',
            data: {
                currentLevel: userData.level,
                salaryAmount: userData.salary_amount,
                nextSalaryDay: userData.salary_day,
                dayName: getDayName(userData.salary_day),
                sameLevelRequirement: userData.weekly_recruitment,
                newMembersThisWeek: newMembers,
                isEligible,
                reason,
                wallet: userData.wallet
            }
        });
    } catch (error) {
        console.error('Salary status error:', error);
        res.status(500).json({ status: 'error', error: 'Server error' });
    }
};