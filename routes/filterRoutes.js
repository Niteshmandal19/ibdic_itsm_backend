// routes/filterRoutes.js
const express = require('express');
const router = express.Router();
const filterController = require('../controllers/filterController');

// Get all filters
router.get('/', filterController.getAllFilters);

// Create new filter parent
router.post('/parent', filterController.createFilterParent);

// Create new filter child
router.post('/child', filterController.createFilterChild);

// Update filter parent
router.put('/:id', filterController.updateFilterParent);

// Update filter child
router.put('/child/:id', filterController.updateFilterChild);



module.exports = router;