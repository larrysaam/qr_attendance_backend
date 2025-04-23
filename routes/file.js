const express = require('express')
const multer = require('multer')
const fs = require('fs')
const path = require('path')
const csv = require('csv-parser')

const router = express.Router()

//storing image file
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads')      //you tell where to upload the files,
    },
    filename: function (req, file, cb) {
      cb(null, file.fieldname + '-' + Date.now() + '.png')
    }
})

//image filter, accepts only jpeg and png
const fileFilter = (req, file, cb) => {
    if (file.minetype === '' || file.minetype === 'image/png' || file.minetype === 'image/jpg') {
        cb(null, true)
    } else {
        cb(null, false)
    }
}

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 5
    }
})

// GET route to read all rows from classlist.csv
router.get('/classlist', (req, res) => {
    const filePath = path.join(__dirname, '../files/classlist.csv')
    const results = []

    fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => {
            res.status(200).json(results)
        })
        .on('error', (err) => {
            res.status(500).json({ error: 'Failed to read the file', details: err.message })
        })
})


// PUT route to add a new name to classlist.csv
router.put('/classlist', (req, res) => {
    const filePath = path.join(__dirname, '../files/classlist.csv');
    const { name } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'Name is required' });
    }

    const results = [];

    // Read the file to check if the name already exists
    fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => {
            results.push(data);
        })
        .on('end', () => {
            const nameExists = results.some(entry => entry.name === name);

            if (nameExists) {
                return res.status(400).json({ error: 'Name already exists in the class list' });
            }

            // Append the new name to the file
            const newRecord = `${name}\n`;

            fs.appendFile(filePath, newRecord, (err) => {
                if (err) {
                    return res.status(500).json({ error: 'Failed to write to the file', details: err.message });
                }
                res.status(201).json({ message: 'Name added successfully' });
            });
        })
        .on('error', (err) => {
            res.status(500).json({ error: 'Failed to read the file', details: err.message });
        });
});


// DELETE route to remove a name from classlist.csv
router.delete('/classlist', (req, res) => {
    const filePath = path.join(__dirname, '../files/classlist.csv');
    const { name } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'Name is required' });
    }

    const results = [];

    fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => {
            if (data.name !== name) {
                results.push(data);
            }
        })
        .on('end', () => {
            const header = 'name\n';
            const updatedCsv = header + results.map(row => row.name).join('\n');

            fs.writeFile(filePath, updatedCsv, (err) => {
                if (err) {
                    return res.status(500).json({ error: 'Failed to update the file', details: err.message });
                }
                res.status(200).json({ message: 'User deleted successfully' });
            });
        })
        .on('error', (err) => {
            res.status(500).json({ error: 'Failed to read the file', details: err.message });
        });
});



// PUT route to update a user's name in classlist.csv
router.patch('/classlist', (req, res) => {
    const filePath = path.join(__dirname, '../files/classlist.csv');
    const { oldName, newName } = req.body;

    console.log(req.body)

    if (!oldName || !newName) {
        return res.status(400).json({ error: 'Both oldName and newName are required' });
    }

    const results = [];

    // Read the file and update the user's name
    fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => {
            if (data.name === oldName) {
                data.name = newName; // Update the name
            }
            results.push(data);
        })
        .on('end', () => {
            // Add the header row
            const header = 'name\n';

            // Convert updated data back to CSV format
            const updatedCsv = header + results.map(row => row.name).join('\n');

            // Overwrite the file with updated data
            fs.writeFile(filePath, updatedCsv, (err) => {
                if (err) {
                    return res.status(500).json({ error: 'Failed to update the file', details: err.message });
                }
                res.status(200).json({ message: 'User name updated successfully' });
            });
        })
        .on('error', (err) => {
            res.status(500).json({ error: 'Failed to read the file', details: err.message });
        });
});




