
const { DataSource } = require('typeorm');
const User = require('./entities/Donor');
const Project = require('./entities/Project');
const AreaRep = require('./entities/AreaRep');
const Profile = require('./entities/Profile');
const Payment = require('./entities/Payment');

const Notification = require('./entities/Notification');

const dataSource = new DataSource({
    type: 'postgres',
    host: 'localhost',
    port: parseInt(process.env.DB_PORT, 10),
    username: 'postgres',
    password: 'password',
    database: 'test',
    entities: [User, Project, AreaRep, Profile, Payment, Notification],
    synchronize: true
});

module.exports = dataSource;