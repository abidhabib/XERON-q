import rateLimit from 'express-rate-limit';
export const registerLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
    message: {
        status: 'error',
        error: 'Too many registration attempts. Please try again after 15 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Skip successful requests (optional - remove if you want to count all)
    skipSuccessfulRequests: false
});