//data source connection coding all comes here
const dataSource = require('./dataSource')
const { app } = require('./index');
require('reflect-metadata');
require('dotenv').config({ path: '.env' });


const port = process.env.PORT || 3000;


dataSource.initialize()
    .then(() => {
        console.log('Database connected');
        app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });
    })
    .catch((error) => {
        console.error('Error connecting to the database:', error);
    });
