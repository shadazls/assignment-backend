import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: {
        type: String,
        enum: ['admin', 'professeur', 'eleve'],
        default: 'eleve',
    },
    nom: { type: String },
    classe: { type: String }, // optional: for eleve
    createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model('User', userSchema);
export default User;
