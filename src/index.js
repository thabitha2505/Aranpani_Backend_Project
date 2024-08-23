const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const stripe = require('./config/stripe');
const stripeWebhook = require('./controllers/webhooks');

const {errorHandler} = require ('./middleware/errorHandler');
const donorRoutes = require('./routes/donorRoutes');
const projectRoutes = require('./routes/projectRoutes');
const areaRepRoutes = require('./routes/areaRepRoutes');
const profileRoutes = require('./routes/profileRoutes')
const adminRoutes = require('./routes/adminRoutes');
const superAdminRoutes = require('./routes/superAdminRoutes');

const bodyParser = require('body-parser');
const path = require('path');
dotenv.config({path:'.env'});

const app = express();

//middlware
app.use(cors());
app.use(express.json());  

app.use('/api/donors',donorRoutes);
app.use('/api/projects',projectRoutes);
app.use('/api/areaReps',areaRepRoutes);
app.use('/api/user_profile',profileRoutes);
app.use('/api/adminRoutes',adminRoutes);
app.use('/api/superAdminRoutes',superAdminRoutes);


//profile-picture 
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

//middleware
app.use('/uploads', express.static(path.join(__dirname, './uploads')));

app.use(errorHandler);

//webhooks route
app.use('/api/stripe', stripeWebhook); 


console.log("server is starting");

module.exports = {app,stripe};