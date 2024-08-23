const express = require('express');
const asyncHandler = require('express-async-handler');
const router = express.Router();
const {projectByStatus} = require('../controllers/projectController');

router.route('/statuses/:status').get(projectByStatus);
 
module.exports = router; 