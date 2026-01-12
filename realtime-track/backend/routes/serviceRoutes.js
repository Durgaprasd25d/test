const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const Service = require('../models/Service');

// Get all categories with their services
router.get('/categories', async (req, res) => {
    try {
        const categories = await Category.find().sort({ order: 1 });
        res.json({ success: true, data: categories });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get services for a specific category slug
router.get('/category/:slug', async (req, res) => {
    try {
        const category = await Category.findOne({ slug: req.params.slug });
        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }
        const services = await Service.find({ category: category._id });
        res.json({ success: true, data: { category, services } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get all services
router.get('/all', async (req, res) => {
    try {
        const services = await Service.find().populate('category');
        res.json({ success: true, data: services });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
