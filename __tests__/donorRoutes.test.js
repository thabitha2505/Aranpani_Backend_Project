const request = require('supertest');  // send requests
const { app } = require('../src/index');  // handles requests and gives responses
const dataSource = require('../src/dataSource');
const User = require('../src/entities/Donor');
const Project = require('../src/entities/Project');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const axios = require('axios');


// mock dataSource
jest.mock('../src/dataSource');
jest.mock('../src/entities/Project');
jest.mock('bcryptjs'); // Mock bcrypt
jest.mock('jsonwebtoken'); // Mock jwt
jest.mock('axios');

beforeAll(async () => {
    await dataSource.initialize();
});

afterAll(async () => {
    await dataSource.destroy();
    jest.restoreAllMocks();

});

//describe -- /api/donors/projects
describe('GET /api/donors/projects', () => {
    it('should get all projects from the database', async() => {
        const mockProjects = [
            { id: 2, temple_name: "Arul Valla Nathar Temple" },
            { id: 3, temple_name: "Sri Kaal Bhairav Temple" },
            {id:4},{id:5},{id:6},{id:7},{id:8}
        ];

        dataSource.getRepository.mockReturnValue({
            find: jest.fn().mockResolvedValue(mockProjects),
        });

        const response = await request(app).get('/api/donors/projects');

        expect(response.statusCode).toBe(200);
        expect(response.body).toBeInstanceOf(Array);
        expect(response.body.length).toBeGreaterThan(0);
        expect(response.body).toEqual(mockProjects);
    });
});

//describe --  /api/donors/projects/:id
describe('GET /api/donors/projects/:id', () => {
    it('should get a project by ID', async() => {
        const mockProject = { id: 2, temple_name: "Arul Valla Nathar Temple" };

        dataSource.getRepository.mockReturnValue({
            findOne: jest.fn().mockResolvedValue(mockProject),
        });

        const response = await request(app).get('/api/donors/projects/2');

        expect(response.statusCode).toBe(200);
        expect(response.body).toMatchObject(mockProject);
    });

    it('should return 404 for non-existent project', async () => {
        dataSource.getRepository.mockReturnValue({
            findOne: jest.fn().mockResolvedValue(null),
        });

        const response = await request(app).get('/api/donors/projects/999'); //999 is not a valid ID

        expect(response.statusCode).toBe(404);
        expect(response.body).toHaveProperty('message', 'Project not found');
    });
});

//describe -- router.route('/projects/active').post(loginDonor).get(viewActiveProject);
describe('Donor Routes',()=>{
    //describe -- login donor
    describe('POST /api/donors/projects/active',()=>{
        it('should login a donor and return active projects',async()=>{
            
            const mockUser = {
                id:23,
                mobile_no: "9701275630",
                password: "$2a$10$4knf/19amP1XdvboJ/VTl.tbG/uMccSdT1guoGAEUohSUzl9/BJ82",
                role:"donor"
            };

            const mockProjects = [
                { id: 2, temple_name: "Arul Valla Nathar Temple" },
                { id: 3, temple_name: "Sri Kaal Bhairav Temple" }
            ];

            dataSource.getRepository.mockReturnValue({
                findOne: jest.fn().mockResolvedValue(mockUser),
                find: jest.fn().mockResolvedValue(mockProjects), 
            });

            bcrypt.compare.mockResolvedValue(true); 
            bcrypt.hash.mockResolvedValue(mockUser.password)
            jwt.sign.mockReturnValue('mocked_token'); 

            const response = await request(app)
                .post('/api/donors/projects/active')
                .send({ mobile_no: mockUser.mobile_no, password: "ajith123" });
                            
            console.log("Mock User:", mockUser);
            console.log("Response Body:", response.body);
            expect(response.statusCode).toBe(200);
            expect(response.body).toHaveProperty('message','Login successful');
            expect(response.body).toHaveProperty('projects');
            expect(response.body.projects).toBeInstanceOf(Array);
            expect(response.body.projects).toEqual(mockProjects); 
        });

        it('should return 404 if credentials are invalid', async () => {
            const invalidUser = {
              mobile_no: '000000000',
              password: 'wrongpassword',
            };
            
            dataSource.getRepository.mockReturnValue({
                findOne: jest.fn().mockResolvedValue(null),
            });

            const response = await request(app)
              .post('/api/donors/projects/active')
              .send(invalidUser);
      
            expect(response.status).toBe(404);
            expect(response.body).toBe('Invalid credentials');
          });
    });

});
        

