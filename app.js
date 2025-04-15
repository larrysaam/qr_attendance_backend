const express = require('express')
const AttenndanceRoute = require('./routes/file')
const bodyParser = require('body-parser')
const cors = require('cors')
require('dotenv').config()



const app = express()


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