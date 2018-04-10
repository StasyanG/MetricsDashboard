var login = require('./login');
var signup = require('./signup');
var UserModel = require('../../models/user').UserModel;

module.exports = function(passport){

	// Passport needs to be able to serialize and deserialize users to support persistent login sessions
    passport.serializeUser(function(user, done) {
        console.log('serialize ' + user.userId);
        done(null, user.userId);
    });

    passport.deserializeUser(function(id, done) {
        console.log('deserialize');
        UserModel.findById(id, function(err, user) {
            done(err, user);
        });
    });

    // Setting up Passport Strategies for Login and SignUp/Registration
    login(passport);
    signup(passport);
}