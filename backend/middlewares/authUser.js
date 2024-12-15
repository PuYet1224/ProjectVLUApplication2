import jwt from 'jsonwebtoken';

const authUser = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Not Authorized. Login Again.' });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ success: false, message: 'Not Authorized. Login Again.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Decoded Token (User):', decoded);
        req.user = { id: decoded.id };
        next();
    } catch (error) {
        console.error('JWT verification error:', error);
        return res.status(401).json({ success: false, message: 'Invalid token. Login Again.' });
    }
};

export default authUser;
