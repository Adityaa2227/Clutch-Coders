const User = require('../models/User');

module.exports = async function(req, res, next) {
    try {
        // req.user is populated by authMiddleware (which must be called before this)
        if (!req.user || !req.user.id) {
             return res.status(401).json({ msg: 'No token, authorization denied' });
        }

        const user = await User.findById(req.user.id);
        
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        if (user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access Denied: Admin only' });
        }

        next();
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
