var http = require('http');
var app = require('./app')
const server = http.createServer(app)
console.log('listening on port 8023')
server.listen(8023);
server.timeout = 60*60*1000; // for 30 minutes

