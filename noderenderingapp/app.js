var express = require('express');
var bodyParser = require('body-parser');
var timeout = require('connect-timeout');
const cookieParser = require('cookie-parser');
var engine = require('ejs-locals')
var homeweb = require('./controllers/home');

var app = express();
app.engine('ejs', engine);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(bodyParser.json({
  limit: '100mb'
}))
app.use(cookieParser())
app.use(bodyParser.urlencoded({
  limit: '100mb',
  extended: true
}));
app.use(timeout('960000s'));
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, PUT, PATCH, OPTIONS,DELETE");
  next()
});
app.use(express.static("public"));

app.get('/', (req, res) => {
  res.render('./index')
});

app.use('/home', homeweb);




module.exports = app;