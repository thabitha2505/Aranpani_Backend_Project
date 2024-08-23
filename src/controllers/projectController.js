const asyncHandler = require('express-async-handler');
const dataSource = require('../dataSource');
const Project = require('../entities/Project');
const {getProjectsByStatus} = require('../services/projectService');

const projectByStatus = asyncHandler(async (req, res) => {
    const { status } = req.params;
  try {
    const projectRetrieved = await getProjectsByStatus(status);
    res.status(200).json(projectRetrieved);
  } catch (error) {
    console.error(`Error fetching ${status} projects:`, error);
    res.status(500).json({ message: `Error retrieving ${status} projects` });
  }
});

 


module.exports = { projectByStatus};
