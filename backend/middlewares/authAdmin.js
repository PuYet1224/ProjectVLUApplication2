import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '../core/error.response.js';

const authAdmin = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new UnauthorizedError('Not Authorized. Login as Admin.');
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
        throw new UnauthorizedError('Not Authorized. Login as Admin.');
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Decoded Token (Admin):', decoded); 

        if (decoded.role !== 'admin') {
            throw new UnauthorizedError('Not Authorized as Admin. Role: ' + decoded.role);
        }
        req.admin = { email: decoded.email };
        next();
    } catch (error) {
        console.error('Admin JWT verification error:', error.message);
        throw new UnauthorizedError('Invalid token. Not Authorized as Admin.');
    }
};

export default authAdmin;
