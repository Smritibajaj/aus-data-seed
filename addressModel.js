const mongoose = require('mongoose');

// Define a Mongoose schema for the address data
const addressSchema = new mongoose.Schema({
    entityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Entity' }, // Reference to the entity
    State: String,
    Postcode: String
    // Add more fields as needed
});

// Create a Mongoose model for the address data
const AddressModel = mongoose.model('Address', addressSchema);

module.exports = AddressModel;