// Thanks to
// https://habr.com/company/ruvds/blog/340750/

const mongoose = require('mongoose')
      , jwt = require('jsonwebtoken')
      , CONFIG = process.env.NODE_ENV == 'prod' ? require('../config/prod') : require('../config/dev');

const auth = {};

auth.login = (User) => (req, res) => {
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
  if (split.length === 2) return split[1];
    else return null;
  } else return null;
}

auth.signup = (User) => (req, res) => {
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
      res.json({ success: true, message: 'Account created successfully' });
    })
  }
}

// TODO: REMOVE AFTER DEVELOPMENT AND TESTING OF AUTHORIZATION
// Create admin account
auth.setup = (User) =>  (req, res) => {
  const admin = new User({
    username: 'admin',
    password: 'admin',
    role: 'admin'
  });
  admin.save(error => {
    if (error) throw error;
    console.log('Admin account was succesfully set up');
    res.json({ success: true });
  });
}
// List all users & test token authorization
auth.listUsers = (User, Token) => (req, res) => {
  const token = Token;
  if (token) {
    User.find({}, (error, users) => {
      if (error) throw error;
      res.status(200).json(users);
    });
  } 
  else {
    return res.status(403).send({ success: false, message: 'Unauthorized' });
  }
}
// /TODO

module.exports = auth;