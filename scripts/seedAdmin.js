#!/usr/bin/env node
import bcrypt from 'bcryptjs';
import { connect } from 'mongoose';
import User from '../model/users.js';

// Configure via env or defaults
const MONGODB_URI =
    process.env.MONGODB_URI ||
    'mongodb+srv://sazuelos:Lebut2024!@cluster0.v36njv2.mongodb.net/assignmentsDB?retryWrites=true&w=majority&appName=Cluster0';
const email = process.env.SEED_EMAIL || 'admin@example.com';
const password = process.env.SEED_PASSWORD || 'admin123';
const nom = process.env.SEED_NOM || 'Admin Seed';

async function run() {
    try {
        await connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const existing = await User.findOne({ role: 'admin' });
        if (existing) {
            console.log('Admin already exists:', existing.email);
            process.exit(0);
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const admin = new User({ email, passwordHash, role: 'admin', nom });
        await admin.save();
        console.log('Admin user created:', admin.email);
        process.exit(0);
    } catch (err) {
        console.error('Error seeding admin:', err);
        process.exit(1);
    }
}

run();