//describe -- router.get('/verify_token', authenticateToken)
describe('GET /api/donors/verify_token',()=>{
    it('should return 200 with a valid token',async()=>{
        const mockUser ={
            id:23,
            name:'ajith'
        };
        jwt.verify.mockImplementation((token,secret,callback)=>{
            callback(null,mockUser);
        });

        const response = await request(app)
            .get('/api/donors/verify_token')
            .set('Authorization','Bearer valid_token');

        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('message', 'You have access to this protected route');
        expect(response.body).toHaveProperty('user');
        expect(response.body.user).toEqual(mockUser);
    })
    // Test for invalid token
    it('should return 403 for an invalid token', async () => {
        jwt.verify.mockImplementation((token, secret, callback) => {
            callback(new Error('Invalid token'), null);
        });

        const response = await request(app)
            .get('/api/donors/verify_token')
            .set('Authorization', 'Bearer invalid_token');

        expect(response.statusCode).toBe(403);
        expect(response.text).toBe('Forbidden');
    });

    // Test for no token
    it('should return 401 if no token is provided', async () => {
        const response = await request(app)
            .get('/api/donors/verify_token');

        expect(response.statusCode).toBe(401);
        expect(response.text).toBe('"Access denied. No token provided."');
    });
});


//profile creation -- router.route('/createProfile').post(profileCreation);
describe('POST /api/donors/createProfile', () => {
    it('should create a profile successfully', async () => {
        const mockProfile = {
            name: "Arun",
            mobile_no: "9870984566",
            donor_id: 21,
            father_name: "Kalai",
            country: "India",
            state: "TamilNadu",
            district: "Chidambaram",
            address: "1/123",
            pinCode: "629201",
            email: "arun@gmail.com"
        };

        const mockDonor = { id: 21, role: 'donor' };
        
        dataSource.getRepository.mockReturnValue({
            findOne: jest.fn().mockResolvedValue(mockDonor),
            create: jest.fn().mockReturnValue(mockProfile),
            save: jest.fn().mockResolvedValue(mockProfile),
        });

        const response = await request(app).post('/api/donors/createProfile').send(mockProfile);

        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.profile).toEqual(mockProfile);
    });

    it('should return an error if donor does not exist', async () => {
        const mockProfile = {
            name: "Arun",
            mobile_no: "9870984566",
            donor_id: 999, // Non-existent donor_id
            father_name: "Kalai",
            country: "India",
            state: "TamilNadu",
            district: "Chidambaram",
            address: "1/123",
            pinCode: "629201",
            email: "arun@gmail.com"
        };

        dataSource.getRepository.mockReturnValue({
            findOne: jest.fn().mockResolvedValue(null), // No donor found
        });

        const response = await request(app).post('/api/donors/createProfile').send(mockProfile);

        expect(response.statusCode).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Donor not found or invalid role');
    });

    it('should return an error if required fields are missing', async () => {
        const incompleteProfile = {
            mobile_no: "9870984566",
            donor_id: 21,
            country: "India",
            state: "TamilNadu",
            district: "Chidambaram",
            pinCode: "629201",
            email: "arun@gmail.com"
        }; // 'name' is missing

        const response = await request(app).post('/api/donors/createProfile').send(incompleteProfile);

        expect(response.statusCode).toBe(400);
        expect(response.body.error).toBe('name is a required field');
    });

    it('should return an error if pin code is invalid', async () => {
        const mockProfile = {
            name: "Arun",
            mobile_no: "9870984566",
            donor_id: 21,
            father_name: "Kalai",
            country: "India",
            state: "",
            district: "",
            address: "1/123",
            pinCode: "000000", // Invalid pin code
            email: "arun@gmail.com"
        };

        axios.get.mockResolvedValue({
            data: [{ Status: "Error", Message: "Invalid Pincode" }]
        });

        const response = await request(app).post('/api/donors/createProfile').send(mockProfile);

        expect(response.statusCode).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Donor not found or invalid role');
    });

    it('should handle server errors gracefully', async () => {
        const mockProfile = {
            name: "Arun",
            mobile_no: "9870984566",
            donor_id: 21,
            father_name: "Kalai",
            country: "India",
            state: "TamilNadu",
            district: "Chidambaram",
            address: "1/123",
            pinCode: "629201",
            email: "arun@gmail.com"
        };

        dataSource.getRepository.mockReturnValue({
            findOne: jest.fn().mockRejectedValue(new Error('Database error')),
        });

        const response = await request(app).post('/api/donors/createProfile').send(mockProfile);

        expect(response.statusCode).toBe(500);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Error in creating profile');
    });
});


