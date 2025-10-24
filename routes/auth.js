import bcrypt from 'bcryptjs';
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import User from '../model/users.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '7d';

// Register a new user
router.post('/register', async (req, res) => {
    try {
        const { email, password, role, nom, classe } = req.body;
        if (!email || !password) {
            return res
                .status(400)
                .json({ message: 'Email et mot de passe requis' });
        }

        const existing = await User.findOne({ email });
        if (existing)
            return res
                .status(409)
                .json({ message: 'Utilisateur déjà existant' });

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const user = new User({
            email,
            passwordHash,
            role: role || 'utilisateur',
            nom,
            classe,
        });
        await user.save();

        res.status(201).json({ message: 'Utilisateur créé' });
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

// Login -> returns JWT
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password)
            return res
                .status(400)
                .json({ message: 'Email et mot de passe requis' });

        const user = await User.findOne({ email });
        if (!user)
            return res.status(401).json({ message: 'Identifiants invalides' });

        const match = await bcrypt.compare(password, user.passwordHash);
        if (!match)
            return res.status(401).json({ message: 'Identifiants invalides' });

        const payload = {
            id: user._id.toString(),
            email: user.email,
            role: user.role,
            nom: user.nom,
            classe: user.classe,
        };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });

        res.json({ token, user: payload });
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

// Whoami
router.get('/me', async (req, res) => {
    try {
        const authHeader =
            req.headers['authorization'] || req.headers['Authorization'];
        const token =
            authHeader && authHeader.split(' ')[0] === 'Bearer'
                ? authHeader.split(' ')[1]
                : null;
        if (!token) return res.status(401).json({ message: 'Token manquant' });
        try {
            const payload = jwt.verify(token, JWT_SECRET);
            const user = await User.findById(payload.id).select(
                '-passwordHash'
            );
            if (!user)
                return res
                    .status(404)
                    .json({ message: 'Utilisateur non trouvé' });
            res.json(user);
        } catch (err) {
            return res
                .status(401)
                .json({ message: 'Token invalide', error: err.message });
        }
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

export default router;

// --- Admin: manage users ---
// GET list of users (admin only)
router.get(
    '/users',
    authenticateToken,
    requireRole('admin'),
    async (req, res) => {
        try {
            const users = await User.find().select('-passwordHash');
            res.json(users);
        } catch (err) {
            res.status(500).json({
                message: 'Erreur serveur',
                error: err.message,
            });
        }
    }
);

// Seed admin (protected by SEED_SECRET env). Use only once to create initial admin.
router.post('/seed-admin', async (req, res) => {
    const seedSecret = process.env.SEED_SECRET || null;
    const provided = req.body && (req.body.secret || req.query.secret);
    if (!seedSecret || !provided || provided !== seedSecret) {
        return res.status(403).json({ message: 'Accès refusé' });
    }

    try {
        // If an admin already exists, return it
        const existing = await User.findOne({ role: 'admin' }).select(
            '-passwordHash'
        );
        if (existing) {
            return res
                .status(200)
                .json({ message: 'Admin déjà présent', user: existing });
        }

        const { email, password, nom } = req.body;
        if (!email || !password)
            return res
                .status(400)
                .json({ message: 'email et password requis pour le seed' });

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const admin = new User({
            email,
            passwordHash,
            role: 'admin',
            nom,
        });
        await admin.save();
        return res.status(201).json({
            message: 'Admin créé',
            user: {
                id: admin._id,
                email: admin.email,
                role: admin.role,
                nom: admin.nom,
            },
        });
    } catch (err) {
        return res
            .status(500)
            .json({ message: 'Erreur serveur', error: err.message });
    }
});
// Update a user's role/info (admin only)
router.put(
    '/users/:id',
    authenticateToken,
    requireRole('admin'),
    async (req, res) => {
        try {
            const updates = { ...req.body };
            // Do not allow passwordHash updates here
            delete updates.passwordHash;
            const result = await User.findByIdAndUpdate(
                req.params.id,
                updates,
                { new: true }
            ).select('-passwordHash');
            if (!result)
                return res
                    .status(404)
                    .json({ message: 'Utilisateur non trouvé' });
            res.json(result);
        } catch (err) {
            res.status(400).json({
                message: 'Erreur lors de la modification',
                error: err.message,
            });
        }
    }
);

// Delete user (admin only)
router.delete(
    '/users/:id',
    authenticateToken,
    requireRole('admin'),
    async (req, res) => {
        try {
            const result = await User.findByIdAndDelete(req.params.id);
            if (!result)
                return res
                    .status(404)
                    .json({ message: 'Utilisateur non trouvé' });
            res.json({ message: 'Utilisateur supprimé' });
        } catch (err) {
            res.status(500).json({
                message: 'Erreur serveur',
                error: err.message,
            });
        }
    }
);
