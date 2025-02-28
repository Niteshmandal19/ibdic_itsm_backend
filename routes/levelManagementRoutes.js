const express = require('express');
const router = express.Router();
const { ProductMaster, LevelsIssueType, LevelsRequestType } = require('../models');
const { Op } = require('sequelize');



// Get all projects
router.get("/products/projects", async (req, res) => {
  try {



    const whereCondition = {
          status: 1, // Only get active products
          // ...(organization_id !== 'IBDIC' && { organization_id }), // Filter by organization_id if not IBDIC
          // product_code: { [Op.in]: productCodes }, // Filter by user's productCodes
        };
    const products = await ProductMaster.findAll({
      attributes: ["product_code", "product_name"],
      where: whereCondition, // Only active products
    });
    res.status(200).json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Failed to fetch products." });
  }
});

// Get issue types for a project
router.get("/projects/:productCode/issue-types", async (req, res) => {
  const { productCode } = req.params;
  try {
    const issueTypes = await LevelsIssueType.findAll({
      where: { product_code: productCode },
      attributes: ["issue_type_id", "issue_type"],
    });
    res.status(200).json(issueTypes);
  } catch (error) {
    console.error("Error fetching issue types:", error);
    res.status(500).json({ error: "Failed to fetch issue types." });
  }
});

// Get request types for an issue type
router.get("/issue-types/:issueTypeId/request-types", async (req, res) => {
  const { issueTypeId } = req.params;
  try {
    const requestTypes = await LevelsRequestType.findAll({
      where: { issue_type_id: issueTypeId },
      attributes: ["request_type_id", "request_type"],
    });
    res.status(200).json(requestTypes);
  } catch (error) {
    console.error("Error fetching request types:", error);
    res.status(500).json({ error: "Failed to fetch request types." });
  }
});

module.exports = router;
