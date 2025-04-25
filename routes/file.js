const express = require('express')
const multer = require('multer')
const fs = require('fs')
const path = require('path')
const csv = require('csv-parser')
const Employee = require('../model/employeeListModel'); // Import the Employee model
const Attendance = require('../model/attendanceModel');

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

// GET route to read all rows from the employeeList collection in MongoDB
router.get('/classlist', async (req, res) => {
    try {
        const employees = await Employee.find(); // Fetch all employee records from MongoDB
        res.status(200).json(employees); // Send the records as a JSON response
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch employee list', details: err.message });
    }
});



// PUT route to add a new name to the employeeList collection in MongoDB
router.put('/classlist', async (req, res) => {
    const { name } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'Name is required' });
    }

    try {
        // Check if the name already exists in the collection
        const existingEmployee = await Employee.findOne({ name });
        if (existingEmployee) {
            return res.status(400).json({ error: 'Name already exists in the employee list' });
        }

        // Add the new name to the collection
        const newEmployee = new Employee({ name });
        await newEmployee.save();

        res.status(201).json({ message: 'Name added successfully', employee: newEmployee });
    } catch (err) {
        res.status(500).json({ error: 'Failed to add name to the employee list', details: err.message });
    }
});


// DELETE route to remove a name from the employeeList collection in MongoDB
router.delete('/classlist', async (req, res) => {
    const { name } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'Name is required' });
    }

    try {
        // Find and delete the employee by name
        const deletedEmployee = await Employee.findOneAndDelete({ name });

        if (!deletedEmployee) {
            return res.status(404).json({ error: 'Employee not found in the employee list' });
        }

        res.status(200).json({ message: 'Employee deleted successfully', employee: deletedEmployee });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete employee from the employee list', details: err.message });
    }
});



// PATCH route to update an employee's name in the employeeList collection in MongoDB
router.patch('/classlist', async (req, res) => {
    const { oldName, newName } = req.body;

    if (!oldName || !newName) {
        return res.status(400).json({ error: 'Both oldName and newName are required' });
    }

    try {
        // Find the employee by oldName and update the name to newName
        const updatedEmployee = await Employee.findOneAndUpdate(
            { name: oldName }, // Find the employee by oldName
            { name: newName }, // Update the name to newName
            { new: true } // Return the updated document
        );

        if (!updatedEmployee) {
            return res.status(404).json({ error: 'Employee not found in the employee list' });
        }

        res.status(200).json({ message: 'Employee name updated successfully', employee: updatedEmployee });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update employee name', details: err.message });
    }
});





// GET route to fetch all attendance data for a specific date from MongoDB
router.get('/v1/:date', async (req, res) => {
    const { date } = req.params; // Get the date from query parameters

    if (!date) {
        return res.status(400).json({ error: 'Date is required in the format YYYY-MM-DD' });
    }

    try {
        // Fetch attendance records for the specified date
        const attendanceRecords = await Attendance.find({ date });

        if (attendanceRecords.length === 0) {
            return res.status(404).json({ error: 'No attendance records found for the specified date' });
        }

        res.status(200).json(attendanceRecords); // Send the records as a JSON response
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch attendance records', details: err.message });
    }
});



// GET route to fetch today's attendance records from MongoDB
router.get('/v2/today', async (req, res) => {
    const date = new Date();
    const formattedDate = date.toISOString().split('T')[0]; // Format: YYYY-MM-DD

    try {
        // Fetch attendance records for today's date
        const attendanceRecords = await Attendance.find({ date: formattedDate });

        if (attendanceRecords.length === 0) {
            return res.status(404).json({ error: 'No attendance records found for today' });
        }

        res.status(200).json(attendanceRecords); // Send the records as a JSON response
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch attendance records', details: err.message });
    }
});



// POST route to add a new attendance record to the attendance collection in MongoDB
router.post('/v1', async (req, res) => {
    const date = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
    const { studentname, option } = req.body;

    if (!studentname || !option) {
        return res.status(400).json({ error: 'Both studentname and option (checkin/checkout) are required' });
    }

    try {
        // Determine check-in or check-out time based on the option
        const currentTime = new Date().toLocaleTimeString('en-US', { hour12: true }); // Format time in AM/PM
        const checkin = option === 'checkin' ? currentTime : 'N/A';
        const checkout = option === 'checkout' ? currentTime : 'N/A';

        // Create a new attendance record
        const newAttendance = new Attendance({
            name: studentname,
            checkin,
            checkout,
            date
        });

        // Save the record to the database
        await newAttendance.save();

        res.status(201).json({ message: 'Attendance record added successfully', attendance: newAttendance });
    } catch (err) {
        res.status(500).json({ error: 'Failed to add attendance record', details: err.message });
    }
});




// PUT route to update the check-in time of a record by student name in the attendance collection
router.put('/v1/checkin', async (req, res) => {
    const date = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
    const { studentname } = req.body;

    if (!studentname) {
        return res.status(400).json({ error: 'Student name is required' });
    }

    try {
        // Get the current time in AM/PM format
        const checkin = new Date().toLocaleTimeString('en-US', { hour12: true });

        // Find the attendance record for the student on today's date and update the check-in time
        const updatedAttendance = await Attendance.findOneAndUpdate(
            { name: studentname, date }, // Find by student name and today's date
            { checkin }, // Update the check-in time
            { new: true } // Return the updated document
        );

        if (!updatedAttendance) {
            return res.status(404).json({ error: 'Attendance record not found for the specified student and date' });
        }

        res.status(200).json({ message: 'Check-in time updated successfully', attendance: updatedAttendance });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update check-in time', details: err.message });
    }
});




// PUT route to update the checkout time of a record by student name in the attendance collection
router.put('/v1/checkout', async (req, res) => {
    const date = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
    const { studentname } = req.body;

    if (!studentname) {
        return res.status(400).json({ error: 'Student name is required' });
    }

    try {
        // Get the current time in AM/PM format
        const checkout = new Date().toLocaleTimeString('en-US', { hour12: true });

        // Find the attendance record for the student on today's date and update the checkout time
        const updatedAttendance = await Attendance.findOneAndUpdate(
            { name: studentname, date }, // Find by student name and today's date
            { checkout }, // Update the checkout time
            { new: true } // Return the updated document
        );

        if (!updatedAttendance) {
            return res.status(404).json({ error: 'Attendance record not found for the specified student and date' });
        }

        res.status(200).json({ message: 'Checkout time updated successfully', attendance: updatedAttendance });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update checkout time', details: err.message });
    }
});

module.exports = router