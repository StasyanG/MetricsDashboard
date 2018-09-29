const mongoose = require('mongoose')

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

module.exports = mongoose;