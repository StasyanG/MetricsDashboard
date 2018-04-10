const passport = require('passport');  
const Strategy = require('passport-local');
const jwt = require('jsonwebtoken');

const helpers = require('./helpers');

function storeToken(token, expiresInMinutes) {
  
}

function removeToken(token) {

}

module.exports = {
  login: function(req, res, next) {
    helpers.logger('auth.login', req.body.login + ' ' + req.body.password);
    helpers.logger('auth.login', 'Authenticated');
    res.send({
      token: 'THw1jjRm39X2ZGkiw2BcHLg1CLIGJCmCB4vBBdz8',
      user: {
        login: 'admin',
        email: 'admin@example.com',
        name: 'Джон Коннор',
        role: 'admin'
      }
    });
  },
  logout: function(token) {
    removeToken(token);
  },
  getToken: function(user) {
    const expiresInMinutes = 120;
    var token = jwt.sign({name: user.name}, app.get('superSecret'), {expiresInMinutes: expiresInMinutes});
    return token;
  },
  checkToken: function(req, res, next) {

  }
}