// GET route to read all rows from attendance.csv
router.get('/v1', (req, res) => {
    const filePath = path.join(__dirname, '../files/attendance.csv')
    const results = []

    fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => {
            res.status(200).json(results)
        })
        .on('error', (err) => {
            res.status(500).json({ error: 'Failed to read the file', details: err.message })
        })
})


// POST route to add a new record to attendance.csv
router.post('/v1', (req, res) => {
    const filePath = path.join(__dirname, '../files/attendance.csv');
    const { studentname, option } = req.body;

    console.log(req.body)

    if (!studentname) {
        return res.status(400).json({ error: 'All fields (studentname, checkin, checkout) are required' });
    }

    // Ensure the file exists before appending
    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            // If the file does not exist, create it with a header row
            const header = 'studentname,checkin,checkout\n';
            fs.writeFile(filePath, header, (writeErr) => {
                if (writeErr) {
                    return res.status(500).json({ error: 'Failed to create the file', details: writeErr.message });
                }
                appendRecord(option);
            });
        } else {
            appendRecord(option);
        }
    });

    // Function to append the new record
    function appendRecord(option) {
        const currentTime = new Date().toLocaleTimeString(); // Get the current server time

        let checkin = option === 'checkin' ? currentTime : 'N/A'
        let checkout = option === 'checkout' ? currentTime : 'N/A'

        const newRecord = `${studentname},${checkin},${checkout}\n`;

        fs.appendFile(filePath, newRecord, (err) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to write to the file', details: err.message });
            }
            res.status(201).json({ message: 'Record added successfully' });
        });
    }
});


// PUT route to update the check-in time of a record by student name
router.put('/v1/checkin', (req, res) => {
    const filePath = path.join(__dirname, '../files/attendance.csv')
    const { studentname } = req.body

    if (!studentname) {
        return res.status(400).json({ error: 'Both studentname and newCheckin are required' })
    }

    const checkin = new Date().toLocaleTimeString(); // Get the current server time
    const results = []

    // Read the file and update the record
    fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => {
            if (data.name === studentname) {
                data.checkin = checkin // Update the check-in time
            }
            results.push(data)
        })
        .on('end', () => {
            // Add the header row
            const header = 'name,checkin,checkout\n';

            // Convert updated data back to CSV format
            const updatedCsv =
            header + results.map(row => `${row.name},${row.checkin},${row.checkout}`).join('\n');

            // Overwrite the file with updated data
            fs.writeFile(filePath, updatedCsv, (err) => {
                if (err) {
                    return res.status(500).json({ error: 'Failed to update the file', details: err.message })
                }
                res.status(200).json({ message: 'Check-in time updated successfully' })
            })
        })
        .on('error', (err) => {
            res.status(500).json({ error: 'Failed to read the file', details: err.message })
        })
})



// PUT route to update the checkout time of a record by student name
router.put('/v1/checkout', (req, res) => {
    const filePath = path.join(__dirname, '../files/attendance.csv')
    const { studentname } = req.body

    if (!studentname) {
        return res.status(400).json({ error: 'Both studentname and newCheckout are required' })
    }

    const checkout = new Date().toLocaleTimeString(); // Get the current server time
    const results = []

    // Read the file and update the record
    fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => {
            if (data.name === studentname) {
                data.checkout = checkout // Update the checkout time
            }
            results.push(data)
        })
        .on('end', () => {
            // Add the header row
            const header = 'name,checkin,checkout\n';

            // Convert updated data back to CSV format
            const updatedCsv =
            header + results.map(row => `${row.name},${row.checkin},${row.checkout}`).join('\n');
 

            // Overwrite the file with updated data
            fs.writeFile(filePath, updatedCsv, (err) => {
                if (err) {
                    return res.status(500).json({ error: 'Failed to update the file', details: err.message })
                }
                res.status(200).json({ message: 'Checkout time updated successfully' })
            })
        })
        .on('error', (err) => {
            res.status(500).json({ error: 'Failed to read the file', details: err.message })
        })
})


module.exports = router