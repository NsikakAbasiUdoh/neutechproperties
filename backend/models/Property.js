const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // We keep the frontend generated ID for consistency
  title: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  location: {
    state: { type: String, required: true },
    lga: { type: String, required: true },
    address: { type: String, required: true }
  },
  features: [{ type: String }],
  type: { type: String, required: true }, // For Sale / For Rent
  category: { type: String, required: true }, // House / Land / Commercial
  imageUrl: { type: String, required: true },
  dateAdded: { type: Number, required: true },
  contactPhone: { type: String, required: true },
  status: { type: String, default: 'Pending' } // Pending, Approved, Rejected
});

module.exports = mongoose.model('Property', propertySchema);