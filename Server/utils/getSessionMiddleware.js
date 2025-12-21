const getUserIdFromSession = (req, res) => {
    if (req.session && req.session.userId) {
        res.json({ userId: req.session.userId });
    } else {
        res.status(401).json({ error: 'User not authenticated' });
    }
};

export default getUserIdFromSession;

