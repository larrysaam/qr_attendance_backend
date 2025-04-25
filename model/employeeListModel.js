const mongoose = require('mongoose');

// Define the schema for the employee list
const employeeListSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId, // Unique identifier for each document
    name: {
        type: String,
        required: true, // Name is required
        trim: true // Removes extra spaces
    }
});

// Create the model
const Employee = mongoose.model('Employee', employeeListSchema);

module.exports = Employee;