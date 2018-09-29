'use strict';

const CONFIG = process.env.NODE_ENV == 'prod' ? require('./config/prod') : require('./config/dev');
const MONGO_CONN_STRING = process.env.MONGO_CONN_STRING || CONFIG.MONGO_CONNECTION_STRING;

const path = require('path')
const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')

const passport = require('passport')
const passportConfig = require('./libs/passport')(passport)

const db = require('./db');

db.connect(CONFIG.MONGO_CONNECTION_STRING, {
	autoReconnect: true,
	reconnectInterval: 1000,
	reconnectTries: 5,
	keepAlive: 120
})
.then(function() {
	startServer();
})
.catch(function(err) {
	console.log('Error occured! ' + err);
});

function startServer() {
	const app = express();

	app.set('views', path.join(__dirname, 'views'));
	app.set('view engine', 'pug');

  app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({ extended: false }));
	app.use(cors());

	app.set('jwt_secret', CONFIG.SECRET);

	const routes = require('./routes')(passport);
	app.use('/', routes);

	app.use(function(error, req, res, next) {
		console.error(error);
		return res.status(500).send({
			status: 'ERROR',
			msg: error.message
		})
	})

	app.listen(CONFIG.PORT, CONFIG.HOST, function() {
		console.log(`Running on http://${CONFIG.HOST}:${CONFIG.PORT}`);
	});
}