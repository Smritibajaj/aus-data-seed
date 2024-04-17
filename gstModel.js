const mongoose = require('mongoose');

// Define a Mongoose schema for GST statuses
const gstStatusSchema = new mongoose.Schema({
    entityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Entity' }, // Reference to the entity
    status: String,
    GSTStatusFromDate: Date,
});

// Create a Mongoose model for GST statuses
const GSTStatusModel = mongoose.model('GSTStatus', gstStatusSchema);

module.exports = GSTStatusModel;
