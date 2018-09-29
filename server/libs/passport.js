const PassportJWT = require('passport-jwt')
const ExtractJWT = PassportJWT.ExtractJwt
const JwtStrategy = PassportJWT.Strategy
const CONFIG = process.env.NODE_ENV == 'prod'
  ? require('../config/prod') : require('../config/dev')
const User = require('../models/user')

module.exports = (passport) => {
  const parameters = {
    secretOrKey: CONFIG.SECRET,
    jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken()
  };
  passport.use(new JwtStrategy(parameters, (payload, done) => {
    User.findOne({ username: payload.user.username }, (error, user) => {
      if (error) return done(error, false);
      if (user) done(null, user);
      else done(null, false);
    });
  }));
}