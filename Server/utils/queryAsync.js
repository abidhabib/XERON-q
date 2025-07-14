import con from "../config/db.js";

export const queryAsync = (query, params) => {
    return new Promise((resolve, reject) => {
        con.query(query, params, (error, results) => {
            if (error) {
                return reject(error);
            }
            resolve(results);
        });
    });
};
