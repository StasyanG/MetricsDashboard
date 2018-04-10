'use strict';

var CONFIG = process.env.NODE_ENV == 'prod' ? require('./config/prod') : require('./config/dev');
var MONGO_CONN_STRING = process.env.MONGO_CONN_STRING || CONFIG.MONGO_CONNECTION_STRING;

var path = require('path')
	, express = require('express')
	, cookieParser = require('cookie-parser')
	, bodyParser = require('body-parser')
	, mongoose = require('mongoose')
	, passport = require('passport')
	, expressSession = require('express-session');

mongoose.connect(CONFIG.MONGO_CONNECTION_STRING, {
	autoReconnect: true,
	reconnectInterval: 1000,
	reconnectTries: 5,
	keepAlive: 120
})
.then(function() {
	startServer();
})
.catch(function(err) {
	console.log('Could not establish MongoDB connection! ' + err);
});

mongoose.connection.on('open', function (ref) {
	console.log('Opened connection to MongoDB');
});
mongoose.connection.on('connected', function (ref) {
	console.log('Connected to MongoDB');
});

mongoose.connection.on('disconnected', function (ref) {
	console.log('Disconnected from MongoDB');
});

mongoose.connection.on('close', function (ref) {
	console.log('Closed connection to MongoDB');
});

mongoose.connection.on('error', function (err) {
	console.log('Error in connection to MongoDB!');
});

mongoose.connection.on('reconnect', function (ref) {
	console.log('Reconnect to MongoDB');
});

function startServer() {
	var app = express();

	app.set('views', path.join(__dirname, 'views'));
	app.set('view engine', 'pug');

  app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({ extended: false }));
	app.use(cookieParser());

	// For JSONWebToken
	app.set('superSecret', CONFIG.SECRET || 'superSecret');

	// Passport Initialization
	app.use(expressSession({
		secret: 'mySecretKey',
		resave: true,
		saveUninitialized: true
	}));
	app.use(passport.initialize());
	app.use(passport.session());

	// Initialize Passport
	var initPassport = require('./libs/passport/init');
	initPassport(passport);
	
	// Using the flash middleware provided by connect-flash to store messages in session
	// and displaying in templates
	var flash = require('connect-flash');
	app.use(flash());

	var routes = require('./routes/routes')(passport);
	app.use('/', routes);

	app.listen(CONFIG.PORT, CONFIG.HOST, function() {
		console.log(`Running on http://${CONFIG.HOST}:${CONFIG.PORT}`);
	});
}