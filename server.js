const http = require('http');
const app = require('./app');
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');

const Server = http.createServer(app);

const port = 5000;

Server.listen(port, () => console.log(`server running on port ${port}`));


// Schedule a cron job to run at midnight every day
cron.schedule('0 0 * * *', () => {
    const date = new Date();
    const formattedDate = date.toISOString().split('T')[0]; // Format: YYYY-MM-DD
    const filePath = path.join(__dirname, 'files', `${formattedDate}.csv`);

    // Create the .csv file
    fs.writeFile(filePath, 'name,checkin,checkout\n', (err) => {
        if (err) {
            console.error('Error creating CSV file:', err);
        } else {
            console.log(`CSV file created: ${filePath}`);
        }
    });
});