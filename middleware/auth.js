import jwt from 'jsonwebtoken';
import User from '../model/users.js';

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';

export async function authenticateToken(req, res, next) {
    const authHeader =
        req.headers['authorization'] || req.headers['Authorization'];
    const token =
        authHeader && authHeader.split(' ')[0] === 'Bearer'
            ? authHeader.split(' ')[1]
            : null;
    if (!token) return res.status(401).json({ message: 'Token manquant' });

    try {
        const payload = jwt.verify(token, JWT_SECRET);
        // attach user minimal info to request
        req.user = payload;
        // optionally fetch fresh user from DB
        try {
            const user = await User.findById(payload.id).select(
                '-passwordHash'
            );
            if (user) req.currentUser = user;
        } catch (err) {
            // ignore DB lookup error for now
        }
        next();
    } catch (err) {
        return res
            .status(401)
            .json({ message: 'Token invalide', error: err.message });
    }
}

export function requireRole(role) {
    return (req, res, next) => {
        const user = req.user || {};
        if (!user.role)
            return res
                .status(403)
                .json({ message: 'Rôle non trouvé dans le token' });
        if (user.role !== role)
            return res.status(403).json({ message: 'Accès refusé' });
        next();
    };
}
