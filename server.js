const http = require('http')
const app = require('./app')

const Server = http.createServer(app)

const port = 5000

Server.listen(port, ()=> console.log(`server running on port ${port}`))