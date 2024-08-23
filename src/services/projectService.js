const { DataSource } = require('typeorm');
const Project = require('../entities/Project');
const dataSource = require('../dataSource');


const getProjectsByStatus = async(status)=>{
    try {
        const projectRepository = dataSource.getRepository(Project);
        return await projectRepository.find({ where: { status} });
    } catch (error) {
        console.error('Error fetching projects:', error);
        throw new Error('Error retrieving projects');
    }
};


module.exports = {getProjectsByStatus};