import con from "../config/db.js";

export function resetDailyStats() {
    console.log('Starting daily team reset + cleanup...');

    con.beginTransaction(err => {
        if (err) return console.error('Transaction start error:', err);

        const resetTodayQuery = `
            UPDATE users 
            SET today_team = 0 
            WHERE approved = 1 AND today_team > 0
            AND DATE(last_updated) <= CURDATE();
        `;
        con.query(resetTodayQuery, (err, result) => {
            if (err) return con.rollback(() => console.error('today_team reset failed:', err));

            const deleteClicksQuery = `DELETE FROM user_button_clicks`;
            con.query(deleteClicksQuery, (err2, result2) => {
                if (err2) return con.rollback(() => console.error('button_clicks delete failed:', err2));

                const deleteProductClicks = `DELETE FROM user_product_clicks WHERE 1`;
                con.query(deleteProductClicks, (err3, result3) => {
                    if (err3) return con.rollback(() => console.error('product_clicks delete failed:', err3));

                    con.commit(errCommit => {
                        if (errCommit) return con.rollback(() => console.error('Commit failed:', errCommit));
                        console.log('✅ Daily reset + cleanup completed.');
                    });
                });
            });
        });
    });
}
