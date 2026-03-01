require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Property = require('./models/Property');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/neutech_realestate')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// --- Routes ---

// 1. Get All Properties
app.get('/api/properties', async (req, res) => {
  try {
    const properties = await Property.find().sort({ dateAdded: -1 });
    res.json(properties);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 2. Add New Property
app.post('/api/properties', async (req, res) => {
  try {
    const newProperty = new Property(req.body);
    const savedProperty = await newProperty.save();
    res.status(201).json(savedProperty);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// 3. Update Property Status (Approve/Reject)
app.patch('/api/properties/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const updatedProperty = await Property.findOneAndUpdate(
      { id: req.params.id }, 
      { status }, 
      { new: true }
    );
    if (!updatedProperty) return res.status(404).json({ message: 'Property not found' });
    res.json(updatedProperty);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 4. Delete Property
app.delete('/api/properties/:id', async (req, res) => {
  try {
    const deletedProperty = await Property.findOneAndDelete({ id: req.params.id });
    if (!deletedProperty) return res.status(404).json({ message: 'Property not found' });
    res.json({ message: 'Property deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});