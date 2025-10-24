import cors from 'cors';
import express from 'express';
import { connect } from 'mongoose';
import assignmentsRoutes from './routes/assignments.js';
import authRoutes from './routes/auth.js';

const app = express();
const port = 8010;

// Mets l'URI fourni ici
const uri =
    'mongodb+srv://sazuelos:Lebut2024!@cluster0.v36njv2.mongodb.net/assignmentsDB?retryWrites=true&w=majority&appName=Cluster0';

app.use(express.json());
app.use(cors());
app.use('/api/assignments', assignmentsRoutes);
app.use('/api/auth', authRoutes);

connect(uri)
    .then(() => {
        app.listen(port, () => {
            console.log('Server started on http://localhost:' + port);
            console.log('API assignments disponible sur /api/assignments');
        });
    })
    .catch((err) => {
        console.error('Could not connect to MongoDB:', err);
    });
