const mongoose = require('mongoose');

// Define the schema for the attendance list
const attendanceSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true, // Name is required
        trim: true // Removes extra spaces
    },
    checkin: {
        type: String, // Check-in time as a string (e.g., "08:00 AM")
        required: true // Check-in is required
    },
    checkout: {
        type: String, // Check-out time as a string (e.g., "05:00 PM")
        default: 'N/A' // Default value if checkout is not provided
    },
    date: {
        type: String,
        required: true, // Date is required
    }
});

// Create the model
const Attendance = mongoose.model('Attendance', attendanceSchema);

module.exports = Attendance;