// utils/authMiddleware.js
export const authenticateUser = (req, res, next) => {
  if (req.session?.userId) {
    return next();
  }
  return res.status(401).json({ error: 'Unauthorized' });
};