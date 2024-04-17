const mongoose = require('mongoose');
const addressSchema = new mongoose.Schema({
    entityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Entity' }, // Reference to the entity
    State: String,
    Postcode: String
    // Add more fields as needed
});

const gstSchema = new mongoose.Schema({
    entityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Entity' }, // Reference to the entity
    status: String,
    GSTStatusFromDate: Date,
});


const entitySchema = new mongoose.Schema({
    ABN: { type: String, required: true },
    ABNStatus: String,
    ABNStatusFromDate: Date,
    EntityTypeInd: String,
    EntityTypeText: String,
    NonIndividualNameText: { type: mongoose.Schema.Types.Mixed, required: false }, // Making NonIndividualNameText optional
    GivenName: String,
    FamilyName: String,
    // Other fields specific to entities
    BusinessAddress: { type: addressSchema, required: false },
    // Reference to GST schema
    GST: [gstSchema],
});
const EntityModel = mongoose.model('Entity', entitySchema);
module.exports = EntityModel;
