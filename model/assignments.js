import mongoose from 'mongoose';
import aggregatePaginate from 'mongoose-aggregate-paginate-v2';

// let aggregatePaginate = require('mongoose-aggregate-paginate-v2');

const assignmentSchema = new mongoose.Schema({
    id: Number,
    nom: String,
    dateDeRendu: Date,
    rendu: Boolean,
});

assignmentSchema.plugin(aggregatePaginate);

const Assignment = mongoose.model('Assignment', assignmentSchema);

export default Assignment;
