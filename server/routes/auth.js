// Thanks to
// https://habr.com/company/ruvds/blog/340750/

const jwt = require('jsonwebtoken')
const request = require('request')
const CONFIG = process.env.NODE_ENV == 'prod' ? require('../config/prod') : require('../config/dev')
const User = require('../models/user')
const dbAccounts = require('../db/accounts')

const auth = {};

auth.login = (req, res) => {
  User.findOne({ username: req.body.username }, (error, user) => {
    if (error) throw error;
    if (!user) res.status(401).send({ success: false, message: 'Authentication failed. User not found.' });
    else {
      user.comparePassword(req.body.password, (error, matches) => {
        if (matches && !error) {
          const token = jwt.sign({ user }, CONFIG.SECRET);
          res.json({ success: true, message: 'Token granted', token });
        } else {
          res.status(401).send({ success: false, message: 'Authentication failed. Wrong password.' });
        }
      });
    }
  });
}

auth.verify = (headers) => {
  if (headers && headers.authorization) {
    const split = headers.authorization.split(' ');
    if (split.length === 2) {
      const token = split[1];
      jwt.verify(token, CONFIG.SECRET, function(err, decoded) {
        if (!err) return decoded;
        else return null;
      });
    } else return null;
  } else return null;
}

auth.signup = (req, res) => {
  if (!req.body.username || !req.body.password) {
    res.json({ success: false, message: 'Please, pass a username and password.' });
  } else {
    const newUser = new User({
      username: req.body.username,
      password: req.body.password,
      role: 'viewer'
    });
    newUser.save((error) => {
      if (error) return res.status(400).json({ success: false, message:  'Username already exists.' });
      const token = jwt.sign({ user: newUser }, CONFIG.SECRET);
      res.json({ success: true, message: 'Account created successfully', token });
    })
  }
}

auth.logout = function(req, res) {
  req.logout();
  res.json({ success: true, message: 'Logged out successfully' });
}

// TODO: REMOVE AFTER DEVELOPMENT AND TESTING OF AUTHORIZATION
function genRandomString(len) {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < len; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}
// Create admin account
auth.setup = (req, res) => {

  User.findOne({}, (error, user) => {
    if (error) throw error;

    if (!user) {
      const password = genRandomString(10);
      const admin = new User({
        username: 'admin',
        password: password,
        role: 'admin'
      });
      admin.save(error => {
        if (error) throw error;
        console.log('Admin account was succesfully set up');
        res.json({ success: true, password: password });
      });
    }
    else {
      console.log('Setup has been done before');
      res.json({ success: true });
    }
  });

}

auth.yandex_oauthRequest = (req, res) => {
  const uri = `https://oauth.yandex.ru/authorize?response_type=code&client_id=${CONFIG.YANDEX_APPID}`;
  res.redirect(uri);
}

auth.yandex_autorize = (req, res, next) => {
  if(!req.body.code || !req.body.accountId) {
    return res.json({ success: false, message: 'Provide code and accountId' });
  }

  const uri = `https://oauth.yandex.ru/token`;
  const data = {
    grant_type: 'authorization_code',
    code: req.body.code,
    client_id: CONFIG.YANDEX_APPID,
    client_secret: CONFIG.YANDEX_SECRET
  }

  request.post(uri, {form: data}, (err, _, body) => {
    const data = JSON.parse(body);
    if (err || data.error) {
      return next(err || new Error(data.error_description));
    }
    dbAccounts.updateAccount(req.body.accountId, {
      oauthAccessToken: data.access_token,
      oauthRefreshToken: data.refresh_token
    })
      .then(updatedAccount => {
        res.send({
          status: 'OK',
          data: {
            message: 'Account authenticated',
            account: updatedAccount
          }
        });
      })
      .catch(err => next(err));
  });
}

module.exports = auth;