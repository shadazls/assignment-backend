import { Router } from 'express';
import Assignment from '../model/assignments.js';

const router = Router();

// Route pour la liste (GET all) et l'ajout (POST)
router
    .route('/')
    .get(async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const aggregateQuery = Assignment.aggregate();

            Assignment.aggregatePaginate(
                aggregateQuery,
                { page, limit },
                (err, result) => {
                    if (err) {
                        return res.status(500).json({
                            message: 'Erreur serveur',
                            error: err.message,
                        });
                    }
                    res.json(result); // result contient docs, totalDocs, totalPages, etc.
                }
            );
        } catch (err) {
            res.status(500).json({
                message: 'Erreur serveur',
                error: err.message,
            });
        }
    })
    .post(async (req, res) => {
        try {
            const { id, nom, dateDeRendu, rendu } = req.body;
            const a = new Assignment({ id, nom, dateDeRendu, rendu });
            await a.save();
            res.status(201).json({ message: 'Assignment ajouté !' });
        } catch (err) {
            res.status(400).json({
                message: "Erreur lors de l'ajout",
                error: err.message,
            });
        }
    });

router.get('/stats', async (req, res) => {
    try {
        const all = await Assignment.find();
        const now = new Date();

        const overdue = all.filter(
            (a) => !a.rendu && new Date(a.dateDeRendu) < now
        ).length;
        const pending = all.filter(
            (a) => !a.rendu && new Date(a.dateDeRendu) >= now
        ).length;
        const completed = all.filter((a) => a.rendu).length;

        res.json({
            overdue,
            pending,
            completed,
            total: all.length,
        });
    } catch (err) {
        res.status(500).json({
            message: 'Erreur serveur',
            error: err.message,
        });
    }
});

// Route pour une ressource spécifique (GET one, PUT, DELETE)
router
    .route('/:id')
    .get(async (req, res) => {
        try {
            const doc = await Assignment.findOne({ id: req.params.id });
            if (!doc)
                return res
                    .status(404)
                    .json({ message: 'Assignment non trouvé' });
            res.json(doc);
        } catch (err) {
            res.status(500).json({
                message: 'Erreur serveur',
                error: err.message,
            });
        }
    })
    .put(async (req, res) => {
        try {
            const result = await Assignment.updateOne(
                { id: req.params.id },
                req.body
            );
            if (result.n === 0)
                return res
                    .status(404)
                    .json({ message: 'Assignment non trouvé à modifier' });
            res.json({ message: 'Assignment modifié !' });
        } catch (err) {
            res.status(400).json({
                message: 'Erreur lors de la modification',
                error: err.message,
            });
        }
    })
    .delete(async (req, res) => {
        try {
            const result = await Assignment.deleteOne({ id: req.params.id });
            if (result.deletedCount === 0)
                return res
                    .status(404)
                    .json({ message: 'Assignment non trouvé à supprimer' });
            res.json({ message: 'Assignment supprimé !' });
        } catch (err) {
            res.status(500).json({
                message: 'Erreur lors de la suppression',
                error: err.message,
            });
        }
    });

export default router;
