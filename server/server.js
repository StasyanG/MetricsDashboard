'use strict';

var CONFIG = process.env.NODE_ENV == 'prod' ? require('./config/prod') : require('./config/dev');
var MONGO_CONN_STRING = process.env.MONGO_CONN_STRING || CONFIG.MONGO_CONNECTION_STRING;

var path = require('path')
	, express = require('express')
	, mongoose = require('mongoose');

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

	app.listen(CONFIG.PORT, CONFIG.HOST, function() {
		console.log(`Running on http://${CONFIG.HOST}:${CONFIG.PORT}`);
	});

	require('./routes/routes')(app);

	app.set('views', path.join(__dirname, 'views'));
	app.set('view engine', 'pug');
}