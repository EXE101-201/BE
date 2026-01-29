import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export async function protect(req, res, next) {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key');
            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user) {
                return res.status(401).json({ message: 'User not found' });
            }

            return next();
        } catch (error) {
            return res.status(401).json({ message: 'Không được phép, token không hợp lệ' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Không được phép, không có token' });
    }
}

export async function optionalProtect(req, res, next) {
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            const token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key');
            req.user = await User.findById(decoded.id).select('-password');
            return next();
        } catch (error) {
            return next();
        }
    }
    return next();
}

export async function admin(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ message: 'Không được phép' });
    }
    if (req.user.role === 'ADMIN') {
        return next();
    }
    return res.status(403).json({ message: 'Quyền admin yêu cầu' });
}

export async function transaction(req, res, next) {
    const auth = req.headers.authorization;
    if (!auth) {
        return res.status(403).json({ message: 'Forbidden' });
    }
    const result = auth.replace('Apikey ', '');
    if (result === process.env.TRANSACTION_SECRET) {
        return next();
    }
    return res.status(403).json({ message: 'Forbidden' });
}

