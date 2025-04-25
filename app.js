const express = require('express')
const AttenndanceRoute = require('./routes/file')
const bodyParser = require('body-parser')
const cors = require('cors')
require('dotenv').config()
const mongoose = require('mongoose')
const app = express()

//connecting to mongodb atlas database (Cloud)
mongoose.connect('mongodb+srv://Larrien:qwerty123456@cluster0.u7xnpo6.mongodb.net/QR_attendance?retryWrites=true&w=majority')


app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: false}))
app.use('/uploads', express.static('uploads'))

//avoid cors errors
app.use(cors())


//available routes
app.use('/attendance', AttenndanceRoute)


//unreachable routes
app.use((req, res)=>{
    const error = new Error()
    error.message = 'page not found'
    res.status(500).json({error : {msg: error.message}})
})


module.exports = app