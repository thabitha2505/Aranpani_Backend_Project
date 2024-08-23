const request = require('supertest');
const express = require('express');
const dataSource = require('../src/dataSource');
const Project = require('../src/entities/Project');
const { getProjectsByStatus } = require('../src/services/projectService');
const { projectByStatus } = require('../src/controllers/projectController');

jest.mock('../src/dataSource');
jest.mock('../src/services/projectService');

const app = express();
app.use(express.json());
app.get('/api/projects/statuses/:status', projectByStatus);

describe('GET /api/projects/statuses/:status', () => {
    beforeAll(async () => {
        await dataSource.initialize();
    });

    afterAll(async () => {
        await dataSource.destroy();
    });

    test('should return projects by status', async () => {
        const status = 'active';
        const mockProjects = [
            { id: 1, name: 'Project 1', status: 'active' },
            { id: 2, name: 'Project 2', status: 'active' },
        ];

        // Mock the service method
        getProjectsByStatus.mockResolvedValue(mockProjects);

        const response = await request(app).get(`/api/projects/statuses/${status}`);

        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockProjects);
        expect(getProjectsByStatus).toHaveBeenCalledWith(status);
    });

    test('should handle errors when fetching projects', async () => {
        const status = 'active';

        // Mock the service method to throw an error
        getProjectsByStatus.mockRejectedValue(new Error('Error retrieving projects'));

        const response = await request(app).get(`/api/projects/statuses/${status}`);

        expect(response.status).toBe(500);
        expect(response.body).toEqual({ message: `Error retrieving ${status} projects` });
    });
});
