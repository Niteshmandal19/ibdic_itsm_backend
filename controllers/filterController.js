// controllers/filterController.js
const {FilterChild, FilterParent} = require('../models');
const sequelize = require('../config/database');
const { Op } = require('sequelize');

const filterController = {
  // Get all filter parents with their children
  async getAllFilters(req, res) {
    try {
      const filters = await FilterParent.findAll({
        include: [
          {
            model: FilterChild,
            as: 'children',
            required: false // Allows parents without children to be fetched
          }
        ],
        where: { is_active: true },
        logging: console.log // Debugging: Log SQL query in console
      });
  
      if (filters.length === 0) {
        return res.status(404).json({ message: 'No filters found' });
      }
  
      res.json(filters);
    } catch (error) {
      console.error('Error fetching filters:', error);
      res.status(500).json({ error: error.message });
    }
  },
  
  // Create new filter parent
  async createFilterParent(req, res) {
    try {
      const { filter_name, description } = req.body;
      const newFilter = await FilterParent.create({
        filter_name,
        description
      });
      res.status(201).json(newFilter);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Create new filter child
  async createFilterChild(req, res) {
    try {
      const { filter_child_name, filter_parent_id, value } = req.body;
      const newChild = await FilterChild.create({
        filter_child_name,
        filter_parent_id,
        value
      });
      res.status(201).json(newChild);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Update filter parent
  async updateFilterParent(req, res) {
    try {
      const { id } = req.params;
      const { filter_name, description, is_active } = req.body;
      const updated = await FilterParent.update(
        { filter_name, description, is_active },
        { where: { filter_parent_id: id } }
      );
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Update filter child
  async updateFilterChild(req, res) {
    try {
      const { id } = req.params;
      const { filter_child_name, value, is_active } = req.body;
      const updated = await FilterChild.update(
        { filter_child_name, value, is_active },
        { where: { filter_child_id: id } }
      );
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = filterController;