import bcrypt from 'bcryptjs';
import { Router } from 'express';
import jwt from 'jsonwebtoken';
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
            role: role || 'eleve',
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
